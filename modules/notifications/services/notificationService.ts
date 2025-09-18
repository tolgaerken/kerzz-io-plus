import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  NotificationData, 
  FCMToken, 
  NotificationPermission, 
  NotificationSettings,
  NotificationResponse 
} from '../types';

// Notification davranışını yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private currentToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Notification izinlerini kontrol et ve iste
   */
  async requestPermissions(): Promise<NotificationPermission> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications sadece fiziksel cihazlarda çalışır');
        return { status: 'denied', canAskAgain: false };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return { 
          status: 'denied', 
          canAskAgain: existingStatus === 'undetermined' 
        };
      }

      // Android için notification channel oluştur
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      return { status: 'granted', canAskAgain: true };
    } catch (error) {
      console.error('Permission request hatası:', error);
      return { status: 'denied', canAskAgain: false };
    }
  }

  /**
   * Android için notification channel'ları oluştur
   */
  private async createNotificationChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Varsayılan',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Mesajlar',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('updates', {
      name: 'Güncellemeler',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      sound: 'default',
    });
  }

  /**
   * FCM token al
   */
  async getToken(): Promise<string | null> {
    try {
      const permission = await this.requestPermissions();
      if (permission.status !== 'granted') {
        console.warn('Notification izni verilmedi');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.currentToken = token.data;
      await this.saveTokenToStorage(token.data);
      
      return token.data;
    } catch (error) {
      console.error('Token alma hatası:', error);
      return null;
    }
  }

  /**
   * Token'ı local storage'a kaydet
   */
  private async saveTokenToStorage(token: string): Promise<void> {
    try {
      const tokenData: FCMToken = {
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Device.modelId || 'unknown',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await AsyncStorage.setItem('fcm_token', JSON.stringify(tokenData));
    } catch (error) {
      console.error('Token kaydetme hatası:', error);
    }
  }

  /**
   * Kaydedilmiş token'ı al
   */
  async getSavedToken(): Promise<FCMToken | null> {
    try {
      const tokenString = await AsyncStorage.getItem('fcm_token');
      if (tokenString) {
        return JSON.parse(tokenString);
      }
      return null;
    } catch (error) {
      console.error('Token okuma hatası:', error);
      return null;
    }
  }

  /**
   * Notification listener'ları başlat
   */
  startListening(): void {
    // Foreground notification listener
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification alındı:', notification);
        this.handleForegroundNotification(notification);
      }
    );

    // Notification response listener (kullanıcı notification'a tıkladığında)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Listener'ları durdur
   */
  stopListening(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Foreground notification'ı işle
   */
  private handleForegroundNotification(notification: Notifications.Notification): void {
    // Burada custom in-app notification gösterebiliriz
    // Veya notification store'u güncelleyebiliriz
    console.log('Foreground notification işlendi:', notification.request.content.title);
  }

  /**
   * Notification response'ını işle
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification, actionIdentifier } = response;
    
    // Navigation veya deep linking işlemleri burada yapılabilir
    console.log('Notification tıklandı:', {
      title: notification.request.content.title,
      action: actionIdentifier,
      data: notification.request.content.data,
    });

    // Deep linking için data'daki URL'i kullan
    if (notification.request.content.data?.actionUrl) {
      // Router.push(notification.request.content.data.actionUrl);
    }
  }

  /**
   * Local notification gönder
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    options?: {
      sound?: boolean;
      vibrate?: boolean;
      badge?: number;
      channelId?: string;
    }
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: options?.sound !== false ? 'default' : undefined,
          badge: options?.badge,
        },
        trigger: null, // Hemen gönder
      });

      return notificationId;
    } catch (error) {
      console.error('Local notification gönderme hatası:', error);
      throw error;
    }
  }

  /**
   * Notification ayarlarını al
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const settingsString = await AsyncStorage.getItem('notification_settings');
      if (settingsString) {
        return JSON.parse(settingsString);
      }

      // Varsayılan ayarlar
      return {
        categories: {
          messages: true,
          updates: true,
          promotions: false,
        },
        sound: true,
        vibration: true,
        badge: true,
        inApp: true,
      };
    } catch (error) {
      console.error('Ayarları okuma hatası:', error);
      return {
        categories: {},
        sound: true,
        vibration: true,
        badge: true,
        inApp: true,
      };
    }
  }

  /**
   * Notification ayarlarını kaydet
   */
  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Ayarları kaydetme hatası:', error);
    }
  }

  /**
   * Badge sayısını güncelle
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Badge güncelleme hatası:', error);
    }
  }

  /**
   * Tüm notification'ları temizle
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('Notification temizleme hatası:', error);
    }
  }

  /**
   * Belirli bir notification'ı temizle
   */
  async clearNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
    } catch (error) {
      console.error('Notification temizleme hatası:', error);
    }
  }

  /**
   * Mevcut token'ı al
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }
}

export default NotificationService;
