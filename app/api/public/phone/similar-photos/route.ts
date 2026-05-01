import prisma from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const currentImageId = searchParams.get("currentImageId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20); // Max 20

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID gerekli" },
        { status: 400 }
      );
    }

    // Aynı productId'ye sahip, public olan, silinmemiş ve gizlenmemiş fotoğrafları getir
    // Mevcut fotoğrafı hariç tut
    const similarPhotos = await prisma.uploadedImg.findMany({
      where: {
        productId,
        isPublic: true,
        isDeleted: false,
        isHidden: false,
        ...(currentImageId && { id: { not: currentImageId } })
      },
      select: {
        id: true,
        url: true,
        product: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        user: {
          select: {
            id: true,
            userAgent: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // URL'leri düzenle
    const formattedPhotos = similarPhotos.map(photo => ({
      id: photo.id,
      url: photo.url.startsWith("http") 
        ? photo.url 
        : photo.url.startsWith("/") 
        ? photo.url 
        : `/filtered/${photo.url}`,
      productName: photo.product?.name || null,
      createdAt: photo.createdAt.toISOString(),
      device: photo.user?.userAgent?.toLowerCase().includes("android") 
        ? "Android" 
        : photo.user?.userAgent?.toLowerCase().includes("iphone") || photo.user?.userAgent?.toLowerCase().includes("ios")
        ? "iPhone"
        : "Diğer"
    }));

    return NextResponse.json({
      success: true,
      photos: formattedPhotos,
      count: formattedPhotos.length
    });

  } catch (error) {
    console.error("Similar photos API error:", error);
    return NextResponse.json(
      { error: "Benzer fotoğraflar alınırken hata oluştu" },
      { status: 500 }
    );
  }
} 