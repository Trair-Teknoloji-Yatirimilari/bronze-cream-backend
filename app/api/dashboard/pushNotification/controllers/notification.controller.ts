import { NextRequest, NextResponse } from "next/server";
import { validateInput, rateLimit } from "@/lib/authMiddleware";
import { NotificationService } from "@/lib/services/notification.service";
import { ExpoNotificationService, EXPO_PUSH_TOKEN_REGEX } from "@/lib/services/expo-notification.service";
import { PushTokenRegisterData, NotificationSendData } from "@/lib/types/notification";

export class NotificationController {
  /**
   * POST: Push token kaydetme veya güncelleme
   */
  static async registerPushToken(request: NextRequest) {
    console.log("Push token kaydetme veya güncelleme isteği alındı");
    
    try {
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
      
      // Rate limiting
      if (!rateLimit(`push-token-${clientIP}`, 10, 60000)) {
        return NextResponse.json(
          { error: "Çok fazla istek. Lütfen bekleyin." },
          { status: 429 }
        );
      }

      const body = await request.json();
      console.log("Request body:", body);
      
      // Input validation
      const validationRules = {
        uniqueId: { required: true, type: "string" as const, minLength: 1, maxLength: 255 },
        pushToken: { required: true, type: "string" as const, pattern: EXPO_PUSH_TOKEN_REGEX },
        deviceInfo: { required: false, type: "string" as const }
      };

      const validationErrors = await validateInput(body, validationRules);
      if (validationErrors) {
        return NextResponse.json(
          { error: "Geçersiz veriler", details: validationErrors },
          { status: 400 }
        );
      }

      const { uniqueId, pushToken, deviceInfo } = body as PushTokenRegisterData;
      console.log("Unique ID:", uniqueId);
      console.log("Push token:", pushToken);
      console.log("Device info:", deviceInfo);

      // Push token formatını doğrula
      if (!ExpoNotificationService.validatePushToken(pushToken)) {
        return NextResponse.json(
          { error: "Geçersiz push token formatı" },
          { status: 400 }
        );
      }

      const user = await NotificationService.registerPushToken(
        { uniqueId, pushToken, deviceInfo },
        clientIP,
        request.headers.get('user-agent') || 'unknown'
      );

      console.log("User:", user);

      if (user.isBanned) {
        return NextResponse.json(
          { error: "Hesabınız engellenmiştir" },
          { status: 403 }
        );
      }

      console.log("Push token başarıyla kaydedildi");
      
      return NextResponse.json({
        success: true,
        message: "Push token başarıyla kaydedildi",
        userId: user.id
      });

    } catch (error) {
      console.error('Push token kaydetme hatası:', error);
      return NextResponse.json(
        { error: "Sunucu hatası" },
        { status: 500 }
      );
    }
  }

  /**
   * PUT: Bildirim gönderme (Admin yetkisi gerekli)
   */
  static async sendNotification(request: NextRequest, adminId: string) {
    try {
      // Rate limiting (Admin için daha esnek)
      if (!rateLimit(`admin-notification-${adminId}`, 100, 60000)) {
        return NextResponse.json(
          { error: "Çok fazla bildirim gönderimi. Lütfen bekleyin." },
          { status: 429 }
        );
      }

      const body = await request.json();
      
      // Input validation
      const validationRules = {
        title: { required: true, type: "string" as const, minLength: 1, maxLength: 100 },
        body: { required: true, type: "string" as const, minLength: 1, maxLength: 500 },
        targetType: { required: true, type: "string" as const },
        userIds: { required: false },
        data: { required: false }
      };

      const validationErrors = await validateInput(body, validationRules);
      if (validationErrors) {
        return NextResponse.json(
          { error: "Geçersiz veriler", details: validationErrors },
          { status: 400 }
        );
      }

      const { title, body: messageBody, targetType, userIds, data } = body as NotificationSendData;

      // TargetType validasyonu
      if (targetType !== 'all' && targetType !== 'specific') {
        return NextResponse.json(
          { error: "Geçersiz hedef türü. Sadece 'all' veya 'specific' kullanılabilir" },
          { status: 400 }
        );
      }

      if (targetType === 'specific' && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
        return NextResponse.json(
          { error: "Seçili kullanıcılar için kullanıcı ID'leri gereklidir" },
          { status: 400 }
        );
      }

      const result = await NotificationService.sendNotification(
        { title, body: messageBody, targetType, userIds, data },
        adminId
      );

      return NextResponse.json({
        success: true,
        message: "Bildirimler gönderildi",
        ...result
      });

    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
      
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Sunucu hatası" },
        { status: 500 }
      );
    }
  }

  /**
   * GET: Bildirim istatistikleri (Admin yetkisi gerekli)
   */
  static async getStats() {
    try {
      const stats = await NotificationService.getStats();
      
      return NextResponse.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('İstatistik alma hatası:', error);
      return NextResponse.json(
        { error: "Sunucu hatası" },
        { status: 500 }
      );
    }
  }
}
