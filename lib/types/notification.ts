// Expo Push Notification türleri
export interface ExpoPushMessage {
  to: string | string[];
  title?: string;
  body?: string;
  data?: object;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  subtitle?: string;
  categoryId?: string;
  mutableContent?: boolean;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: Record<string, unknown>;
}

// Push token kaydetme için tip
export interface PushTokenRegisterData {
  uniqueId: string;
  pushToken: string;
  deviceInfo?: {
    userAgent?: string;
    deviceBrand?: string;
    deviceName?: string;
    systemName?: string;
    systemVersion?: string;
    appVersion?: string;
    buildNumber?: string;
  };
}

// Bildirim gönderme için tip
export interface NotificationSendData {
  title: string;
  body: string;
  targetType: 'all' | 'specific';
  userIds?: string[];
  data?: Record<string, unknown>;
}

// API Response türleri
export interface NotificationStats {
  totalUsers: number;
  usersWithPushToken: number;
  bannedUsers: number;
  recentUsers: number;
  notificationCoverage: string;
  // Bildirim gönderim istatistikleri
  totalNotificationsSent: number;
  totalNotificationsSuccess: number;
  totalNotificationsError: number;
  totalNotificationCampaigns: number;
  recentNotificationsSent: number;
  recentNotificationsSuccess: number;
  recentNotificationsError: number;
  recentNotificationCampaigns: number;
  notificationSuccessRate: string;
}

export interface NotificationSendResponse {
  success: boolean;
  message: string;
  totalTargeted: number;
  totalSent: number;
  successCount: number;
  errorCount: number;
  tickets?: ExpoPushTicket[];
}
