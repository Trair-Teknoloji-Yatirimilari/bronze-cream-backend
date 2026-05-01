import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/authMiddleware';

// Güvenlik sabitleri
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 4096; // 4K max

// Upload Response interface
interface UploadResponse {
    success: boolean;
    imageUrl: string;
    imageId: string;
}

interface ErrorResponse {
    error: string;
}

interface Product {
    id: string;
    name: string;
}

// Filtreli görsellerin kaydedileceği klasör
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const FILTERED_DIR = path.join(PUBLIC_DIR, 'filtered');

// Klasörü oluştur (varsa hata vermez)
if (!fs.existsSync(FILTERED_DIR)) {
    fs.mkdirSync(FILTERED_DIR, { recursive: true });
}

function validateFile(file: File): string | null {
    // Dosya boyut kontrolü
    if (file.size > MAX_FILE_SIZE) {
        return `Dosya boyutu çok büyük. Max ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // MIME type kontrolü
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return `Desteklenmeyen dosya türü. Sadece ${ALLOWED_MIME_TYPES.join(', ')} desteklenir`;
    }

    return null;
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

function validateProduct(productData: string): { isValid: boolean; error?: string; product?: Product } {
    try {
        const product = JSON.parse(productData);

        if (!product || typeof product !== 'object') {
            return { isValid: false, error: "Geçersiz ürün verisi" };
        }

        if (!product.name) {
            return { isValid: false, error: "Ürün adı gerekli" };
        }

        return { isValid: true, product };
    } catch {
        return { isValid: false, error: "Geçersiz ürün JSON formatı" };
    }
}

// Ana POST endpoint - sadece upload yapar, filtre uygulamaz
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse | ErrorResponse>> {
    try {
        console.log("📤 Upload filtered photo endpoint çağrıldı");

        // Rate limiting kontrolü
        const clientIP = sanitizeIP(request);
        if (!rateLimit(`upload-filtered-photo-${clientIP}`, 5, 60000)) { // 5 request per minute
            return NextResponse.json(
                { error: "Çok fazla istek. Lütfen bekleyin." },
                { status: 429 }
            );
        }

        const formData = await request.formData();
        const image = formData.get('image') as File;
        const selectedProductData = formData.get('selectedProduct') as string;
        const deviceInfoData = formData.get('deviceInfo') as string;

        // Input validation
        if (!image) {
            return NextResponse.json({ error: "Görsel dosyası gerekli" }, { status: 400 });
        }

        const fileValidation = validateFile(image);
        if (fileValidation) {
            return NextResponse.json({ error: fileValidation }, { status: 400 });
        }

        if (!selectedProductData) {
            return NextResponse.json({ error: "Ürün verisi gerekli" }, { status: 400 });
        }

        const productValidation = validateProduct(selectedProductData);
        if (!productValidation.isValid) {
            return NextResponse.json({ error: productValidation.error || "Product validation failed" }, { status: 400 });
        }

        const userAgent = request.headers.get('user-agent')?.substring(0, 500) || 'unknown';

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

        // Kullanıcı kontrolü ve oluşturma (bronze-effect'teki aynı mantık)
        let hasUserExist = null;
        if (deviceInfo?.uniqueId) {
            hasUserExist = await prisma.user.findFirst({
                where: {
                    uniqueId: deviceInfo.uniqueId
                }
            });
        }

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

        const selectedProduct = productValidation.product!;

        // Upload log oluştur
        const createUploadLog = await prisma.uploadLogs.create({
            data: {
                userIp: clientIP,
                userAgent: userAgent,
                userId: user.id,
                uploadedImgId: null,
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

        console.log('📤 Filtreli fotoğraf kaydediliyor... (filtre uygulanmayacak)');

        // ⭐ Önemli: Burada filtre uygulamıyoruz, direkt kaydediyoruz
        // Çünkü RealTimeScreen'den gelen fotoğraf zaten filtrelenmiş durumda

        // Fotoğrafı kaydet
        const timestamp = Date.now();
        const uniqueId = randomUUID().substring(0, 8);
        const filename = `realtime-${timestamp}-${uniqueId}.png`;
        const filteredImagePath = path.join(FILTERED_DIR, filename);

        // Fotoğrafı direkt PNG olarak kaydet (filtre uygulamadan)
        await sharp(imageBuffer)
            .png()
            .toFile(filteredImagePath);

        console.log('✅ Filtreli fotoğraf kaydedildi:', filename);

        // Sonucu döndür
        const imageUrl = `/filtered/${filename}`;

        console.log('🛍️ Product bilgisi kaydediliyor:', {
            id: selectedProduct.id,
            name: selectedProduct.name,
            type: 'realtime-filtered'
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

        console.log('💾 Filtreli fotoğraf veritabanına kaydedildi:', {
            imageId: createUploadedImg.id,
            productId: selectedProduct.id?.toString(),
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
        });

    } catch (error) {
        console.error('Upload filtered photo API error:', error);
        return NextResponse.json({
            error: "İşlem sırasında bir hata oluştu"
        }, { status: 500 });
    }
}

// Test endpoint'i
export async function GET() {
    return NextResponse.json({ message: "Upload filtered photo API çalışıyor" });
} 