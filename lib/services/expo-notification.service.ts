import { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from '@/lib/types/notification';

// Expo Push Token doğrulama regex'i
export const EXPO_PUSH_TOKEN_REGEX = /^ExponentPushToken\[[A-Za-z0-9_-]+\]$/;

// Development build için daha esnek regex
export const EXPO_DEV_PUSH_TOKEN_REGEX = /^(ExponentPushToken\[[A-Za-z0-9_-]+\]|[A-Za-z0-9_-]{22,})$/;

// Expo API endpoints
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_API_URL = 'https://exp.host/--/api/v2/push/getReceipts';

export class ExpoNotificationService {
  /**
   * Expo Push API'ye bildirim gönder
   */
  static async sendPushNotifications(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    try {
      console.log(`🚀 Expo'ya ${messages.length} bildirim gönderiliyor...`);
      console.log('📋 Gönderilecek tokenlar:', messages.map(m => {
        const token = Array.isArray(m.to) ? m.to[0] : m.to;
        return token.substring(0, 20) + '...';
      }));
      
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      console.log(`📡 Expo API yanıt durumu: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Expo API hata yanıtı:', errorText);
        throw new Error(`Expo API hatası: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🎫 Expo API yanıtı:', result);
      
      // Expo API bazen { data: [...] } formatında döner
      let tickets;
      if (result && result.data && Array.isArray(result.data)) {
        tickets = result.data;
        console.log('📦 Data array formatı tespit edildi');
      } else if (Array.isArray(result)) {
        tickets = result;
        console.log('📦 Direct array formatı tespit edildi');
      } else {
        tickets = [result];
        console.log('📦 Single object formatı tespit edildi');
      }
      
      console.log('✅ İşlenmiş tickets:', tickets);
      return tickets;
    } catch (error) {
      console.error('💥 Expo push notification hatası:', error);
      throw error;
    }
  }

  /**
   * Bildirim alma durumunu kontrol et
   */
  static async checkPushReceipts(receiptIds: string[]): Promise<{ [id: string]: ExpoPushReceipt }> {
    try {
      const response = await fetch(EXPO_RECEIPTS_API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: receiptIds }),
      });

      if (!response.ok) {
        throw new Error(`Expo receipts API hatası: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Expo receipts kontrol hatası:', error);
      throw error;
    }
  }

  /**
   * Push token formatını doğrula
   */
  static validatePushToken(token: string): boolean {
    const isProduction = EXPO_PUSH_TOKEN_REGEX.test(token);
    const isDevelopment = EXPO_DEV_PUSH_TOKEN_REGEX.test(token);
    
    console.log(`🔍 Token validation: ${token.substring(0, 30)}...`);
    console.log(`📍 Production format: ${isProduction ? '✅' : '❌'}`);
    console.log(`🚧 Development format: ${isDevelopment ? '✅' : '❌'}`);
    
    return isProduction || isDevelopment;
  }

  /**
   * Mesajları chunks halinde böl (Expo'nun 100 bildirim limiti için)
   */
  static chunkMessages(messages: ExpoPushMessage[], chunkSize: number = 100): ExpoPushMessage[][] {
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += chunkSize) {
      chunks.push(messages.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Bildirim mesajlarını hazırla
   */
  static prepareMessages(
    tokens: string[], 
    title: string, 
    body: string, 
    data?: Record<string, unknown>
  ): ExpoPushMessage[] {
    return tokens
      .filter(token => this.validatePushToken(token))
      .map(token => ({
        to: token,
        title,
        body,
        sound: 'default' as const,
        data: data || {},
        priority: 'high' as const
      }));
  }
}
