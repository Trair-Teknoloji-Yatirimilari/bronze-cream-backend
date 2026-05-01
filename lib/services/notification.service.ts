import prisma from '@/lib/prisma';
import { PushTokenRegisterData, NotificationSendData, NotificationStats } from '@/lib/types/notification';
import { ExpoNotificationService } from './expo-notification.service';

export class NotificationService {
  /**
   * Push token kaydet veya güncelle
   */
  static async registerPushToken(data: PushTokenRegisterData, clientIP: string, userAgent: string) {
    const { uniqueId, pushToken, deviceInfo } = data;

    const user = await prisma.user.upsert({
      where: { uniqueId },
      update: {
        pushToken,
        updatedAt: new Date(),
        ...(deviceInfo && {
          userAgent: deviceInfo.userAgent,
          deviceBrand: deviceInfo.deviceBrand,
          deviceName: deviceInfo.deviceName,
          systemName: deviceInfo.systemName,
          systemVersion: deviceInfo.systemVersion,
          appVersion: deviceInfo.appVersion,
          buildNumber: deviceInfo.buildNumber,
        }),
      },
      create: {
        uniqueId,
        pushToken,
        userIP: clientIP,
        userAgent: deviceInfo?.userAgent || userAgent,
        deviceBrand: deviceInfo?.deviceBrand,
        deviceName: deviceInfo?.deviceName,
        systemName: deviceInfo?.systemName,
        systemVersion: deviceInfo?.systemVersion,
        appVersion: deviceInfo?.appVersion,
        buildNumber: deviceInfo?.buildNumber,
      },
      select: {
        id: true,
        uniqueId: true,
        pushToken: true,
        isBanned: true,
      }
    });

    return user;
  }

  /**
   * Hedef kullanıcıları getir
   */
  static async getTargetUsers(targetType: 'all' | 'specific', userIds?: string[]) {
    if (targetType === 'all') {
      return await prisma.user.findMany({
        where: {
          pushToken: { not: null },
          isBanned: false
        },
        select: {
          id: true,
          pushToken: true,
          uniqueId: true
        }
      });
    } else if (targetType === 'specific' && userIds && Array.isArray(userIds)) {
      return await prisma.user.findMany({
        where: {
          id: { in: userIds },
          pushToken: { not: null },
          isBanned: false
        },
        select: {
          id: true,
          pushToken: true,
          uniqueId: true
        }
      });
    }
    
    return [];
  }

  /**
   * Bildirim gönder
   */
  static async sendNotification(data: NotificationSendData, adminId: string) {
    const { title, body, targetType, userIds, data: customData } = data;

    // Hedef kullanıcıları al
    const targetUsers = await this.getTargetUsers(targetType, userIds);

    if (targetUsers.length === 0) {
      throw new Error('Bildirim gönderilecek geçerli kullanıcı bulunamadı');
    }

    // Push token'ları hazırla
    const validTokens = targetUsers
      .map(user => user.pushToken!)
      .filter(token => {
        const isValid = ExpoNotificationService.validatePushToken(token);
        console.log(`🔍 Token kontrolü: ${token.substring(0, 20)}... -> ${isValid ? '✅ Geçerli' : '❌ Geçersiz'}`);
        return isValid;
      });

    if (validTokens.length === 0) {
      throw new Error('Geçerli push token bulunamadı');
    }

    // Mesajları hazırla
    const messages = ExpoNotificationService.prepareMessages(
      validTokens,
      title,
      body,
      customData
    );

    // Mesajları chunks halinde gönder
    const chunks = ExpoNotificationService.chunkMessages(messages);
    let successCount = 0;
    let errorCount = 0;
    const allTickets = [];

    for (const chunk of chunks) {
      try {
        const tickets = await ExpoNotificationService.sendPushNotifications(chunk);
        allTickets.push(...tickets);
        
        tickets.forEach((ticket, index) => {
          if (ticket.status === 'ok') {
            successCount++;
            console.log(`✅ Bildirim ${index + 1} başarılı:`, ticket.id);
          } else {
            errorCount++;
            console.error(`❌ Bildirim ${index + 1} hatası:`, {
              message: ticket.message,
              details: ticket.details,
              status: ticket.status
            });
          }
        });
      } catch (error) {
        console.error('Chunk gönderim hatası:', error);
        errorCount += chunk.length;
      }
    }

    // Log kaydet
    try {
      await prisma.notificationLogs.create({
        data: {
          title,
          body,
          targetType,
          targetCount: targetUsers.length,
          sentCount: messages.length,
          successCount,
          errorCount,
          adminId,
          customData: customData ? JSON.stringify(customData) : null,
        }
      });
    } catch (logError) {
      console.error('Log kaydetme hatası:', logError);
      // Log hatası ana işlemi etkilemesin
    }

    return {
      totalTargeted: targetUsers.length,
      totalSent: messages.length,
      successCount,
      errorCount,
      tickets: allTickets
    };
  }

  /**
   * İstatistikleri getir
   */
  static async getStats(): Promise<NotificationStats> {
    const totalUsers = await prisma.user.count();
    const usersWithPushToken = await prisma.user.count({
      where: {
        pushToken: { not: null },
        isBanned: false
      }
    });
    const bannedUsers = await prisma.user.count({
      where: { isBanned: true }
    });

    // Son 30 günde kayıt olan kullanıcılar
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Bildirim gönderim istatistikleri
    const notificationStats = await prisma.notificationLogs.aggregate({
      _sum: {
        sentCount: true,
        successCount: true,
        errorCount: true,
        targetCount: true
      },
      _count: {
        id: true
      }
    });

    // Son 30 günde gönderilen bildirimler
    const recentNotifications = await prisma.notificationLogs.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      _sum: {
        sentCount: true,
        successCount: true,
        errorCount: true
      },
      _count: {
        id: true
      }
    });

    return {
      totalUsers,
      usersWithPushToken,
      bannedUsers,
      recentUsers,
      notificationCoverage: totalUsers > 0 ? ((usersWithPushToken / totalUsers) * 100).toFixed(1) : '0',
      // Yeni bildirim istatistikleri
      totalNotificationsSent: notificationStats._sum.sentCount || 0,
      totalNotificationsSuccess: notificationStats._sum.successCount || 0,
      totalNotificationsError: notificationStats._sum.errorCount || 0,
      totalNotificationCampaigns: notificationStats._count.id || 0,
      recentNotificationsSent: recentNotifications._sum.sentCount || 0,
      recentNotificationsSuccess: recentNotifications._sum.successCount || 0,
      recentNotificationsError: recentNotifications._sum.errorCount || 0,
      recentNotificationCampaigns: recentNotifications._count.id || 0,
      notificationSuccessRate: notificationStats._sum.sentCount && notificationStats._sum.sentCount > 0 
        ? ((notificationStats._sum.successCount || 0) / notificationStats._sum.sentCount * 100).toFixed(1) 
        : '0'
    };
  }
}
