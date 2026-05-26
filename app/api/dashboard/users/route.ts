import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { User } from "@/lib/generated/prisma";
import { withAuth, validateInput, rateLimit } from "@/lib/authMiddleware";

const PAGE_SIZE = 10;

function mapToUsers(item: User & { uploadedImagesCount: number }) {
  // Device bilgisini doğru şekilde belirle
  let deviceInfo = "Diğer";
  
  // Önce gerçek device bilgilerini kontrol et
  if (item.deviceBrand || item.systemName) {
    if (item.deviceBrand && item.systemName) {
      deviceInfo = `${item.deviceBrand} (${item.systemName})`;
    } else if (item.deviceBrand) {
      deviceInfo = item.deviceBrand;
    } else if (item.systemName) {
      deviceInfo = item.systemName;
    }
  } else if (item.userAgent) {
    const userAgent = item.userAgent.toLowerCase();
    if (userAgent.includes("android") || userAgent.includes("okhttp")) {
      deviceInfo = "Android";
    } else if (userAgent.includes("iphone") || userAgent.includes("ios") || userAgent.includes("cfnetwork")) {
      deviceInfo = "iOS";
    }
  }

  return {
    id: item.id,
    userIP: item.userIP || "Bilinmiyor",
    userAgent: item.userAgent || "Bilinmiyor", 
    device: deviceInfo, // Düzeltilmiş device bilgisi
    isBanned: item.isBanned,
    uploadedImagesCount: item.uploadedImagesCount,
    createdAt: item.createdAt.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    // Yeni device bilgileri - direkt database'den
    uniqueId: item.uniqueId,
    deviceBrand: item.deviceBrand,
    deviceId: item.deviceId,
    deviceName: item.deviceName,
    deviceType: item.deviceType,
    systemName: item.systemName,
    systemVersion: item.systemVersion,
    appVersion: item.appVersion,
    isEmulator: item.isEmulator,
    isTablet: item.isTablet,
  };
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Rate limiting kontrolü
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`users-get-${clientIP}`, 100, 60000)) { // 100 request per minute
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || PAGE_SIZE.toString()), 100); // Max 100

    if (page < 1 || pageSize < 1) {
      return NextResponse.json(
        { error: "Geçersiz sayfa parametreleri" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * pageSize;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        userIP: true,
        userAgent: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        pushToken: true, // Eksik alan eklendi
        // Device bilgileri - eklendi
        uniqueId: true,
        deviceBrand: true,
        deviceId: true,
        deviceName: true,
        deviceType: true,
        systemName: true,
        systemVersion: true,
        appVersion: true,
        buildNumber: true,
        bundleId: true,
        isEmulator: true,
        isTablet: true,
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    });

    // Her kullanıcı için yüklenen fotoğraf sayısını hesapla
    const usersWithImageCounts = await Promise.all(
      users.map(async (user) => {
        const imageCount = await prisma.uploadedImg.count({
          where: {
            userId: user.id,
            isDeleted: false,
          },
        });
        return { ...user, uploadedImagesCount: imageCount };
      })
    );

    const totalCount = await prisma.user.count();
    const data = usersWithImageCounts.map(mapToUsers);

    return NextResponse.json({
      data,
      totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Users GET API error:", error);
    return NextResponse.json(
      { error: "Kullanıcı verileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, adminId?: string) => {
  try {
    // Rate limiting kontrolü
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`users-put-${clientIP}`, 30, 60000)) { // 30 request per minute
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Input validation
    const validationErrors = await validateInput(body, {
      userId: { required: true, type: "string" },
      action: { required: true, type: "string" },
      banType: { required: false, type: "string" } // 'user' veya 'device'
    });

    if (validationErrors) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: validationErrors },
        { status: 400 }
      );
    }

    const { userId, action, banType = 'user' } = body;

    if (action !== "ban" && action !== "unban") {
      return NextResponse.json(
        { error: "Geçersiz işlem türü. Sadece 'ban' veya 'unban' kullanılabilir" },
        { status: 400 }
      );
    }

    if (banType !== "user" && banType !== "device") {
      return NextResponse.json(
        { error: "Geçersiz ban türü. Sadece 'user' veya 'device' kullanılabilir" },
        { status: 400 }
      );
    }

    // UUID format kontrolü
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı ID formatı" },
        { status: 400 }
      );
    }

    // Kullanıcının var olup olmadığını kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isBanned: true,
        uniqueId: true,
        deviceBrand: true,
        deviceId: true,
        deviceName: true,
        userIP: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    const targetBanStatus = action === "ban";
    let result: {
      banType: string;
      affectedUsers: number;
      userIds: string[];
      uniqueId?: string;
      deviceInfo?: string;
      user?: { id: string; isBanned: boolean };
    } = {
      banType: banType,
      affectedUsers: 0,
      userIds: [],
    };

    if (banType === "device" && existingUser.uniqueId) {
      // Device bazlı ban: Aynı uniqueId'ye sahip tüm kullanıcıları ban/unban et
      
      // Önce aynı uniqueId'ye sahip kullanıcıları bul
      const sameDeviceUsers = await prisma.user.findMany({
        where: {
          uniqueId: existingUser.uniqueId,
        },
        select: {
          id: true,
          isBanned: true,
        },
      });

      // Tüm hesapları güncelle
      const updateResult = await prisma.user.updateMany({
        where: {
          uniqueId: existingUser.uniqueId,
        },
        data: {
          isBanned: targetBanStatus,
        },
      });

      result = {
        banType: "device",
        uniqueId: existingUser.uniqueId.substring(0, 8) + "...",
        deviceInfo: `${existingUser.deviceBrand || 'Bilinmiyor'} ${existingUser.deviceId || ''}`.trim(),
        affectedUsers: updateResult.count,
        userIds: sameDeviceUsers.map(u => u.id),
      };

      console.log(`🔒 Admin ${adminId} performed DEVICE ${action} on uniqueId ${existingUser.uniqueId.substring(0, 8)}... affecting ${updateResult.count} users`);

    } else {
      // Kullanıcı bazlı ban: Sadece belirtilen kullanıcıyı ban/unban et
      
      // Aynı duruma tekrar set etmeye çalışıyor mu?
      if (existingUser.isBanned === targetBanStatus) {
        return NextResponse.json(
          { 
            error: targetBanStatus 
              ? "Kullanıcı zaten yasaklı" 
              : "Kullanıcı zaten aktif" 
          },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: targetBanStatus,
        },
      });

      result = {
        banType: "user",
        affectedUsers: 1,
        userIds: [updatedUser.id],
        user: {
          id: updatedUser.id,
          isBanned: updatedUser.isBanned,
        },
      };

      console.log(`👤 Admin ${adminId} performed USER ${action} on user ${userId}`);
    }

    return NextResponse.json({
      ok: true,
      message: action === "ban" 
        ? (banType === "device" 
          ? `Cihaz başarıyla yasaklandı (${result.affectedUsers} kullanıcı etkilendi)` 
          : "Kullanıcı başarıyla yasaklandı"
        )
        : (banType === "device" 
          ? `Cihaz yasağı başarıyla kaldırıldı (${result.affectedUsers} kullanıcı etkilendi)` 
          : "Kullanıcı yasağı başarıyla kaldırıldı"
        ),
      result,
    });
  } catch (error) {
    console.error("User ban/unban API error:", error);
    return NextResponse.json(
      { error: "İşlem gerçekleştirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}); 