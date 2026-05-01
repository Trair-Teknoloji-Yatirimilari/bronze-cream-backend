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

export async function GET(request: NextRequest) {
    console.log("Get My Photos endpoint'i çağrıldı");
    try {
        const clientIP = sanitizeIP(request);
        if (!rateLimit(`get-my-photos-${clientIP}`, 100, 60000)) { // 100 request per minute
            return NextResponse.json(
                { error: "Çok fazla istek. Lütfen bekleyin." },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        console.log(searchParams);
        const uniqueId = searchParams.get('uniqueId');

        if (!uniqueId) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { uniqueId: uniqueId }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }

        const photos = await prisma.uploadedImg.findMany({ where: { userId: user.id, isPublic: true, isDeleted: false, isHidden: false }, include: { product: { select: { name: true } } } });
        return NextResponse.json({ data: photos });
    } catch (error) {
        console.error("/api/user/getMyPhotos GET error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const clientIP = sanitizeIP(request);
        if (!rateLimit(`get-my-photos-delete-${clientIP}`, 100, 60000)) { // 100 request per minute
            return NextResponse.json(
                { error: "Çok fazla istek. Lütfen bekleyin." },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const uniqueId = searchParams.get('uniqueId');
        const photoId = searchParams.get('photoId');

        if (!photoId) {
            return NextResponse.json(
                { error: "Fotoğraf bulunamadı" },
                { status: 400 }
            );
        }

        if (!uniqueId) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { uniqueId: uniqueId }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }



        const photo = await prisma.uploadedImg.findFirst({
            where: { id: photoId, userId: user.id }
        });

        if (!photo) {
            return NextResponse.json(
                { error: "Fotoğraf bulunamadı" },
                { status: 404 }
            );
        }

        if (photo.isDeleted) {
            return NextResponse.json(
                { error: "Fotoğraf zaten silinmiş" },
                { status: 400 }
            );
        }

        if (photo.isHidden) {
            return NextResponse.json(
                { error: "Fotoğraf zaten gizlenmiş" },
                { status: 400 }
            );
        }

        if (photo.userId !== user.id) {
            return NextResponse.json(
                { error: "Fotoğraf kullanıcısına ait değil" },
                { status: 400 }
            );
        }

        await prisma.uploadedImg.update({
            where: { id: photoId },
            data: { isDeleted: true, isHidden: true,isPublic: false }
        });

        return NextResponse.json({ message: "Fotoğraf başarıyla silindi" });
    } catch (error) {
        console.error("/api/user/getMyPhotos DELETE error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}