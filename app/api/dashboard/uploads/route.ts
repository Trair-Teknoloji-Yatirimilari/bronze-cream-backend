import prisma from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth, validateInput, rateLimit } from "@/lib/authMiddleware";

type UploadWithUser = {
  id: string;
  url: string;
  product: {
    name: string | null;
  } | null;
  isPublic: boolean;
  isDeleted: boolean;
  isHidden: boolean;
  createdAt: Date;
  user: {
    id: string;
    userAgent: string | null;
    isBanned: boolean;
    createdAt: Date;
    // Yeni device bilgileri
    deviceBrand: string | null;
    deviceId: string | null;
    deviceName: string | null;
    deviceType: string | null;
    systemName: string | null;
    systemVersion: string | null;
    isEmulator: boolean | null;
    isTablet: boolean | null;
  } | null;
};

function mapToUploads(item: UploadWithUser) {
  // Device bilgilerini işle
  const user = item.user;
  const deviceBrand = user?.deviceBrand || null;
  const deviceModel = user?.deviceId || null;
  const systemInfo = user?.systemName && user?.systemVersion
    ? `${user.systemName} ${user.systemVersion}`
    : null;

  // Device bilgisini önce gerçek device info'dan belirle
  let deviceInfo = "Bilinmiyor";
  if (user?.deviceBrand && user?.systemName) {
    deviceInfo = `${user.deviceBrand} (${user.systemName})`;
  } else if (user?.userAgent) {
    const userAgent = user.userAgent.toLowerCase();
    if (userAgent.includes("android")) {
      deviceInfo = "Android";
    } else if (userAgent.includes("iphone") || userAgent.includes("ios")) {
      deviceInfo = "iOS";
    }
  }

  return {
    id: item.id,
    img:
      item.url.startsWith("http") ? item.url
        : item.url.startsWith("/") ? item.url
          : `/filtered/${item.url}`,
    device: deviceInfo, // Düzeltilmiş device bilgisi
    productName: item.product?.name || null,
    isPublic: item.isPublic,
    createdAt: item.createdAt.toISOString().split("T")[0],
    isActive: !item.isDeleted && !item.isHidden,
    // Yeni device bilgileri - direkt database'den
    deviceBrand,
    deviceModel,
    systemInfo,
    isEmulator: user?.isEmulator || null,
    isTablet: user?.isTablet || null,
  };
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Rate limiting kontrolü
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`uploads-get-${clientIP}`, 100, 60000)) { // 100 request per minute
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "10", 10), 100); // Max 100

    if (page < 1 || pageSize < 1) {
      return NextResponse.json(
        { error: "Geçersiz sayfa parametreleri" },
        { status: 400 }
      );
    }

    const uploads = await prisma.uploadedImg.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        url: true,
        product: {
          select: {
            name: true,
          }
        },
        isPublic: true,
        isDeleted: true,
        isHidden: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            userAgent: true,
            isBanned: true,
            createdAt: true,
            // Yeni device bilgileri
            deviceBrand: true,
            deviceId: true,
            deviceName: true,
            deviceType: true,
            systemName: true,
            systemVersion: true,
            isEmulator: true,
            isTablet: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    const totalCount = await prisma.uploadedImg.count({
      where: { isDeleted: false },
    });

    const data = uploads.map(upload => mapToUploads(upload as UploadWithUser));

    return NextResponse.json({ data, totalCount });
  } catch (error) {
    console.error("Uploads GET API error:", error);
    return NextResponse.json(
      { error: "Upload verileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, adminId?: string) => {
  try {
    // Rate limiting kontrolü
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`uploads-put-${clientIP}`, 30, 60000)) { // 30 request per minute
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    const body = await request.json();
    // Input validation
    const validationErrors = await validateInput(body, {
      id: { required: true, type: "string" }
    });

    if (validationErrors) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: validationErrors },
        { status: 400 }
      );
    }

    const { id } = body;

    // UUID format kontrolü
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Geçersiz upload ID formatı" },
        { status: 400 }
      );
    }

    const upload = await prisma.uploadedImg.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json(
        { error: "Fotoğraf bulunamadı" },
        { status: 404 }
      );
    }

    if (upload.isDeleted) {
      return NextResponse.json(
        { error: "Silinmiş fotoğraf güncellenemez" },
        { status: 400 }
      );
    }

    const updatedUpload = await prisma.uploadedImg.update({
      where: { id },
      data: { isPublic: !upload.isPublic },
    });

    // İşlemi logla
    console.log(`Admin ${adminId} ${upload.isPublic ? 'unhid' : 'hid'} upload ${id}`);
    
    return NextResponse.json({
      ok: true,
      data: updatedUpload,
      message: upload.isPublic ? "Fotoğraf gösterilmeye başlandı" : "Fotoğraf gizlendi"
    });
  } catch (error) {
    console.error("Uploads PUT API error:", error);
    return NextResponse.json(
      { error: "Fotoğraf güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest, adminId?: string) => {
  try {
    // Rate limiting kontrolü
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`uploads-delete-${clientIP}`, 20, 60000)) { // 20 request per minute
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Input validation
    const validationErrors = await validateInput(body, {
      id: { required: true, type: "string" }
    });

    if (validationErrors) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: validationErrors },
        { status: 400 }
      );
    }

    const { id } = body;

    // UUID format kontrolü
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Geçersiz upload ID formatı" },
        { status: 400 }
      );
    }

    const upload = await prisma.uploadedImg.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json(
        { error: "Fotoğraf bulunamadı" },
        { status: 404 }
      );
    }

    if (upload.isDeleted) {
      return NextResponse.json(
        { error: "Fotoğraf zaten silinmiş" },
        { status: 400 }
      );
    }

    const deletedUpload = await prisma.uploadedImg.update({
      where: { id },
      data: { isDeleted: true },
    });

    // İşlemi logla
    console.log(`Admin ${adminId} deleted upload ${id}`);

    return NextResponse.json({
      ok: true,
      data: deletedUpload,
      message: "Fotoğraf başarıyla silindi"
    });
  } catch (error) {
    console.error("Uploads DELETE API error:", error);
    return NextResponse.json(
      { error: "Fotoğraf silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
});