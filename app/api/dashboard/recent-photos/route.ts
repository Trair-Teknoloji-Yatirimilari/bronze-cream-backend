import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") || "10", 10)));
    const search = searchParams.get("search")?.trim();

    // Arama filtresi
    let where: Prisma.UploadedImgWhereInput = {};
    if (search) {
      where = {
        OR: [
          { product: { name: { contains: search, mode: "insensitive" } } },
          { userId: { contains: search, mode: "insensitive" } },
          { user: { userIP: { contains: search, mode: "insensitive" } } },
        ],
      };
    }

    // Toplam kayıt sayısı ve sayfalı veri çekme
    const [data, totalCount] = await Promise.all([
      prisma.uploadedImg.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              userIP: true,
              deviceBrand: true,
              deviceId: true,
              systemName: true,
              isEmulator: true,
              isTablet: true,
            },
          },
          product: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.uploadedImg.count({ where }),
    ]);

    // Sonuçları frontend'in beklediği şekilde dönüştür
    const result = data.map((item) => ({
      id: item.id,
      img: item.url,
      device: item.user?.deviceBrand || "-",
      productName: item.product?.name || null,
      isPublic: item.isPublic,
      createdAt: item.createdAt,
      uploadTime: item.createdAt, // Eğer farklı bir alan varsa değiştir
      isActive: !item.isDeleted && !item.isHidden,
      deviceBrand: item.user?.deviceBrand || null,
      deviceModel: item.user?.deviceId || null,
      systemInfo: item.user?.systemName || null,
      isEmulator: item.user?.isEmulator || null,
      isTablet: item.user?.isTablet || null,
      userId: item.userId,
      userIP: item.user?.userIP || null,
    }));

    return NextResponse.json({ data: result, totalCount });
  } catch (error) {
    console.error("/api/dashboard/recent-photos GET error:", error);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
