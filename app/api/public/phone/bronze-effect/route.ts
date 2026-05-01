import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/authMiddleware';

// Tip tanımlamaları
interface Point {
    x: number;
    y: number;
    brush?: number;
}

interface ProcessResponse {
    success: boolean;
    imageUrl: string;
    imageId: string;
    originalColor: number[];
    productColor: number[];
    blendedColor: number[];
}

interface ErrorResponse {
    error: string;
    details?: string;
}

// Güvenlik sabitleri
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 4096; // 4K max
const MAX_MASK_POINTS = 200000; // Max mask point sayısı

// Orijinal ve filtreli görsellerin kaydedileceği klasörler
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ORIGINAL_DIR = path.join(PUBLIC_DIR, 'original');
const FILTERED_DIR = path.join(PUBLIC_DIR, 'filtered');

// Klasörleri oluştur (varsa hata vermez)
[ORIGINAL_DIR, FILTERED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Güvenlik fonksiyonları
function validateFile(file: File): string | null {
    if (!file) return "Dosya gerekli";

    if (file.size > MAX_FILE_SIZE) {
        return `Dosya boyutu çok büyük. Max ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return "Geçersiz dosya tipi. Sadece JPEG, PNG, WebP desteklenir";
    }

    return null;
}

function validateMask(maskData: string): { isValid: boolean; error?: string; mask?: Point[] | Record<string, Point> } {
    try {
        const mask = JSON.parse(maskData);

        // Mask array veya object olmalı
        if (!Array.isArray(mask) && typeof mask !== 'object') {
            return { isValid: false, error: "Mask array veya object olmalı" };
        }

        const points = Array.isArray(mask) ? mask : Object.values(mask);

        if (points.length > MAX_MASK_POINTS) {
            return { isValid: false, error: `Çok fazla mask noktası. Max ${MAX_MASK_POINTS}` };
        }

        // Her noktanın geçerli olup olmadığını kontrol et
        for (const point of points) {
            const x = Array.isArray(point) ? point[0] : (point as Point).x;
            const y = Array.isArray(point) ? point[1] : (point as Point).y;

            if (typeof x !== 'number' || typeof y !== 'number') {
                return { isValid: false, error: "Geçersiz mask noktası formatı" };
            }

            if (x < 0 || x > MAX_DIMENSION || y < 0 || y > MAX_DIMENSION) {
                return { isValid: false, error: "Mask noktası sınırlar dışında" };
            }
        }

        return { isValid: true, mask };
    } catch {
        return { isValid: false, error: "Geçersiz mask JSON formatı" };
    }
}

function sanitizeIP(request: NextRequest): string {
    const possibleIPs = [
        request.headers.get('x-forwarded-for'),
        request.headers.get('x-real-ip'),
        request.headers.get('cf-connecting-ip'),
        request.headers.get('x-forwarded'),
        request.headers.get('x-cluster-client-ip'),
    ];

    // İlk geçerli IP'yi al
    for (const ip of possibleIPs) {
        if (ip && typeof ip === 'string') {
            // Virgülle ayrılmış IP listesinden ilkini al
            const cleanIP = ip.split(',')[0].trim();
            // Basit IP validation
            if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(cleanIP)) {
                return cleanIP;
            }
        }
    }

    return 'unknown';
}

// En çok tekrar eden renk bulma fonksiyonu
function getMostFrequentColor(pixels: number[][]): number[] {
    console.log("En çok tekrar eden renk analizi başladı");
    console.log(`Toplam piksel sayısı: ${pixels.length}`);

    // Siyah, beyaz ve gri tonlarını filtrele
    const filteredPixels = pixels.filter(([r, g, b]) => {
        const sum = r + g + b;
        // Gri tonlarını filtrele (RGB değerleri birbirine çok yakın olanlar)
        if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(b - r) < 15) {
            return false;
        }
        // Çok koyu ve çok açık renkleri filtrele
        if (sum < 150 || sum > 650) {
            return false;
        }
        return true;
    });

    console.log(`Filtrelenmiş piksel sayısı: ${filteredPixels.length}`);

    if (filteredPixels.length === 0) {
        console.log("Filtrelenmiş piksel bulunamadı, varsayılan ten rengi kullanılıyor");
        return [200, 160, 120]; // Varsayılan ten rengi
    }

    // Renkleri grupla (benzer renkleri birleştir)
    const colorGroups: Record<string, number> = {};
    filteredPixels.forEach(([r, g, b]) => {
        // Renkleri 10'ar birimlik gruplara ayır
        const groupR = Math.floor(r / 10) * 10;
        const groupG = Math.floor(g / 10) * 10;
        const groupB = Math.floor(b / 10) * 10;
        const key = `${groupR},${groupG},${groupB}`;
        colorGroups[key] = (colorGroups[key] || 0) + 1;
    });

    // En çok tekrar eden rengi bul
    let maxCount = 0;
    let mostColor: number[] = [200, 160, 120];
    Object.entries(colorGroups).forEach(([key, count]) => {
        if (count > maxCount) {
            maxCount = count;
            const [r, g, b] = key.split(',').map(Number);
            mostColor = [r, g, b];
        }
    });

    console.log(`En çok tekrar eden renk: RGB(${mostColor.join(', ')})`);
    return mostColor;
}

// Ortalama renk hesaplama
function getAverageColor(pixels: number[][]): number[] {
    if (!pixels || pixels.length === 0) return [0, 0, 0];

    const sum = pixels.reduce((acc, [r, g, b]) => {
        return [acc[0] + r, acc[1] + g, acc[2] + b];
    }, [0, 0, 0]);

    return sum.map(val => Math.round(val / pixels.length));
}

// Renk karışımı hesaplama
function blendColors(color1: number[], color2: number[], ratio: number): number[] {
    return color1.map((c1, i) => {
        const c2 = color2[i];
        return Math.round(c1 * (1 - ratio) + c2 * ratio);
    });
}

// Doku koruma fonksiyonu
async function applyTexturePreservation(
    imageBuffer: Buffer,
    mask: Point[] | Record<string, Point>,
    blendedColor: number[]
): Promise<Buffer> {
    const { data, info } = await sharp(imageBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const maskArray = Array.isArray(mask) ? mask : Object.values(mask);
    const maskPoints = new Set<string>();

    // Mask noktalarını işle
    console.log('🎨 TEXTURE PRESERVATION DEBUG:');
    console.log(`- Görüntü boyutları: ${width}x${height}`);
    console.log(`- Mask array uzunluğu: ${maskArray.length}`);

    maskArray.forEach((point, index) => {
        let x, y;

        if (Array.isArray(point)) {
            x = point[0];
            y = point[1];
        } else {
            x = point.x;
            y = point.y;
        }

        // Normalize koordinatları scale et
        if (typeof x === 'number' && typeof y === 'number') {
            if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                x = Math.round(x * width);
                y = Math.round(y * height);
            }

            if (index < 3) {
                console.log(`- Texture nokta ${index}: scaled (${x}, ${y})`);
            }

            if (x >= 0 && x < width && y >= 0 && y < height) {
                // Normalize brush'ı gerçek image boyutlarına scale et  
                const normalizedBrush = point.brush || 0.04;
                const brushSize = Math.round(normalizedBrush * Math.min(width, height));
                const actualBrushSize = Math.max(40, Math.min(120, brushSize * 4));

                for (let dy = -actualBrushSize; dy <= actualBrushSize; dy += 1) {
                    for (let dx = -actualBrushSize; dx <= actualBrushSize; dx += 1) {
                        if (dx * dx + dy * dy <= actualBrushSize * actualBrushSize) {
                            const px = Math.max(0, Math.min(width - 1, x + dx));
                            const py = Math.max(0, Math.min(height - 1, y + dy));
                            maskPoints.add(`${px},${py}`);
                        }
                    }
                }
            }
        }
    });

    console.log(`- Texture mask noktası sayısı: ${maskPoints.size}`);

    // Seçili alana yeni rengi uygula ve doku koruması yap
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (maskPoints.has(`${x},${y}`)) {
                const idx = (y * width + x) * 4;
                const originalPixel = [data[idx], data[idx + 1], data[idx + 2]];

                // Doku koruması için orijinal piksel değerlerini kullan
                const textureFactor = 0.55; // 0.8'den 0.4'e düşürdüm - daha güçlü efekt için
                const newColor = blendColors(originalPixel, blendedColor, textureFactor);

                data[idx] = newColor[0];
                data[idx + 1] = newColor[1];
                data[idx + 2] = newColor[2];
            }
        }
    }

    // İşlenmiş görüntüyü oluştur
    return sharp(data, {
        raw: {
            width: width,
            height: height,
            channels: 4
        }
    }).blur(1).png().toBuffer();
}

// HEX renk kodunu RGB diziye çevir
function hexToRgb(hex: string): number[] | null {
    if (!hex || typeof hex !== 'string') return null;
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
        clean = clean.split('').map(c => c + c).join('');
    }
    if (clean.length !== 6) return null;
    const num = parseInt(clean, 16);
    if (isNaN(num)) return null;
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Ana POST endpoint
export async function POST(request: NextRequest): Promise<NextResponse<ProcessResponse | ErrorResponse>> {
    try {
        console.log("Bronze effect endpoint çağrıldı");

        // Rate limiting kontrolü
        const clientIP = sanitizeIP(request);
        if (!rateLimit(`bronze-effect-${clientIP}`, 10, 60000)) { // 10 request per minute
            return NextResponse.json(
                { error: "Çok fazla istek. Lütfen bekleyin." },
                { status: 429 }
            );
        }

        const formData = await request.formData();
        const image = formData.get('image') as File;
        const maskData = formData.get('mask') as string;
        const selectedProductId = formData.get('selectedProduct') as string;
        const deviceInfoData = formData.get('deviceInfo') as string;

        // Input validation
        if (!image) {
            return NextResponse.json({ error: "Görsel dosyası gerekli" }, { status: 400 });
        }

        const fileValidation = validateFile(image);
        if (fileValidation) {
            return NextResponse.json({ error: fileValidation }, { status: 400 });
        }

        if (!maskData) {
            return NextResponse.json({ error: "Mask verisi gerekli" }, { status: 400 });
        }

        const maskValidation = validateMask(maskData);
        if (!maskValidation.isValid) {
            return NextResponse.json({ error: maskValidation.error || "Mask validation failed" }, { status: 400 });
        }

        if (!selectedProductId) {
            return NextResponse.json({ error: "Ürün ID gerekli" }, { status: 400 });
        }

        // Ürünü veritabanından çek
        const selectedProduct = await prisma.products.findUnique({
            where: { id: selectedProductId }
        });
        if (!selectedProduct) {
            return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
        }

        const userAgent = request.headers.get('user-agent')?.substring(0, 500) || 'unknown'; // Limit length

        // Device info parse et
        let deviceInfo = null;
        try {
            if (deviceInfoData) {
                deviceInfo = JSON.parse(deviceInfoData);
                console.log('📱 Device Info alındı:', {
                    brand: deviceInfo.deviceBrand,
                    model: deviceInfo.deviceId,
                    os: `${deviceInfo.systemName} ${deviceInfo.systemVersion}`,
                    uniqueId: deviceInfo.uniqueId?.substring(0, 8) + '...'
                });
            }
        } catch (error) {
            console.warn('Device info parse edilemedi:', error);
        }

        // Ban kontrolü - UniqueID ile öncelik verin
        let bannedUser = null;
        if (deviceInfo?.uniqueId) {
            bannedUser = await prisma.user.findFirst({
                where: {
                    uniqueId: deviceInfo.uniqueId,
                    isBanned: true
                }
            });
        }

        if (bannedUser) {
            console.log(`🚫 Banned device detected: ${bannedUser.uniqueId?.substring(0, 8)}...`);
            return NextResponse.json({
                error: "Bu cihaz yasaklanmış. Destek ekibi ile iletişime geçin."
            }, { status: 403 });
        }

        // Kullanıcı kontrolü - UniqueID ile önce ara
        let hasUserExist = null;
        if (deviceInfo?.uniqueId) {
            hasUserExist = await prisma.user.findFirst({
                where: {
                    uniqueId: deviceInfo.uniqueId
                }
            });
        }

        // UniqueID ile bulunamazsa IP/UserAgent ile ara
        if (!hasUserExist) {
            hasUserExist = await prisma.user.findFirst({
                where: {
                    userIP: clientIP,
                    userAgent: userAgent
                }
            });
        }

        if (!hasUserExist) {
            const createUser = await prisma.user.create({
                data: {
                    userIP: clientIP,
                    userAgent: userAgent,
                    // Device info'dan gelen bilgileri ekle
                    ...(deviceInfo && {
                        uniqueId: deviceInfo.uniqueId,
                        deviceId: deviceInfo.deviceId,
                        deviceName: deviceInfo.deviceName,
                        deviceBrand: deviceInfo.deviceBrand,
                        deviceType: deviceInfo.deviceType,
                        systemName: deviceInfo.systemName,
                        systemVersion: deviceInfo.systemVersion,
                        appVersion: deviceInfo.appVersion,
                        buildNumber: deviceInfo.buildNumber,
                        bundleId: deviceInfo.bundleId,
                        isEmulator: deviceInfo.isEmulator,
                        isTablet: deviceInfo.isTablet,
                    })
                }
            });
            if (!createUser) {
                return NextResponse.json({ error: "Kullanıcı oluşturulamadı" }, { status: 500 });
            }
            console.log(`✅ Yeni kullanıcı oluşturuldu: ${createUser.id} (${deviceInfo?.deviceBrand} ${deviceInfo?.deviceId})`);
        } else {
            // Mevcut kullanıcının device bilgilerini güncelle (eksikse)
            if (deviceInfo && (!hasUserExist.uniqueId || !hasUserExist.deviceBrand)) {
                await prisma.user.update({
                    where: { id: hasUserExist.id },
                    data: {
                        ...(deviceInfo.uniqueId && !hasUserExist.uniqueId && { uniqueId: deviceInfo.uniqueId }),
                        ...(deviceInfo.deviceId && !hasUserExist.deviceId && { deviceId: deviceInfo.deviceId }),
                        ...(deviceInfo.deviceName && !hasUserExist.deviceName && { deviceName: deviceInfo.deviceName }),
                        ...(deviceInfo.deviceBrand && !hasUserExist.deviceBrand && { deviceBrand: deviceInfo.deviceBrand }),
                        ...(deviceInfo.deviceType && !hasUserExist.deviceType && { deviceType: deviceInfo.deviceType }),
                        ...(deviceInfo.systemName && !hasUserExist.systemName && { systemName: deviceInfo.systemName }),
                        ...(deviceInfo.systemVersion && !hasUserExist.systemVersion && { systemVersion: deviceInfo.systemVersion }),
                        ...(deviceInfo.appVersion && !hasUserExist.appVersion && { appVersion: deviceInfo.appVersion }),
                        ...(deviceInfo.buildNumber && !hasUserExist.buildNumber && { buildNumber: deviceInfo.buildNumber }),
                        ...(deviceInfo.bundleId && !hasUserExist.bundleId && { bundleId: deviceInfo.bundleId }),
                        ...(deviceInfo.isEmulator !== undefined && hasUserExist.isEmulator === null && { isEmulator: deviceInfo.isEmulator }),
                        ...(deviceInfo.isTablet !== undefined && hasUserExist.isTablet === null && { isTablet: deviceInfo.isTablet }),
                    }
                });
                console.log(`🔄 Kullanıcı device bilgileri güncellendi: ${hasUserExist.id}`);
            }
        }

        // Kullanıcıyı tekrar getir (güncellenmiş bilgilerle)
        const user = deviceInfo?.uniqueId
            ? await prisma.user.findFirst({
                where: { uniqueId: deviceInfo.uniqueId }
            })
            : await prisma.user.findFirst({
                where: {
                    userIP: clientIP,
                    userAgent: userAgent
                }
            });

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
        }

        if (user.isBanned) {
            return NextResponse.json({ error: "Hesabınız yasaklanmış" }, { status: 403 });
        }

        // Upload log'u selectedProduct parse'dan sonra oluşturacağız

        console.log("Gelen veriler:", {
            hasFile: !!image,
            hasMask: !!maskData,
            hasProduct: !!selectedProductId
        });

        const mask = maskValidation.mask!;
        // const selectedProduct = productValidation.product!; // ARTIK GEREKSİZ

        // Upload log oluştur (selectedProduct parse'dan sonra)
        const createUploadLog = await prisma.uploadLogs.create({
            data: {
                userIp: clientIP,
                userAgent: userAgent,
                userId: user.id,
                uploadedImgId: null,
                // Product bilgilerini ekle
                productId: selectedProduct.id?.toString() || "",
            }
        });

        if (!createUploadLog) {
            return NextResponse.json({ error: "Log oluşturulamadı" }, { status: 500 });
        }

        // Görsel dosyasını buffer'a çevir
        const imageBuffer = Buffer.from(await image.arrayBuffer());

        // Görsel boyut kontrolü
        const imageMetadata = await sharp(imageBuffer).metadata();
        if (!imageMetadata.width || !imageMetadata.height) {
            return NextResponse.json({ error: "Geçersiz görsel dosyası" }, { status: 400 });
        }

        if (imageMetadata.width > MAX_DIMENSION || imageMetadata.height > MAX_DIMENSION) {
            return NextResponse.json({
                error: `Görsel boyutu çok büyük. Max ${MAX_DIMENSION}x${MAX_DIMENSION}px`
            }, { status: 400 });
        }

        console.log('Görüntü işleniyor...');
        const { data, info } = await sharp(imageBuffer)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        console.log('Görüntü işlendi');

        // Mask noktalarını işle
        const maskPixels: number[][] = [];
        const width = info.width;
        const height = info.height;
        const maskPoints = new Set<string>();

        // Mask verisini array'e çevir
        const maskArray = Array.isArray(mask) ? mask : Object.values(mask);

        console.log('🔍 BACKEND DEBUG - Mask Analizi:');
        console.log(`- Görüntü boyutları: ${width}x${height}`);
        console.log(`- Mask array uzunluğu: ${maskArray.length}`);
        console.log(`- İlk 5 mask noktası:`, maskArray.slice(0, 5));

        maskArray.forEach((point, index) => {
            let x, y;

            // Normalize koordinat kontrolü (0-1 arası gelirse scale et)
            if (Array.isArray(point)) {
                x = point[0];
                y = point[1];
            } else {
                x = point.x;
                y = point.y;
            }

            // Normalize koordinatları gerçek image koordinatlarına çevir
            if (typeof x === 'number' && typeof y === 'number') {
                // Eğer 0-1 arası normalize koordinat ise scale et
                if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                    x = Math.round(x * width);
                    y = Math.round(y * height);

                    if (index < 5) {
                        console.log(`- Nokta ${index}: normalized (${point.x?.toFixed(3)}, ${point.y?.toFixed(3)}) -> scaled (${x}, ${y})`);
                    }
                } else {
                    if (index < 5) {
                        console.log(`- Nokta ${index}: absolute (${x}, ${y})`);
                    }
                }

                // Bounds kontrolü
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    // Normalize brush'ı gerçek image boyutlarına scale et
                    const normalizedBrush = point.brush || 0.04; // Default %4 of image size
                    const brushSize = Math.round(normalizedBrush * Math.min(width, height));
                    const actualBrushSize = Math.max(40, Math.min(120, brushSize * 4)); // 8-80 piksel arası sınırla

                    if (index < 3) {
                        console.log(`- Brush ${index}: normalized=${normalizedBrush.toFixed(4)} -> scaled=${actualBrushSize}px`);
                    }

                    // Daha yoğun brush coverage için step size'ı 1 yap
                    for (let dy = -actualBrushSize; dy <= actualBrushSize; dy += 1) {
                        for (let dx = -actualBrushSize; dx <= actualBrushSize; dx += 1) {
                            if (dx * dx + dy * dy <= actualBrushSize * actualBrushSize) {
                                const px = Math.max(0, Math.min(width - 1, x + dx));
                                const py = Math.max(0, Math.min(height - 1, y + dy));
                                maskPoints.add(`${px},${py}`);
                            }
                        }
                    }
                } else if (index < 5) {
                    console.log(`❌ Nokta ${index} sınırlar dışında: (${x}, ${y}) - bounds: 0-${width - 1}, 0-${height - 1}`);
                }
            }
        });

        console.log(`✅ Geçerli mask noktası sayısı: ${maskPoints.size}`);

        // Mask noktalarından renk analizi için piksel topla
        for (const pointKey of maskPoints) {
            const [px, py] = pointKey.split(',').map(Number);
            const idx = (py * width + px) * 4;
            if (idx >= 0 && idx < data.length - 3) {
                maskPixels.push([
                    data[idx],
                    data[idx + 1],
                    data[idx + 2]
                ]);
            }
        }

        console.log('Renk analizi başladı');
        // Renk analizi
        const mostFrequentColor = getMostFrequentColor(maskPixels);
        const averageColor = getAverageColor(maskPixels);
        console.log('Renk analizi tamamlandı');

        // Ürün rengi ile kombinle
        let productColor: number[] = [180, 120, 70]; // Varsayılan bronz rengi
        if (selectedProduct && typeof selectedProduct.filterColor === 'string') {
            const rgb = hexToRgb(selectedProduct.filterColor);
            if (rgb) productColor = rgb;
        }
        const blendedColor = blendColors(mostFrequentColor, productColor, 0.6);

        console.log('Doku koruması uygulanıyor');
        // Doku koruması uygula
        const processedImageBuffer = await applyTexturePreservation(
            imageBuffer,
            mask,
            blendedColor
        );

        // İşlenmiş görüntüyü kaydet
        const timestamp = Date.now();
        const uniqueId = randomUUID().substring(0, 8);
        const filename = `filtered-${timestamp}-${uniqueId}.png`;
        const filteredImagePath = path.join(FILTERED_DIR, filename);

        await sharp(processedImageBuffer)
            .png()
            .toFile(filteredImagePath);

        console.log('İşlem tamamlandı, sonuç döndürülüyor');

        // Sonucu döndür - product bilgisiyle
        const imageUrl = `/filtered/${filename}`;

        console.log('🛍️ Product bilgisi kaydediliyor:', {
            id: selectedProduct.id,
            name: selectedProduct.name,
            hasProduct: !!selectedProduct
        });

        // Product bilgisiyle UploadedImg oluştur
        const createUploadedImg = await prisma.uploadedImg.create({
            data: {
                url: imageUrl,
                userId: user.id,
                isPublic: false,
                productId: selectedProduct.id?.toString() || "",
            }
        });

        console.log('💾 Product bilgisi kaydedildi:', {
            imageId: createUploadedImg.id,
            productId: selectedProduct.id?.toString(),
            productName: selectedProduct.name
        });

        if (!createUploadedImg) {
            return NextResponse.json({ error: "Görsel kaydedilemedi" }, { status: 500 });
        }

        const updateUploadLog = await prisma.uploadLogs.update({
            where: {
                id: createUploadLog.id
            },
            data: {
                uploadedImgId: createUploadedImg.id,
                productId: selectedProduct.id?.toString() || "",
            }
        });

        if (!updateUploadLog) {
            return NextResponse.json({ error: "Log güncellenemedi" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            imageUrl: imageUrl,
            imageId: createUploadedImg.id, // Paylaş için gerekli
            originalColor: averageColor,
            productColor: productColor,
            blendedColor: blendedColor
        });

    } catch (error) {
        console.error('Bronze effect API error:', error);
        return NextResponse.json({
            error: "İşlem sırasında bir hata oluştu"
        }, { status: 500 });
    }
}

// Test endpoint'i
export async function GET() {
    return NextResponse.json({ message: "Bronze effect API çalışıyor" });
}
