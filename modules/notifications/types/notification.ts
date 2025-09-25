export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  category?: string;
  priority?: 'high' | 'normal' | 'low';
  sound?: string;
  badge?: number;
  timestamp: number;
  read: boolean;
}

export interface FCMToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface NotificationPermission {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
}

export interface PushNotificationConfig {
  enableSound: boolean;
  enableVibration: boolean;
  enableBadge: boolean;
  enableInAppNotifications: boolean;
  categories: NotificationCategory[];
}

export interface NotificationCategory {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  sound?: string;
  vibration?: boolean;
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
  authenticationRequired?: boolean;
}

export interface NotificationResponse {
  notification: NotificationData;
  actionIdentifier: string;
  userText?: string;
}

export interface NotificationSettings {
  categories: Record<string, boolean>;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  inApp: boolean;
  autoRedirect: boolean; // Uygulama açıkken otomatik yönlendirme yapılsın mı?
}
