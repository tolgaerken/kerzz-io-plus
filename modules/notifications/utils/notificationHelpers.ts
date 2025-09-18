import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { NOTIFICATION_CATEGORIES } from '../constants';
import { FCMToken, NotificationData } from '../types';

/**
 * Notification data'sını validate eder
 */
export const validateNotificationData = (data: Partial<NotificationData>): boolean => {
  return !!(data.title && data.body);
};

/**
 * FCM token data'sını oluşturur
 */
export const createFCMTokenData = (token: string, userId?: string): FCMToken => {
  return {
    token,
    platform: Platform.OS as 'ios' | 'android',
    deviceId: Device.modelId || 'unknown',
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

/**
 * Notification'ı kategoriye göre filtreler
 */
export const filterNotificationsByCategory = (
  notifications: NotificationData[],
  category: string
): NotificationData[] => {
  return notifications.filter(notification => notification.category === category);
};

/**
 * Okunmamış notification sayısını hesaplar
 */
export const getUnreadCount = (notifications: NotificationData[]): number => {
  return notifications.filter(notification => !notification.read).length;
};

/**
 * Notification'ları tarihe göre sıralar (yeniden eskiye)
 */
export const sortNotificationsByDate = (notifications: NotificationData[]): NotificationData[] => {
  return [...notifications].sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Notification'ları kategoriye göre gruplar
 */
export const groupNotificationsByCategory = (
  notifications: NotificationData[]
): Record<string, NotificationData[]> => {
  return notifications.reduce((groups, notification) => {
    const category = notification.category || 'default';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(notification);
    return groups;
  }, {} as Record<string, NotificationData[]>);
};

/**
 * Notification'ın gösterilip gösterilmeyeceğini kontrol eder
 */
export const shouldShowNotification = (
  notification: NotificationData,
  settings: Record<string, boolean>
): boolean => {
  const category = notification.category || 'default';
  return settings[category] !== false;
};

/**
 * Deep link URL'ini parse eder
 */
export const parseDeepLink = (url: string): { screen?: string; params?: Record<string, any> } => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    
    const params: Record<string, any> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return {
      screen: pathSegments[0],
      params,
    };
  } catch (error) {
    console.error('Deep link parse hatası:', error);
    return {};
  }
};

/**
 * Notification'ın önceliğine göre renk döndürür
 */
export const getNotificationColor = (priority?: string): string => {
  switch (priority) {
    case 'high':
      return '#EF4444'; // Red
    case 'normal':
      return '#3B82F6'; // Blue
    case 'low':
      return '#6B7280'; // Gray
    default:
      return '#3B82F6';
  }
};

/**
 * Notification zamanını formatlar
 */
export const formatNotificationTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) {
    return 'Şimdi';
  } else if (minutes < 60) {
    return `${minutes} dakika önce`;
  } else if (hours < 24) {
    return `${hours} saat önce`;
  } else if (days < 7) {
    return `${days} gün önce`;
  } else {
    return new Date(timestamp).toLocaleDateString('tr-TR');
  }
};

/**
 * Notification kategorisinin Türkçe adını döndürür
 */
export const getCategoryDisplayName = (category: string): string => {
  const categoryNames: Record<string, string> = {
    [NOTIFICATION_CATEGORIES.MESSAGES]: 'Mesajlar',
    [NOTIFICATION_CATEGORIES.UPDATES]: 'Güncellemeler',
    [NOTIFICATION_CATEGORIES.PROMOTIONS]: 'Promosyonlar',
    [NOTIFICATION_CATEGORIES.REMINDERS]: 'Hatırlatmalar',
    [NOTIFICATION_CATEGORIES.SYSTEM]: 'Sistem',
    default: 'Genel',
  };
  
  return categoryNames[category] || categoryNames.default;
};

/**
 * Notification ID'si oluşturur
 */
export const generateNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Platform'a özel notification ayarlarını döndürür
 */
export const getPlatformSpecificSettings = () => {
  if (Platform.OS === 'ios') {
    return {
      sound: true,
      badge: true,
      alert: true,
      criticalAlert: false,
      provisional: false,
    };
  } else {
    return {
      sound: true,
      vibrate: true,
      lights: true,
      priority: 'high',
    };
  }
};
