import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/authMiddleware';

// IP sanitize fonksiyonu
function sanitizeIP(request: NextRequest): string {
    const possibleIPs = [
        request.headers.get('x-forwarded-for'),
        request.headers.get('x-real-ip'),
        request.headers.get('cf-connecting-ip'),
        request.headers.get('x-forwarded'),
        request.headers.get('x-cluster-client-ip'),
    ];

    for (const ip of possibleIPs) {
        if (ip && typeof ip === 'string') {
            const cleanIP = ip.split(',')[0].trim();
            if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(cleanIP)) {
                return cleanIP;
            }
        }
    }

    return 'unknown';
}

// Paylaş endpoint'i
export async function POST(request: NextRequest) {
    try {
        console.log("Paylaş endpoint'i çağrıldı");
        // Rate limiting kontrolü
        const clientIP = sanitizeIP(request);
        if (!rateLimit(`share-photo-${clientIP}`, 5, 60000)) { // 5 request per minute
            return NextResponse.json(
                { error: "Çok fazla paylaşım isteği. Lütfen bekleyin." },
                { status: 429 }
            );
        }

        const { imageId, uniqueId } = await request.json();

        if (!imageId) {
            return NextResponse.json(
                { error: "Image ID gerekli" },
                { status: 400 }
            );
        }

        if (!uniqueId) {
            return NextResponse.json(
                { error: "Unique ID gerekli" },
                { status: 400 }
            );
        }

        console.log(uniqueId);
        // Kullanıcıyı bul
        const user = await prisma.user.findFirst({
            where: {
                uniqueId: uniqueId
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }

        if (user.isBanned) {
            return NextResponse.json(
                { error: "Hesabınız yasaklanmış" },
                { status: 403 }
            );
        }

        // Image'ı bul ve kullanıcıya ait olduğunu kontrol et
        const uploadedImg = await prisma.uploadedImg.findFirst({
            where: {
                id: imageId,
                userId: user.id,
                isDeleted: false
            }
        });

        if (!uploadedImg) {
            return NextResponse.json(
                { error: "Fotoğraf bulunamadı veya size ait değil" },
                { status: 404 }
            );
        }

        //Kullanıcının günde en fazla 5 tane share yapmasına izin veren kod
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
        const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

        const userDailyUploadCount = await prisma.uploadedImg.count({
            where: {
                isPublic: true,
                updatedAt: {
                    gte: todayStart,
                    lte: todayEnd,
                },
                userId: user.id
            }
        })
        console.log('userDailyUploadCount:',userDailyUploadCount)

        if (userDailyUploadCount >= 5) {
            return NextResponse.json(
                { error: "Günlük en fazla 5 tane paylaşım yapabilirsiniz" },
                { status: 403 }
            );
        }

        // Fotoğrafı public yap
        const updatedImg = await prisma.uploadedImg.update({
            where: {
                id: imageId
            },
            data: {
                isPublic: true,
                updatedAt: new Date()
            }
        });

        console.log(`Fotoğraf paylaşıldı: ${imageId}`);

        return NextResponse.json({
            success: true,
            message: "Fotoğraf başarıyla paylaşıldı!",
            imageId: updatedImg.id,
            imageUrl: updatedImg.url,
            sharedAt: updatedImg.updatedAt
        });

    } catch (error) {
        console.error('Share photo API error:', error);
        return NextResponse.json({
            error: "Paylaşım sırasında bir hata oluştu"
        }, { status: 500 });
    }
}

// Test endpoint'i  
export async function GET() {
    try {
        // Rastgele 10 public fotoğraf getir
        const data = await prisma.$queryRaw`
            SELECT * FROM "UploadedImg"
            WHERE "isPublic" = true AND "isDeleted" = false AND "isHidden" = false
            ORDER BY RANDOM()
            LIMIT 10
        `;
        return NextResponse.json({ ok: true, data: data });
    } catch (error) {
        console.error('Share photo API error:', error);
        return NextResponse.json({ ok: false, error: 'Paylaşılan fotoğraf bulunamadı' }, { status: 500 });
    }
} 