import { NextRequest, NextResponse } from "next/server";
import { withAuth, rateLimit } from "@/lib/authMiddleware";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

const PAGE_SIZE = 20;

// GET: Bildirim loglarını getir (Admin yetkisi gerekli)
async function handleGET(request: NextRequest, adminId?: string) {
  try {
    // Rate limiting
    if (!rateLimit(`notification-logs-${adminId}`, 60, 60000)) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || PAGE_SIZE.toString()), 100);
    const targetType = searchParams.get("targetType"); // "all" veya "specific" filtresi

    if (page < 1 || pageSize < 1) {
      return NextResponse.json(
        { error: "Geçersiz sayfa parametreleri" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * pageSize;

    // Where clause oluştur
    const whereClause: Prisma.NotificationLogsWhereInput = {};
    if (targetType && (targetType === "all" || targetType === "specific")) {
      whereClause.targetType = targetType;
    }

    // Logları getir
    const logs = await prisma.notificationLogs.findMany({
      where: whereClause,
      include: {
        admin: {
          select: {
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip
    });

    // Toplam sayı
    const totalCount = await prisma.notificationLogs.count({
      where: whereClause
    });

    // Başarı oranı hesaplamaları
    const logsWithStats = logs.map((log) => ({
      id: log.id,
      title: log.title,
      body: log.body,
      targetType: log.targetType,
      targetCount: log.targetCount,
      sentCount: log.sentCount,
      successCount: log.successCount,
      errorCount: log.errorCount,
      successRate: log.sentCount > 0 ? ((log.successCount / log.sentCount) * 100).toFixed(1) : "0",
      adminEmail: log.admin.email,
      customData: log.customData ? JSON.parse(log.customData) : null,
      createdAt: log.createdAt.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      createdAtRaw: log.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: logsWithStats,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });

  } catch (error) {
    console.error("Notification logs API error:", error);
    return NextResponse.json(
      { error: "Loglar alınırken hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE: Belirli bir log kaydını sil (Admin yetkisi gerekli) 
async function handleDELETE(request: NextRequest, adminId?: string) {
  try {
    // Rate limiting
    if (!rateLimit(`notification-logs-delete-${adminId}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Çok fazla silme işlemi. Lütfen bekleyin." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get("id");

    if (!logId) {
      return NextResponse.json(
        { error: "Log ID gereklidir" },
        { status: 400 }
      );
    }

    // UUID format kontrolü
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(logId)) {
      return NextResponse.json(
        { error: "Geçersiz log ID formatı" },
        { status: 400 }
      );
    }

    // Log kaydını sil
    const deletedLog = await prisma.notificationLogs.delete({
      where: { id: logId }
    });

    return NextResponse.json({
      success: true,
      message: "Log kaydı başarıyla silindi",
      deletedId: deletedLog.id
    });

  } catch (error: Error | unknown) {
    console.error("Notification log delete error:", error);
    
    if (error instanceof Error && error.message.includes("P2025")) {
      return NextResponse.json(
        { error: "Log kaydı bulunamadı" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Log silme işlemi sırasında hata oluştu" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const DELETE = withAuth(handleDELETE);
