export const NOTIFICATION_CATEGORIES = {
  MESSAGES: 'messages',
  UPDATES: 'updates',
  PROMOTIONS: 'promotions',
  REMINDERS: 'reminders',
  SYSTEM: 'system',
} as const;

export const NOTIFICATION_PRIORITIES = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const;

export const NOTIFICATION_SOUNDS = {
  DEFAULT: 'default',
  NONE: null,
} as const;

export const STORAGE_KEYS = {
  FCM_TOKEN: 'fcm_token',
  NOTIFICATION_SETTINGS: 'notification_settings',
  NOTIFICATION_STORE: 'notification-store',
} as const;

export const DEFAULT_NOTIFICATION_SETTINGS = {
  categories: {
    [NOTIFICATION_CATEGORIES.MESSAGES]: true,
    [NOTIFICATION_CATEGORIES.UPDATES]: true,
    [NOTIFICATION_CATEGORIES.PROMOTIONS]: false,
    [NOTIFICATION_CATEGORIES.REMINDERS]: true,
    [NOTIFICATION_CATEGORIES.SYSTEM]: true,
  },
  sound: true,
  vibration: true,
  badge: true,
  inApp: true,
};

export const NOTIFICATION_CHANNELS = {
  DEFAULT: {
    id: 'default',
    name: 'Varsayılan',
    description: 'Genel bildirimler',
  },
  MESSAGES: {
    id: 'messages',
    name: 'Mesajlar',
    description: 'Yeni mesaj bildirimleri',
  },
  UPDATES: {
    id: 'updates',
    name: 'Güncellemeler',
    description: 'Uygulama güncellemeleri',
  },
  PROMOTIONS: {
    id: 'promotions',
    name: 'Promosyonlar',
    description: 'Özel teklifler ve promosyonlar',
  },
  REMINDERS: {
    id: 'reminders',
    name: 'Hatırlatmalar',
    description: 'Hatırlatma bildirimleri',
  },
} as const;
