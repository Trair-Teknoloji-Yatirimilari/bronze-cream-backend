import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, rateLimit } from "@/lib/authMiddleware";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Rate limiting kontrolü
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`statistics-get-${clientIP}`, 50, 60000)) { // 50 request per minute
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    // Paralel olarak tüm istatistikleri çek
    const [
      totalUploads,
      totalUsers,
      todayUploads,
      todayUsers,
      bannedUsers,
      publicUploads,
      hiddenUploads,
      deletedUploads,
      // Yeni device bazlı istatistikler
      deviceStats,
      brandStats,
      osStats,
      emulatorCount,
      tabletCount,
      uniqueDevicesCount,
    ] = await Promise.all([
      prisma.uploadedImg.count({
        where: { isDeleted: false }
      }),
      prisma.user.count(),
      prisma.uploadedImg.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.user.count({
        where: { isBanned: true },
      }),
      prisma.uploadedImg.count({
        where: { 
          isDeleted: false,
          isPublic: true 
        },
      }),
      prisma.uploadedImg.count({
        where: { 
          isDeleted: false,
          isHidden: true 
        },
      }),
      prisma.uploadedImg.count({
        where: { isDeleted: true },
      }),
      // Device türleri (systemName bazlı)
      prisma.user.groupBy({
        by: ['systemName'],
        _count: {
          systemName: true,
        },
        where: {
          systemName: {
            not: null,
          },
        },
      }),
      // Marka dağılımı
      prisma.user.groupBy({
        by: ['deviceBrand'],
        _count: {
          deviceBrand: true,
        },
        where: {
          deviceBrand: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            deviceBrand: 'desc',
          },
        },
        take: 10, // Top 10 marka
      }),
      // OS versiyonları
      prisma.user.groupBy({
        by: ['systemName', 'systemVersion'],
        _count: {
          systemName: true,
        },
        where: {
          systemName: {
            not: null,
          },
          systemVersion: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            systemName: 'desc',
          },
        },
        take: 15, // Top 15 OS versiyonu
      }),
      // Emulator sayısı
      prisma.user.count({
        where: {
          isEmulator: true,
        },
      }),
      // Tablet sayısı
      prisma.user.count({
        where: {
          isTablet: true,
        },
      }),
      // Unique device sayısı (uniqueId olan)
      prisma.user.count({
        where: {
          uniqueId: {
            not: null,
          },
        },
      }),
    ]);

    // Dün ile karşılaştırma için
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const [yesterdayUploads, yesterdayUsers] = await Promise.all([
      prisma.uploadedImg.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: yesterday,
            lte: yesterdayEnd,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: yesterday,
            lte: yesterdayEnd,
          },
        },
      }),
    ]);

    // Son 7 günlük trend verileri
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const weeklyTrends = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const [uploads, users] = await Promise.all([
          prisma.uploadedImg.count({
            where: {
              isDeleted: false,
              createdAt: {
                gte: date,
                lt: nextDay,
              },
            },
          }),
          prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDay,
              },
            },
          }),
        ]);

        return {
          date: date.toISOString().split('T')[0],
          uploads,
          users,
        };
      })
    );

    // Büyüme oranlarını hesapla
    const uploadGrowth = yesterdayUploads === 0 
      ? (todayUploads > 0 ? 100 : 0)
      : Math.round(((todayUploads - yesterdayUploads) / yesterdayUploads) * 100);

    const userGrowth = yesterdayUsers === 0 
      ? (todayUsers > 0 ? 100 : 0)
      : Math.round(((todayUsers - yesterdayUsers) / yesterdayUsers) * 100);

    // Android ve iOS sayılarını doğru hesapla
    const androidUsers = deviceStats.find(stat => stat.systemName?.toLowerCase() === 'android')?._count.systemName || 0;
    const iosUsers = deviceStats.find(stat => stat.systemName?.toLowerCase() === 'ios')?._count.systemName || 0;

    // Fallback: Eski kullanıcılar için userAgent bazlı hesaplama
    const [fallbackAndroid, fallbackIos] = await Promise.all([
      prisma.user.count({
        where: {
          systemName: null,
          userAgent: {
            contains: "Android",
            mode: 'insensitive',
          },
        },
      }),
      prisma.user.count({
        where: {
          systemName: null,
          userAgent: {
            contains: "iPhone",
            mode: 'insensitive',
          },
        },
      }),
    ]);

    const statistics = {
      uploads: {
        total: totalUploads,
        today: todayUploads,
        yesterday: yesterdayUploads,
        growth: uploadGrowth,
        public: publicUploads,
        hidden: hiddenUploads,
        deleted: deletedUploads,
      },
      users: {
        total: totalUsers,
        today: todayUsers,
        yesterday: yesterdayUsers,
        growth: userGrowth,
        android: androidUsers + fallbackAndroid,
        ios: iosUsers + fallbackIos,
        banned: bannedUsers,
        active: totalUsers - bannedUsers,
        uniqueDevices: uniqueDevicesCount,
      },
      devices: {
        platforms: deviceStats.map(stat => ({
          name: stat.systemName || 'Bilinmiyor',
          count: stat._count.systemName,
        })),
        brands: brandStats.map(stat => ({
          name: stat.deviceBrand || 'Bilinmiyor',
          count: stat._count.deviceBrand,
        })),
        osVersions: osStats.map(stat => ({
          name: `${stat.systemName} ${stat.systemVersion}`,
          platform: stat.systemName,
          version: stat.systemVersion,
          count: stat._count.systemName,
        })),
        emulators: emulatorCount,
        tablets: tabletCount,
        phones: uniqueDevicesCount - tabletCount,
      },
      trends: {
        weekly: weeklyTrends,
      },
      system: {
        totalLogs: await prisma.uploadLogs.count(),
        todayLogs: await prisma.uploadLogs.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      },
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Statistics API error:", error);
    return NextResponse.json(
      { error: "İstatistik verileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
});