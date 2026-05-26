import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, rateLimit } from "@/lib/authMiddleware";

const PAGE_SIZE = 10;

type LogWithRelations = {
  id: string;
  userIp: string;
  userAgent: string;
  productId: string | null;
  product: {
    name: string | null;
  } | null;
  createdAt: Date;
  user: {
    id: string;
    userAgent: string | null;
    isBanned: boolean;
    createdAt: Date;
    // Device bilgileri
    deviceBrand: string | null;
    deviceId: string | null;
    deviceName: string | null;
    systemName: string | null;
    systemVersion: string | null;
    isEmulator: boolean | null;
    isTablet: boolean | null;
  } | null;
  uploadedImg: {
    id: string;
    url: string;
    isPublic: boolean;
    isDeleted: boolean;
    isHidden: boolean;
    createdAt: Date;
  } | null;
};

function mapToLogs(item: LogWithRelations) {
  // Device bilgilerini işle
  const user = item.user;
  const deviceBrand = user?.deviceBrand || null;
  const deviceModel = user?.deviceId || null;
  const systemInfo = user?.systemName && user?.systemVersion 
    ? `${user.systemName} ${user.systemVersion}` 
    : null;

  // Device bilgisini doğru şekilde belirle
  let deviceInfo = "Diğer";
  
  if (user?.deviceBrand || user?.systemName) {
    if (user.deviceBrand && user.systemName) {
      deviceInfo = `${user.deviceBrand} (${user.systemName})`;
    } else if (user.deviceBrand) {
      deviceInfo = user.deviceBrand;
    } else if (user.systemName) {
      deviceInfo = user.systemName;
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
    userIp: item.userIp,
    userAgent: item.userAgent,
    device: deviceInfo, // Düzeltilmiş device bilgisi
    uploadedImgUrl: item.uploadedImg?.url || "Yok",
    createdAt: item.createdAt.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    // Yeni product bilgileri
    productName: item.product?.name || null,
    productId: item.productId,
    // Device bilgileri - direkt database'den (doğru field mapping)
    deviceBrand,
    deviceModel, // Bu aslında deviceId (model bilgisi)
    systemInfo,
    isEmulator: user?.isEmulator || null,
    isTablet: user?.isTablet || null,
  };
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Rate limiting kontrolü
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`logs-get-${clientIP}`, 100, 60000)) { // 100 request per minute
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

    const logs = await prisma.uploadLogs.findMany({
      select: {
        id: true,
        userIp: true,
        userAgent: true,
        productId: true,
        product: {
          select: {
            name: true,
          }
        },
        createdAt: true,
        user: {
          select: {
            id: true,
            userAgent: true,
            isBanned: true,
            createdAt: true,
            // Device bilgileri
            deviceBrand: true,
            deviceId: true,
            deviceName: true,
            systemName: true,
            systemVersion: true,
            isEmulator: true,
            isTablet: true,
          }
        },
        uploadedImg: {
          select: {
            id: true,
            url: true,
            isPublic: true,
            isDeleted: true,
            isHidden: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    });

    const totalCount = await prisma.uploadLogs.count();
    const data = logs.map(mapToLogs);

    return NextResponse.json({
      data,
      totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Logs API error:", error);
    return NextResponse.json(
      { error: "Log verileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}); 