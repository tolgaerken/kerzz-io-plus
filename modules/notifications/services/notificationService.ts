import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthorizationStatus,
  deleteToken,
  FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
  subscribeToTopic,
  unsubscribeFromTopic
} from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { isFirebaseInitialized } from '../../../config/firebase';
import {
  FCMToken,
  NotificationPermission,
  NotificationSettings
} from '../types';

class NotificationService {
  private static instance: NotificationService;
  private currentToken: string | null = null;
  private messageListener: (() => void) | null = null;
  private tokenRefreshListener: (() => void) | null = null;
  private backgroundMessageHandler: (() => void) | null = null;
  private messaging = getMessaging();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * FCM notification izinlerini kontrol et ve iste
   */
  async requestPermissions(): Promise<NotificationPermission> {
    try {
      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized()) {
        console.error('❌ Firebase App başlatılmamış');
        return { status: 'denied', canAskAgain: false };
      }

      // FCM authorization durumunu kontrol et
      const authStatus = await requestPermission(this.messaging);
      
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        return { 
          status: 'denied', 
          canAskAgain: authStatus === AuthorizationStatus.NOT_DETERMINED 
        };
      }

      // iOS için APNs token kaydı: firebase.json auto-register true olduğundan manuel kayıt gereksiz
      // Gereksiz uyarıyı önlemek için bu blok kaldırıldı

      return { status: 'granted', canAskAgain: true };
    } catch (error) {
      console.error('FCM permission request hatası:', error);
      return { status: 'denied', canAskAgain: false };
    }
  }


  /**
   * FCM token al
   */
  async getToken(): Promise<string | null> {
    try {
      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized()) {
        console.error('❌ Firebase App başlatılmamış');
        return null;
      }

      const permission = await this.requestPermissions();
      if (permission.status !== 'granted') {
        console.warn('FCM notification izni verilmedi');
        return null;
      }

      const token = await getToken(this.messaging);

      this.currentToken = token;
      await this.saveTokenToStorage(token);
      
      return token;
    } catch (error) {
      console.error('FCM token alma hatası:', error);
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
   * FCM message listener'larını başlat
   */
  startListening(): void {
    // Firebase App'in başlatılıp başlatılmadığını kontrol et
    if (!isFirebaseInitialized()) {
      console.error('❌ Firebase App başlatılmamış, listener başlatılamıyor');
      return;
    }

    // Foreground message listener
    this.messageListener = onMessage(this.messaging, async (remoteMessage) => {
      console.log('FCM message alındı (foreground):', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // Token refresh listener
    this.tokenRefreshListener = onTokenRefresh(this.messaging, async (token) => {
      console.log('FCM token yenilendi:', token);
      await this.handleTokenRefresh(token);
    });

    // Background message handler
    setBackgroundMessageHandler(this.messaging, async (remoteMessage) => {
      console.log('FCM message alındı (background):', remoteMessage);
      this.handleBackgroundMessage(remoteMessage);
    });
  }

  /**
   * FCM listener'larını durdur
   */
  stopListening(): void {
    if (this.messageListener) {
      this.messageListener();
      this.messageListener = null;
    }

    if (this.tokenRefreshListener) {
      this.tokenRefreshListener();
      this.tokenRefreshListener = null;
    }
  }

  /**
   * Foreground FCM message'ını işle
   */
  private handleForegroundMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    // Burada custom in-app notification gösterebiliriz
    // Veya notification store'u güncelleyebiliriz
    console.log('Foreground FCM message işlendi:', remoteMessage.notification?.title);
    
    // Local notification olarak göster
    if (remoteMessage.notification) {
      this.showLocalNotification(
        remoteMessage.notification.title || 'Bildirim',
        remoteMessage.notification.body || '',
        remoteMessage.data
      );
    }
  }

  /**
   * Background FCM message'ını işle
   */
  private handleBackgroundMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    console.log('Background FCM message işlendi:', remoteMessage.notification?.title);
    // Background'da özel işlemler yapılabilir
  }

  /**
   * Token refresh'i işle
   */
  private async handleTokenRefresh(token: string): Promise<void> {
    const oldToken = this.currentToken;
    this.currentToken = token;
    
    // Yeni token'ı storage'a kaydet
    await this.saveTokenToStorage(token);
    
    // Token değişikliğini bildir (opsiyonel callback)
    console.log('FCM token güncellendi:', { oldToken, newToken: token });
  }

  /**
   * Local notification göster (FCM message'ı local olarak göstermek için)
   */
  private showLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): void {
    // FCM'de local notification genellikle otomatik olarak gösterilir
    // Eğer özel bir işlem gerekiyorsa burada yapılabilir
    console.log('Local notification gösterildi:', { title, body, data });
  }

  /**
   * FCM topic'ine subscribe ol
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized()) {
        throw new Error('Firebase App başlatılmamış');
      }

      await subscribeToTopic(this.messaging, topic);
      console.log(`FCM topic'ine subscribe olundu: ${topic}`);
    } catch (error) {
      console.error('Topic subscribe hatası:', error);
      throw error;
    }
  }

  /**
   * FCM topic'inden unsubscribe ol
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized()) {
        throw new Error('Firebase App başlatılmamış');
      }

      await unsubscribeFromTopic(this.messaging, topic);
      console.log(`FCM topic'inden unsubscribe olundu: ${topic}`);
    } catch (error) {
      console.error('Topic unsubscribe hatası:', error);
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
   * Badge sayısını güncelle (iOS için)
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized()) {
        console.error('❌ Firebase App başlatılmamış, badge güncellenemiyor');
        return;
      }

      if (Platform.OS === 'ios') {
        // Badge count FCM ile doğrudan set edilemez, server-side yapılmalı
        // setAPNSToken boş string ile çağrılmamalı - crash'e neden oluyor
        console.log('Badge count güncelleme isteği:', count);
        console.log('⚠️ Badge count güncellemesi server-side yapılmalı');
      }
    } catch (error) {
      console.error('Badge güncelleme hatası:', error);
    }
  }

  /**
   * FCM token'ını sil
   */
  async deleteToken(): Promise<void> {
    try {
      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized()) {
        console.error('❌ Firebase App başlatılmamış, token silinemiyor');
        return;
      }

      await deleteToken(this.messaging);
      this.currentToken = null;
      console.log('FCM token silindi');
    } catch (error) {
      console.error('FCM token silme hatası:', error);
    }
  }

  /**
   * Uygulama açılma nedenini kontrol et (notification'dan mı?)
   */
  async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    try {
      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized()) {
        console.error('❌ Firebase App başlatılmamış, initial notification alınamıyor');
        return null;
      }

      const remoteMessage = await getInitialNotification(this.messaging);
      if (remoteMessage) {
        console.log('Uygulama notification ile açıldı:', remoteMessage);
      }
      return remoteMessage;
    } catch (error) {
      console.error('Initial notification alma hatası:', error);
      return null;
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
