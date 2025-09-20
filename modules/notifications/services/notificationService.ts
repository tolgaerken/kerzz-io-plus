import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import { isFirebaseInitialized } from '../../../config/firebase';
import {
    FCMToken,
    NotificationPermission,
    NotificationSettings
} from '../types';

// Platform-specific imports
let notificationFunctions: any = {};

// Platform-specific Firebase functions will be loaded dynamically
const loadFirebaseFunctions = async () => {
  if (Platform.OS === 'web') {
    // Web için Firebase Web SDK
    try {
      const firebaseMessaging = await import('firebase/messaging');
      notificationFunctions = {
        getMessaging: firebaseMessaging.getMessaging,
        getToken: firebaseMessaging.getToken,
        onMessage: firebaseMessaging.onMessage,
        isSupported: firebaseMessaging.isSupported
      };
    } catch (error) {
      console.warn('⚠️ Firebase Web Messaging yüklenemedi:', error);
    }
  } else {
    // React Native için Firebase
    try {
      const firebaseMessaging = await import('@react-native-firebase/messaging');
      notificationFunctions = {
        AuthorizationStatus: firebaseMessaging.AuthorizationStatus,
        deleteToken: firebaseMessaging.deleteToken,
        getInitialNotification: firebaseMessaging.getInitialNotification,
        getMessaging: firebaseMessaging.getMessaging,
        getToken: firebaseMessaging.getToken,
        onMessage: firebaseMessaging.onMessage,
        onTokenRefresh: firebaseMessaging.onTokenRefresh,
        requestPermission: firebaseMessaging.requestPermission,
        setBackgroundMessageHandler: firebaseMessaging.setBackgroundMessageHandler,
        subscribeToTopic: firebaseMessaging.subscribeToTopic,
        unsubscribeFromTopic: firebaseMessaging.unsubscribeFromTopic
      };
    } catch (error) {
      console.warn('⚠️ React Native Firebase Messaging yüklenemedi:', error);
    }
  }
};

// Initialize functions
loadFirebaseFunctions();

class NotificationService {
  private static instance: NotificationService;
  private currentToken: string | null = null;
  private messageListener: (() => void) | null = null;
  private tokenRefreshListener: (() => void) | null = null;
  private backgroundMessageHandler: (() => void) | null = null;
  private messaging: any = null;

  // API Configuration
  private readonly smartyUrl = 'https://smarty.kerzz.com:4004';
  private readonly apiKey = '1453';
  private readonly adminEmail = 'tolga@kerzz.com';
  private readonly adminPhone = '05323530566';
  private readonly adminName = 'Tolga Erken';

  private constructor() {
    this.initializeMessaging();
  }

  private async initializeMessaging() {
    try {
      if (Platform.OS === 'web') {
        if (notificationFunctions.isSupported) {
          const supported = await notificationFunctions.isSupported();
          if (supported && notificationFunctions.getMessaging) {
            this.messaging = notificationFunctions.getMessaging();
          }
        }
      } else {
        if (notificationFunctions.getMessaging) {
          this.messaging = notificationFunctions.getMessaging();
        }
      }
    } catch (error) {
      console.warn('⚠️ Messaging initialization hatası:', error);
    }
  }

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
      console.log('📱 Notification izinleri isteniyor...', { platform: Platform.OS });

      // Web platformu için
      if (Platform.OS === 'web') {
        // Web'de Notification API'sini kullan
        if (!('Notification' in window)) {
          console.warn('⚠️ Bu tarayıcı notification desteklemiyor');
          return { status: 'denied', canAskAgain: false };
        }

        if (Notification.permission === 'granted') {
          console.log('✅ Web notification izni zaten verilmiş');
          return { status: 'granted', canAskAgain: true };
        }

        if (Notification.permission === 'denied') {
          console.log('❌ Web notification izni reddedilmiş');
          return { status: 'denied', canAskAgain: false };
        }

        // İzin iste
        console.log('🔔 Web notification izni isteniyor...');
        const permission = await Notification.requestPermission();
        const result: NotificationPermission = {
          status: permission === 'granted' ? 'granted' : 'denied',
          canAskAgain: permission !== 'denied'
        };
        console.log('📱 Web notification izin sonucu:', result);
        return result;
      }

      // React Native platformları için
      if (!isFirebaseInitialized() || !this.messaging) {
        console.error('❌ Firebase App başlatılmamış');
        return { status: 'denied', canAskAgain: false };
      }

      if (!notificationFunctions.requestPermission || !notificationFunctions.AuthorizationStatus) {
        console.error('❌ Firebase messaging fonksiyonları yüklenemedi');
        return { status: 'denied', canAskAgain: false };
      }

      // iOS ve Android için platform-specific izin isteme
      if (Platform.OS === 'ios') {
        console.log('🍎 iOS notification izni isteniyor...');
        
        // iOS için özel izin isteme
        const authStatus = await notificationFunctions.requestPermission(this.messaging, {
          alert: true,
          badge: true,
          sound: true,
          announcement: false,
          carPlay: false,
          criticalAlert: false,
          provisional: false,
        });
        
        const enabled =
          authStatus === notificationFunctions.AuthorizationStatus.AUTHORIZED ||
          authStatus === notificationFunctions.AuthorizationStatus.PROVISIONAL;

        const result: NotificationPermission = {
          status: enabled ? 'granted' : 'denied',
          canAskAgain: authStatus === notificationFunctions.AuthorizationStatus.NOT_DETERMINED
        };
        
        console.log('📱 iOS notification izin sonucu:', { authStatus, result });
        return result;
      } else if (Platform.OS === 'android') {
        console.log('🤖 Android notification izni isteniyor...');
        console.log('🔧 Android Firebase messaging durumu:', {
          messagingInstance: !!this.messaging,
          requestPermissionFunction: !!notificationFunctions.requestPermission,
          AuthorizationStatus: !!notificationFunctions.AuthorizationStatus
        });
        
        // Android için izin isteme
        const authStatus = await notificationFunctions.requestPermission(this.messaging);
        console.log('🔍 Android raw authStatus:', authStatus);
        console.log('🔍 AuthorizationStatus enum:', {
          AUTHORIZED: notificationFunctions.AuthorizationStatus.AUTHORIZED,
          PROVISIONAL: notificationFunctions.AuthorizationStatus.PROVISIONAL,
          NOT_DETERMINED: notificationFunctions.AuthorizationStatus.NOT_DETERMINED,
          DENIED: notificationFunctions.AuthorizationStatus.DENIED
        });
        
        const enabled =
          authStatus === notificationFunctions.AuthorizationStatus.AUTHORIZED ||
          authStatus === notificationFunctions.AuthorizationStatus.PROVISIONAL;

        const result: NotificationPermission = {
          status: enabled ? 'granted' : 'denied',
          canAskAgain: authStatus === notificationFunctions.AuthorizationStatus.NOT_DETERMINED
        };
        
        console.log('📱 Android notification izin sonucu:', { 
          authStatus, 
          enabled,
          result,
          statusComparison: {
            isAuthorized: authStatus === notificationFunctions.AuthorizationStatus.AUTHORIZED,
            isProvisional: authStatus === notificationFunctions.AuthorizationStatus.PROVISIONAL,
            isNotDetermined: authStatus === notificationFunctions.AuthorizationStatus.NOT_DETERMINED,
            isDenied: authStatus === notificationFunctions.AuthorizationStatus.DENIED
          }
        });
        return result;
      }

      // Diğer platformlar için genel izin isteme
      const authStatus = await notificationFunctions.requestPermission(this.messaging);
      
      const enabled =
        authStatus === notificationFunctions.AuthorizationStatus.AUTHORIZED ||
        authStatus === notificationFunctions.AuthorizationStatus.PROVISIONAL;

      const result: NotificationPermission = {
        status: enabled ? 'granted' : 'denied',
        canAskAgain: authStatus === notificationFunctions.AuthorizationStatus.NOT_DETERMINED
      };
      
      console.log('📱 Genel notification izin sonucu:', { authStatus, result });
      return result;
    } catch (error) {
      console.error('❌ FCM permission request hatası:', error);
      return { status: 'denied', canAskAgain: false };
    }
  }


  /**
   * FCM token al
   */
  async getToken(): Promise<string | null> {
    try {
      // Web platformu için
      if (Platform.OS === 'web') {
        const permission = await this.requestPermissions();
        if (permission.status !== 'granted') {
          console.warn('Web notification izni verilmedi');
          return null;
        }

        if (!this.messaging || !notificationFunctions.getToken) {
          console.warn('⚠️ Web Firebase messaging mevcut değil');
          return null;
        }

        const token = await notificationFunctions.getToken(this.messaging);
        this.currentToken = token;
        if (token) {
          await this.saveTokenToStorage(token);
        }
        return token;
      }

      // React Native platformları için
      if (!isFirebaseInitialized() || !this.messaging) {
        console.error('❌ Firebase App başlatılmamış');
        return null;
      }

      const permission = await this.requestPermissions();
      console.log('🔍 Token alma - permission durumu:', permission);
      if (permission.status !== 'granted') {
        console.warn('⚠️ FCM notification izni verilmedi, token alınamıyor');
        return null;
      }

      if (!notificationFunctions.getToken) {
        console.error('❌ Firebase getToken fonksiyonu yüklenemedi');
        return null;
      }

      console.log('📱 FCM token alınıyor...', { platform: Platform.OS });
      const token = await notificationFunctions.getToken(this.messaging);
      console.log('📱 FCM token alındı:', { 
        hasToken: !!token, 
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : null
      });

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
        platform: Platform.OS as 'ios' | 'android' | 'web',
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
    // Web platformu için
    if (Platform.OS === 'web') {
      if (!this.messaging || !notificationFunctions.onMessage) {
        console.warn('⚠️ Web Firebase messaging mevcut değil');
        return;
      }

      // Foreground message listener (Web)
      this.messageListener = notificationFunctions.onMessage(this.messaging, async (payload: any) => {
        console.log('🔔 FCM message alındı (web foreground):', payload);
        console.log('📱 Bildirim Detayları:', {
          title: payload.notification?.title,
          body: payload.notification?.body,
          data: payload.data,
          from: payload.from,
          messageId: payload.messageId,
          timestamp: new Date().toISOString()
        });
        this.handleForegroundMessage(payload);
      });

      console.log('✅ Web FCM listener başlatıldı');
      
      // Logging bilgilerini göster
      this.showNotificationLoggingInfo();
      return;
    }

    // React Native platformları için
    if (!isFirebaseInitialized() || !this.messaging) {
      console.error('❌ Firebase App başlatılmamış, listener başlatılamıyor');
      return;
    }

    if (!notificationFunctions.onMessage || !notificationFunctions.onTokenRefresh || !notificationFunctions.setBackgroundMessageHandler) {
      console.error('❌ Firebase messaging fonksiyonları yüklenemedi');
      return;
    }

    // Foreground message listener
    this.messageListener = notificationFunctions.onMessage(this.messaging, async (remoteMessage: any) => {
      console.log('🔔 FCM message alındı (foreground):', remoteMessage);
      console.log('📱 Platform:', Platform.OS);
      console.log('📱 Bildirim Detayları:', {
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
        from: remoteMessage.from,
        messageId: remoteMessage.messageId,
        sentTime: remoteMessage.sentTime,
        ttl: remoteMessage.ttl,
        timestamp: new Date().toISOString(),
        hasNotification: !!remoteMessage.notification,
        hasData: !!remoteMessage.data,
        platform: Platform.OS
      });
      this.handleForegroundMessage(remoteMessage);
    });

    // Token refresh listener
    this.tokenRefreshListener = notificationFunctions.onTokenRefresh(this.messaging, async (token: string) => {
      console.log('FCM token yenilendi:', token);
      await this.handleTokenRefresh(token);
    });

    // Background message handler
    notificationFunctions.setBackgroundMessageHandler(this.messaging, async (remoteMessage: any) => {
      console.log('🔔 FCM message alındı (background):', remoteMessage);
      console.log('📱 Background Bildirim Detayları:', {
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
        from: remoteMessage.from,
        messageId: remoteMessage.messageId,
        sentTime: remoteMessage.sentTime,
        ttl: remoteMessage.ttl,
        timestamp: new Date().toISOString()
      });
      this.handleBackgroundMessage(remoteMessage);
    });

    console.log('✅ React Native FCM listener başlatıldı');
    
    // Logging bilgilerini göster
    this.showNotificationLoggingInfo();
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
  private handleForegroundMessage(remoteMessage: any): void {
    // Burada custom in-app notification gösterebiliriz
    // Veya notification store'u güncelleyebiliriz
    console.log('✅ Foreground FCM message işlendi:', remoteMessage.notification?.title);
    console.log('🔍 İşlenen mesaj detayları:', {
      hasNotification: !!remoteMessage.notification,
      hasData: !!remoteMessage.data,
      dataKeys: remoteMessage.data ? Object.keys(remoteMessage.data) : [],
      notificationKeys: remoteMessage.notification ? Object.keys(remoteMessage.notification) : []
    });
    
    // Yeni notification handler'ı çağır (uygulama açık)
    this.handleNotification(remoteMessage, true);
    
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
  private handleBackgroundMessage(remoteMessage: any): void {
    console.log('✅ Background FCM message işlendi:', remoteMessage.notification?.title);
    console.log('🔍 Background mesaj detayları:', {
      hasNotification: !!remoteMessage.notification,
      hasData: !!remoteMessage.data,
      dataKeys: remoteMessage.data ? Object.keys(remoteMessage.data) : [],
      notificationKeys: remoteMessage.notification ? Object.keys(remoteMessage.notification) : []
    });
    
    // Yeni notification handler'ı çağır (uygulama kapalı)
    this.handleNotification(remoteMessage, false);
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
    console.log('📲 Local notification gösterildi:', { 
      title, 
      body, 
      data,
      timestamp: new Date().toISOString(),
      hasCustomData: !!data && Object.keys(data).length > 0
    });
  }

  /**
   * FCM topic'ine subscribe ol
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      // Web platformunda topic subscription desteklenmiyor
      if (Platform.OS === 'web') {
        console.warn('⚠️ Web platformunda topic subscription desteklenmiyor');
        return;
      }

      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized() || !this.messaging) {
        throw new Error('Firebase App başlatılmamış');
      }

      if (!notificationFunctions.subscribeToTopic) {
        throw new Error('subscribeToTopic fonksiyonu yüklenemedi');
      }

      await notificationFunctions.subscribeToTopic(this.messaging, topic);
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
      // Web platformunda topic subscription desteklenmiyor
      if (Platform.OS === 'web') {
        console.warn('⚠️ Web platformunda topic subscription desteklenmiyor');
        return;
      }

      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized() || !this.messaging) {
        throw new Error('Firebase App başlatılmamış');
      }

      if (!notificationFunctions.unsubscribeFromTopic) {
        throw new Error('unsubscribeFromTopic fonksiyonu yüklenemedi');
      }

      await notificationFunctions.unsubscribeFromTopic(this.messaging, topic);
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
      // Web platformunda token silme desteklenmiyor
      if (Platform.OS === 'web') {
        console.warn('⚠️ Web platformunda token silme desteklenmiyor');
        this.currentToken = null;
        return;
      }

      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized() || !this.messaging) {
        console.error('❌ Firebase App başlatılmamış, token silinemiyor');
        return;
      }

      if (!notificationFunctions.deleteToken) {
        console.error('❌ deleteToken fonksiyonu yüklenemedi');
        return;
      }

      await notificationFunctions.deleteToken(this.messaging);
      this.currentToken = null;
      console.log('FCM token silindi');
    } catch (error) {
      console.error('FCM token silme hatası:', error);
    }
  }

  /**
   * Uygulama açılma nedenini kontrol et (notification'dan mı?)
   */
  async getInitialNotification(): Promise<any | null> {
    try {
      // Web platformunda initial notification desteklenmiyor
      if (Platform.OS === 'web') {
        console.warn('⚠️ Web platformunda initial notification desteklenmiyor');
        return null;
      }

      // Firebase App'in başlatılıp başlatılmadığını kontrol et
      if (!isFirebaseInitialized() || !this.messaging) {
        console.error('❌ Firebase App başlatılmamış, initial notification alınamıyor');
        return null;
      }

      if (!notificationFunctions.getInitialNotification) {
        console.error('❌ getInitialNotification fonksiyonu yüklenemedi');
        return null;
      }

      const remoteMessage = await notificationFunctions.getInitialNotification(this.messaging);
      if (remoteMessage) {
        console.log('🚀 Uygulama notification ile açıldı:', remoteMessage);
        console.log('📱 Initial Notification Detayları:', {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
          from: remoteMessage.from,
          messageId: remoteMessage.messageId,
          sentTime: remoteMessage.sentTime,
          ttl: remoteMessage.ttl,
          timestamp: new Date().toISOString(),
          hasNotification: !!remoteMessage.notification,
          hasData: !!remoteMessage.data,
          dataKeys: remoteMessage.data ? Object.keys(remoteMessage.data) : []
        });
        
        // Initial notification handler'ı çağır (uygulama kapalıyken açıldı)
        this.handleNotification(remoteMessage, false);
      } else {
        console.log('ℹ️ Uygulama normal şekilde açıldı (notification ile değil)');
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

  /**
   * Satışçı atama bildirimi gönder
   */
  async sendSellerAssignmentNotification(
    sellerToken: string,
    opportunityData: {
      id: string;
      no?: string | number;
      company?: string;
      sellerName: string;
    }
  ): Promise<void> {
    try {
      console.log('📤 Satışçı atama bildirimi gönderiliyor:', {
        sellerToken: sellerToken.substring(0, 20) + '...',
        opportunityId: opportunityData.id,
        opportunityNo: opportunityData.no,
        sellerName: opportunityData.sellerName
      });

      // Local notification gönder (test için)
      await this.showLocalNotification(
        'Yeni Fırsat Atandı',
        `${opportunityData.no ? `#${opportunityData.no}` : ''} ${opportunityData.company || 'Yeni fırsat'} size atandı.`,
        {
          type: 'seller_assignment',
          opportunityId: opportunityData.id,
          opportunityNo: opportunityData.no,
          company: opportunityData.company,
          sellerName: opportunityData.sellerName
        }
      );

      console.log('✅ Satışçı atama bildirimi gönderildi');
    } catch (error) {
      console.error('❌ Satışçı atama bildirimi gönderme hatası:', error);
      // Bildirim hatası ana işlemi engellemez
    }
  }

  /**
   * Admin'e satışçı atama bildirimi gönder
   */
  async sendAdminSellerAssignmentNotification(
    opportunityData: {
      id: string;
      no?: string | number;
      company?: string;
      sellerName: string;
    }
  ): Promise<void> {
    try {
      console.log('📤 Admin satışçı atama bildirimi gönderiliyor:', {
        opportunityId: opportunityData.id,
        opportunityNo: opportunityData.no,
        sellerName: opportunityData.sellerName
      });

      // Local notification gönder (test için)
      await this.showLocalNotification(
        'Satışçı Atandı',
        `${opportunityData.sellerName} satışçısı ${opportunityData.no ? `#${opportunityData.no}` : ''} ${opportunityData.company || 'fırsata'} atandı.`,
        {
          type: 'admin_seller_assignment',
          opportunityId: opportunityData.id,
          opportunityNo: opportunityData.no,
          company: opportunityData.company,
          sellerName: opportunityData.sellerName
        }
      );

      console.log('✅ Admin satışçı atama bildirimi gönderildi');
    } catch (error) {
      console.error('❌ Admin satışçı atama bildirimi gönderme hatası:', error);
      // Bildirim hatası ana işlemi engellemez
    }
  }

  /**
   * Email gönderme fonksiyonu (Smarty API)
   */
  async sendEmail(
    recipientName: string,
    recipientEmail: string,
    subject: string,
    htmlContent: string
  ): Promise<boolean> {
    try {
      console.log('📧 Email gönderiliyor:', {
        to: recipientEmail,
        subject: subject,
        recipientName: recipientName
      });

      const response = await fetch(`${this.smartyUrl}/api/mail/sendBasicMail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apiKey': this.apiKey
        },
        body: JSON.stringify({
          personName: recipientName,
          personMail: recipientEmail,
          subject: subject,
          text: htmlContent
        })
      });

      if (!response.ok) {
        console.error('❌ Email gönderme hatası:', response.statusText);
        return false;
      }

      console.log(`✅ Email başarıyla gönderildi: ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Email gönderme hatası:', error);
      return false;
    }
  }

  /**
   * SMS gönderme fonksiyonu (Smarty API)
   */
  async sendSms(
    phoneNumber: string,
    message: string
  ): Promise<boolean> {
    try {
      console.log('📱 SMS gönderiliyor:', {
        to: phoneNumber,
        message: message.substring(0, 50) + '...'
      });

      const response = await fetch(`${this.smartyUrl}/api/sms/sendSms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apiKey': this.apiKey
        },
        body: JSON.stringify({
          gsm: phoneNumber,
          text: message
        })
      });

      if (!response.ok) {
        console.error('❌ SMS gönderme hatası:', response.statusText);
        return false;
      }

      console.log(`✅ SMS başarıyla gönderildi: ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ SMS gönderme hatası:', error);
      return false;
    }
  }

  /**
   * Email içeriği oluşturma fonksiyonu
   */
  private buildEmailContent(opportunity: {
    no?: string | number;
    company?: string;
    request?: string;
    name?: string;
    phone?: string;
    email?: string;
    city?: string;
    logs?: { text: string; date: Date; userName: string }[];
  }): string {
    let emailContent = `
      <p>${opportunity.no || 'Yeni'} nolu talep size atanmıştır</p>
      <p>Lütfen talep ile ilgili adımları log olarak kayda alınız.</p>
      <p></p>
      <h3>${opportunity.company || 'Bilinmeyen Şirket'}</h3>
      <p>${opportunity.request || 'Talep bilgisi belirtilmemiş'}</p>
      <p>Yetkili: ${opportunity.name || 'Belirtilmemiş'}</p>
      <p>Telefon: ${opportunity.phone || 'Belirtilmemiş'}</p>
      <p>Email: ${opportunity.email || 'Belirtilmemiş'}</p>
      <p>Şehir: ${opportunity.city || 'Belirtilmemiş'}</p>
    `;

    // Log kayıtlarını ekle
    if (opportunity.logs && opportunity.logs.length > 0) {
      let logsText = "";
      for (const log of opportunity.logs) {
        const dateStr = new Date(log.date).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        logsText += `<div style='margin-top:20px'>${log.text}</div><div style='font-size:10px'>${log.userName} ${dateStr}</div>`;
      }
      
      if (logsText !== '') {
        emailContent += '<h3>Log Kayıtları</h3>' + logsText;
      }
    }

    return emailContent;
  }

  /**
   * Satışçı atama için kapsamlı bildirim gönderme (Email + SMS + Push)
   */
  async sendComprehensiveSellerAssignmentNotification(
    sellerData: {
      name: string;
      email?: string;
      phone?: string;
      fcmToken?: string;
    },
    adminData: {
      name: string;
      email?: string;
      phone?: string;
    },
    opportunityData: {
      id: string;
      no?: string | number;
      company?: string;
      request?: string;
    }
  ): Promise<void> {
    try {
      console.log('📤 Kapsamlı satışçı atama bildirimi başlatılıyor:', {
        seller: sellerData.name,
        opportunity: opportunityData.no,
        company: opportunityData.company
      });

      const emailSubject = `${opportunityData.no || 'Yeni'} - Yeni Talep Ataması (${opportunityData.company || 'Bilinmeyen Şirket'})`;
      
      // HTML email içeriği hazırla (notification.md formatında)
      const emailContent = this.buildEmailContent({
        no: opportunityData.no,
        company: opportunityData.company,
        request: opportunityData.request,
        name: 'Belirtilmemiş', // TODO: Opportunity contact name
        phone: 'Belirtilmemiş', // TODO: Opportunity contact phone
        email: 'Belirtilmemiş', // TODO: Opportunity contact email
        city: 'Belirtilmemiş', // TODO: Opportunity city
        logs: [] // TODO: Opportunity logs
      });

      // SMS içeriği hazırla (notification.md formatında)
      const smsContent = `Yeni Talep Atamasi Yapildi, No: ${opportunityData.no || 'Yeni'} Detaylar mail ile gonderildi`;

      // Paralel olarak tüm bildirimleri gönder
      const promises: Promise<any>[] = [];

      // Satışçıya email gönder
      if (sellerData.email) {
        promises.push(
          this.sendEmail(
            sellerData.name,
            sellerData.email,
            emailSubject,
            emailContent
          ).catch(error => {
            console.error('❌ Satışçıya email gönderme hatası:', error);
            return false;
          })
        );
      }

      // Satışçıya SMS gönder
      if (sellerData.phone) {
        promises.push(
          this.sendSms(sellerData.phone, smsContent).catch(error => {
            console.error('❌ Satışçıya SMS gönderme hatası:', error);
            return false;
          })
        );
      }

      // Satışçıya push notification gönder
      if (sellerData.fcmToken) {
        promises.push(
          this.sendSellerAssignmentNotification(
            sellerData.fcmToken,
            {
              id: opportunityData.id,
              no: opportunityData.no,
              company: opportunityData.company,
              sellerName: sellerData.name
            }
          ).catch(error => {
            console.error('❌ Satışçıya push notification gönderme hatası:', error);
          })
        );
      }

      // Admin'e email gönder
      promises.push(
        this.sendEmail(
          this.adminName,
          this.adminEmail,
          emailSubject,
          emailContent
        ).catch(error => {
          console.error('❌ Admin\'e email gönderme hatası:', error);
          return false;
        })
      );

      // Admin'e SMS gönder
      promises.push(
        this.sendSms(this.adminPhone, smsContent).catch(error => {
          console.error('❌ Admin\'e SMS gönderme hatası:', error);
          return false;
        })
      );

      // Admin'e push notification gönder
      promises.push(
        this.sendAdminSellerAssignmentNotification({
          id: opportunityData.id,
          no: opportunityData.no,
          company: opportunityData.company,
          sellerName: sellerData.name
        }).catch(error => {
          console.error('❌ Admin\'e push notification gönderme hatası:', error);
        })
      );

      // Tüm bildirimleri paralel olarak gönder
      await Promise.allSettled(promises);

      console.log('✅ Kapsamlı satışçı atama bildirimleri gönderildi');
    } catch (error) {
      console.error('❌ Kapsamlı bildirim gönderme hatası:', error);
      // Bildirim hatası ana işlemi engellemez
    }
  }

  /**
   * Satışçı atama bildirimi gönder (notification.md formatında)
   */
  async sendSellerAssignmentNotificationOriginal(
    seller: { name: string; mail: string; phone: string; fcmToken?: string },
    opportunity: {
      no: number;
      company: string;
      brand: string;
      request: string;
      name: string;
      phone: string;
      email: string;
      cityId: number;
      logs: { text: string; date: Date; userName: string }[];
    }
  ): Promise<void> {
    try {
      // HTML email içeriği hazırla
      const emailContent = this.buildEmailContent({
        no: opportunity.no,
        company: opportunity.company,
        request: opportunity.request,
        name: opportunity.name,
        phone: opportunity.phone,
        email: opportunity.email,
        city: opportunity.cityId.toString(),
        logs: opportunity.logs
      });
      
      // SMS içeriği hazırla  
      const smsContent = `Yeni Talep Atamasi Yapildi, No: ${opportunity.no} Detaylar mail ile gonderildi`;

      // Push notification içeriği hazırla
      // const pushNotification = {
      //   title: 'Yeni Talep Ataması',
      //   body: `${opportunity.no} nolu talep size atanmıştır - ${opportunity.company}`,
      //   data: {
      //     type: 'opportunity_assignment',
      //     opportunityNo: opportunity.no,
      //     opportunityId: opportunity.no.toString(),
      //   },
      // };

      // Paralel olarak bildirimleri gönder
      const promises = [
        // Admin'e email gönder
        this.sendEmail(
          this.adminName,
          this.adminEmail,
          `${opportunity.no} - Yeni Talep Ataması (${opportunity.brand})`,
          emailContent
        ),
        
        // Temsilciye email gönder
        this.sendEmail(
          seller.name,
          seller.mail,
          `${opportunity.no} - Yeni Talep Ataması (${opportunity.brand})`,
          emailContent
        ),
        
        // Admin'e SMS gönder
        this.sendSms(this.adminPhone, smsContent),
        
        // Temsilciye SMS gönder
        this.sendSms(seller.phone, smsContent)
      ];

      // Push notification gönder (FCM token varsa)
      if (seller.fcmToken) {
        promises.push(
          this.sendSellerAssignmentNotification(seller.fcmToken, {
            id: opportunity.no.toString(),
            no: opportunity.no,
            company: opportunity.company,
            sellerName: seller.name
          }).then(() => true).catch(() => false)
        );
      }

      const results = await Promise.allSettled(promises);
      
      // Sonuçları logla
      results.forEach((result, index) => {
        let type = 'Unknown';
        let recipient = 'Unknown';
        
        if (index < 2) {
          type = 'Email';
          recipient = index === 0 ? 'Admin' : 'Temsilci';
        } else if (index < 4) {
          type = 'SMS';
          recipient = index === 2 ? 'Admin' : 'Temsilci';
        } else {
          type = 'Push Notification';
          recipient = 'Temsilci';
        }
        
        if (result.status === 'rejected') {
          console.error(`❌ ${type} ${recipient} gönderimi başarısız:`, result.reason);
        } else {
          console.log(`✅ ${type} ${recipient} gönderimi başarılı`);
        }
      });

    } catch (error) {
      console.error('❌ Temsilci atama bildirimi gönderme hatası:', error);
    }
  }

  /**
   * Notification handler - bildirime tıklandığında veya alındığında çalışır
   */
  async handleNotification(remoteMessage: any, isAppOpen: boolean = true): Promise<void> {
    try {
      console.log('🔔 Notification handler çalıştırıldı:', {
        isAppOpen,
        hasData: !!remoteMessage?.data,
        dataKeys: remoteMessage?.data ? Object.keys(remoteMessage.data) : []
      });

      // Data varsa JSON'a çevir
      if (remoteMessage?.data) {
        try {
          // Data string ise parse et, değilse direkt kullan
          let notificationData = remoteMessage.data;
          
          console.log('🔍 Raw notification data:', notificationData);
          
          // Eğer data içinde JSON string varsa parse et
          Object.keys(notificationData).forEach(key => {
            if (typeof notificationData[key] === 'string') {
              try {
                notificationData[key] = JSON.parse(notificationData[key]);
              } catch {
                // JSON değilse string olarak bırak
              }
            }
          });

          // Özellikle fullDocument JSON string olarak geliyorsa parse et (çoklu escape durumu)
          if (notificationData.fullDocument && typeof notificationData.fullDocument === 'string') {
            try {
              let parsedDocument = notificationData.fullDocument;
              
              // Çoklu JSON parse (escape karakterleri için)
              let parseAttempts = 0;
              const maxAttempts = 5; // Maksimum 5 kez dene
              
              while (typeof parsedDocument === 'string' && parseAttempts < maxAttempts) {
                try {
                  const beforeParse = parsedDocument;
                  parsedDocument = JSON.parse(parsedDocument);
                  console.log(`📄 fullDocument parse attempt ${parseAttempts + 1}:`, {
                    before: beforeParse.substring(0, 100) + '...',
                    after: parsedDocument
                  });
                  parseAttempts++;
                } catch (parseError) {
                  console.log(`❌ Parse attempt ${parseAttempts + 1} failed:`, parseError);
                  break;
                }
              }
              
              notificationData.fullDocument = parsedDocument;
              console.log('✅ fullDocument başarıyla parse edildi:', notificationData.fullDocument);
            } catch (error) {
              console.error('❌ fullDocument JSON parse hatası:', error);
              console.log('🔍 Raw fullDocument:', notificationData.fullDocument);
            }
          }

          console.log('📋 Final parsed notification data:', notificationData);
          console.log('📄 fullDocument type:', typeof notificationData.fullDocument);
          console.log('📄 fullDocument content:', notificationData.fullDocument);

          // fullDocument ve module kontrolü
          if (notificationData.fullDocument && notificationData.module) {
            await this.handleModuleNotification(
              notificationData.module,
              notificationData.fullDocument,
              isAppOpen
            );
          } else {
            console.log('ℹ️ Notification data\'da fullDocument veya module bulunamadı');
            console.log('🔍 Mevcut data keys:', Object.keys(notificationData));
            console.log('🔍 fullDocument var mı:', !!notificationData.fullDocument);
            console.log('🔍 module var mı:', !!notificationData.module);
          }
        } catch (error) {
          console.error('❌ Notification data parse hatası:', error);
        }
      } else {
        console.log('ℹ️ Notification\'da data bulunamadı');
      }
    } catch (error) {
      console.error('❌ Notification handler hatası:', error);
    }
  }

  /**
   * Module-based notification handler
   */
  private async handleModuleNotification(
    module: string,
    fullDocument: any,
    isAppOpen: boolean
  ): Promise<void> {
    console.log('🎯 Module notification handler:', { module, isAppOpen });

    switch (module) {
      case 'sale':
        await this.handleSaleNotification(fullDocument, isAppOpen);
        break;
      case 'opportunity':
        await this.handleOpportunityNotification(fullDocument, isAppOpen);
        break;
      case 'bank-transaction':
        await this.handleBankTransactionNotification(fullDocument, isAppOpen);
        break;
      default:
        console.log(`⚠️ Bilinmeyen module: ${module}`);
        break;
    }
  }

  /**
   * Sale module notification handler
   */
  private async handleSaleNotification(saleData: any, isAppOpen: boolean): Promise<void> {
    try {
      console.log('💰 Sale notification handler:', { 
        saleNo: saleData?.no, 
        isAppOpen 
      });

      if (!saleData?.no) {
        console.error('❌ Sale data\'da no bulunamadı');
        return;
      }

      if (isAppOpen) {
        // Uygulama açıkken onay dialog göster
        await this.showSaleNavigationDialog(saleData);
      } else {
        // Uygulama kapalıyken direkt yönlendir
        await this.navigateToSale(saleData.no);
      }
    } catch (error) {
      console.error('❌ Sale notification handler hatası:', error);
    }
  }

  /**
   * Opportunity module notification handler
   */
  private async handleOpportunityNotification(opportunityData: any, isAppOpen: boolean): Promise<void> {
    try {
      console.log('🎯 Opportunity notification handler:', {
        opportunityNo: opportunityData?.no,
        isAppOpen
      });

      if (!opportunityData?.no && !opportunityData?.id && !opportunityData?.company) {
        console.error('❌ Opportunity data geçersiz (no/id/company yok)');
        return;
      }

      // Öncelik: no → id → company
      const searchQuery = opportunityData?.no?.toString() || opportunityData?.id || opportunityData?.company;

      if (isAppOpen) {
        await this.showOpportunityNavigationDialog(searchQuery, opportunityData);
      } else {
        await this.navigateToOpportunity(searchQuery);
      }
    } catch (error) {
      console.error('❌ Opportunity notification handler hatası:', error);
    }
  }

  /**
   * Fırsat yönlendirme onay dialogu (uygulama açıkken)
   */
  private async showOpportunityNavigationDialog(searchQuery: string, opportunityData?: any): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        const title = 'Fırsat Bildirimi';
        const bodyLines: string[] = [];
        if (opportunityData?.no) bodyLines.push(`Fırsat No: ${opportunityData.no}`);
        if (opportunityData?.company) bodyLines.push(`Şirket: ${opportunityData.company}`);
        const message = `${bodyLines.join('\n')}${bodyLines.length ? '\n\n' : ''}Bu fırsatı görüntülemek istiyor musunuz?`;

        if (Platform.OS === 'web') {
          const canConfirm = typeof confirm === 'function';
          const userConfirmed = canConfirm ? confirm(`${title}\n\n${message}`) : true;
          if (userConfirmed) {
            console.log('📱 Kullanıcı fırsat yönlendirmesini onayladı (web)');
            await this.navigateToOpportunity(searchQuery);
          } else {
            console.log('📱 Kullanıcı fırsat yönlendirmesini iptal etti (web)');
          }
          resolve();
        } else {
          try {
            Alert.alert(
              title,
              message,
              [
                {
                  text: 'İptal',
                  style: 'cancel',
                  onPress: () => {
                    console.log('📱 Kullanıcı fırsat yönlendirmesini iptal etti');
                    resolve();
                  }
                },
                {
                  text: 'Görüntüle',
                  onPress: async () => {
                    console.log('📱 Kullanıcı fırsat yönlendirmesini onayladı');
                    await this.navigateToOpportunity(searchQuery);
                    resolve();
                  }
                }
              ]
            );
          } catch (importError) {
            console.error('❌ Alert import hatası:', importError);
            await this.navigateToOpportunity(searchQuery);
            resolve();
          }
        }
      } catch (error) {
        console.error('❌ Fırsat dialog gösterme hatası:', error);
        await this.navigateToOpportunity(searchQuery);
        resolve();
      }
    });
  }

  /**
   * Fırsata yönlendirme (Opportunities ekranına git ve arama yap)
   */
  private async navigateToOpportunity(searchQuery: string): Promise<void> {
    try {
      console.log('🧭 Fırsata yönlendiriliyor, arama:', searchQuery);
      const { router } = await import('expo-router');
      router.push({
        pathname: '/(drawer)/opportunities',
        params: {
          searchQuery: searchQuery?.toString?.() || String(searchQuery)
        }
      });
      console.log('✅ Fırsatlar sayfasına yönlendirildi');
    } catch (error) {
      console.error('❌ Fırsat yönlendirme hatası:', error);
    }
  }

  /**
   * Satış yönlendirme onay dialogu (uygulama açıkken)
   */
  private async showSaleNavigationDialog(saleData: any): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        if (Platform.OS === 'web') {
          // Web'de confirm kullan
          const canConfirm = typeof confirm === 'function';
          const userConfirmed = canConfirm ? confirm(
            `Satış Bildirimi\n\nSatış No: ${saleData.no}\n\nBu satışı görüntülemek istiyor musunuz?`
          ) : true;
          
          if (userConfirmed) {
            console.log('📱 Kullanıcı satış yönlendirmesini onayladı (web)');
            await this.navigateToSale(saleData.no);
          } else {
            console.log('📱 Kullanıcı satış yönlendirmesini iptal etti (web)');
          }
          resolve();
        } else {
          // React Native Alert'i güvenli şekilde import et
          try {
            Alert.alert(
              'Satış Bildirimi',
              `Satış No: ${saleData.no}\n\nBu satışı görüntülemek istiyor musunuz?`,
              [
                {
                  text: 'İptal',
                  style: 'cancel',
                  onPress: () => {
                    console.log('📱 Kullanıcı satış yönlendirmesini iptal etti');
                    resolve();
                  }
                },
                {
                  text: 'Görüntüle',
                  onPress: async () => {
                    console.log('📱 Kullanıcı satış yönlendirmesini onayladı');
                    await this.navigateToSale(saleData.no);
                    resolve();
                  }
                }
              ]
            );
          } catch (importError) {
            console.error('❌ Alert import hatası:', importError);
            // Alert import edilemezse direkt yönlendir
            await this.navigateToSale(saleData.no);
            resolve();
          }
        }
      } catch (error) {
        console.error('❌ Alert gösterme hatası:', error);
        // Hata durumunda direkt yönlendir
        await this.navigateToSale(saleData.no);
        resolve();
      }
    });
  }

  /**
   * Satışa yönlendirme (SalesScreen'e git ve arama yap)
   */
  private async navigateToSale(saleNo: string | number): Promise<void> {
    try {
      console.log('🧭 Satışa yönlendiriliyor:', saleNo);
      
      // Expo router kullanarak yönlendir
      const { router } = await import('expo-router');
      
      // Sales sayfasına git ve arama parametresi ile
      router.push({
        pathname: '/(drawer)/sales',
        params: {
          searchQuery: saleNo.toString()
        }
      });
      
      console.log('✅ Satış sayfasına yönlendirildi');
    } catch (error) {
      console.error('❌ Satış yönlendirme hatası:', error);
    }
  }

  /**
   * Banka hareketi module notification handler
   */
  private async handleBankTransactionNotification(transactionData: any, isAppOpen: boolean): Promise<void> {
    try {
      console.log('🏦 Banka hareketi notification handler:', {
        id: transactionData?.id || transactionData?._id || transactionData?.no || transactionData?.transactionNo,
        isAppOpen
      });

      if (!transactionData || Object.keys(transactionData).length === 0) {
        console.error('❌ Banka hareketi verisi geçersiz');
        return;
      }

      if (isAppOpen) {
        await this.showBankTransactionNavigationDialog(transactionData);
      } else {
        await this.navigateToBankTransaction(transactionData);
      }
    } catch (error) {
      console.error('❌ Banka hareketi notification handler hatası:', error);
    }
  }

  /**
   * Banka hareketi yönlendirme onay dialogu (uygulama açıkken)
   */
  private async showBankTransactionNavigationDialog(transactionData: any): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        const title = 'Banka Hareketi Bildirimi';
        const lines: string[] = [];
        const txNo = transactionData?.transactionNo || transactionData?.no || transactionData?.id || transactionData?._id;
        if (txNo) lines.push(`Hareket No: ${txNo}`);
        if (transactionData?.amount) lines.push(`Tutar: ${transactionData.amount} ${transactionData?.currency || ''}`.trim());
        if (transactionData?.company) lines.push(`Şirket: ${transactionData.company}`);
        if (transactionData?.opportunityNo) lines.push(`Fırsat No: ${transactionData.opportunityNo}`);
        const message = `${lines.join('\n')}${lines.length ? '\n\n' : ''}Bu banka hareketini görüntülemek istiyor musunuz?`;

        if (Platform.OS === 'web') {
          const canConfirm = typeof confirm === 'function';
          const userConfirmed = canConfirm ? confirm(`${title}\n\n${message}`) : true;
          if (userConfirmed) {
            console.log('📱 Kullanıcı banka hareketi yönlendirmesini onayladı (web)');
            await this.navigateToBankTransaction(transactionData);
          } else {
            console.log('📱 Kullanıcı banka hareketi yönlendirmesini iptal etti (web)');
          }
          resolve();
        } else {
          try {
            Alert.alert(
              title,
              message,
              [
                {
                  text: 'İptal',
                  style: 'cancel',
                  onPress: () => {
                    console.log('📱 Kullanıcı banka hareketi yönlendirmesini iptal etti');
                    resolve();
                  }
                },
                {
                  text: 'Görüntüle',
                  onPress: async () => {
                    console.log('📱 Kullanıcı banka hareketi yönlendirmesini onayladı');
                    await this.navigateToBankTransaction(transactionData);
                    resolve();
                  }
                }
              ]
            );
          } catch (importError) {
            console.error('❌ Alert import hatası:', importError);
            await this.navigateToBankTransaction(transactionData);
            resolve();
          }
        }
      } catch (error) {
        console.error('❌ Banka hareketi dialog gösterme hatası:', error);
        await this.navigateToBankTransaction(transactionData);
        resolve();
      }
    });
  }

  /**
   * Banka hareketine yönlendirme (mock detay ekranına git)
   */
  private async navigateToBankTransaction(transactionData: any): Promise<void> {
    try {
      console.log('🧭 Banka hareketine yönlendiriliyor');
      const { router } = await import('expo-router');
      router.push({
        pathname: '/(drawer)/bank-transaction-detail',
        params: {
          transactionData: JSON.stringify(transactionData)
        }
      });
      console.log('✅ Banka hareketi detay ekranına yönlendirildi');
    } catch (error) {
      console.error('❌ Banka hareketi yönlendirme hatası:', error);
    }
  }

  /**
   * Test için notification handler'ı manuel olarak çağır
   */
  async testNotificationHandler(saleNo: string | number, isAppOpen: boolean = true, testFormat: 'object' | 'simple-json' | 'complex-json' = 'object'): Promise<void> {
    console.log('🧪 Test notification handler çağrılıyor:', { saleNo, isAppOpen, testFormat });
    
    let testNotification;
    
    const saleData = {
      id: "182b-79eb",
      no: saleNo.toString()
    };
    
    switch (testFormat) {
      case 'object':
        // fullDocument'ı obje olarak test et
        testNotification = {
          data: {
            module: 'sale',
            fullDocument: saleData
          },
          notification: {
            title: 'Yeni Satış',
            body: `Satış No: ${saleNo} için bildirim`
          }
        };
        break;
        
      case 'simple-json':
        // fullDocument'ı basit JSON string olarak test et
        testNotification = {
          data: {
            module: 'sale',
            fullDocument: JSON.stringify(saleData)
          },
          notification: {
            title: 'Yeni Satış (Simple JSON)',
            body: `Satış No: ${saleNo} için bildirim (basit JSON string)`
          }
        };
        break;
        
      case 'complex-json':
        // Gerçek notification formatını simüle et (çoklu escape)
        const complexFullDocument = JSON.stringify(JSON.stringify(saleData));
        testNotification = {
          data: {
            timestamp: new Date().toISOString(),
            module: 'sale',
            fullDocument: complexFullDocument,
            pushLogId: "",
            source: "kerzz-ai-backend"
          },
          notification: {
            title: 'Yeni Satış (Complex JSON)',
            body: `Satış No: ${saleNo} için bildirim (karmaşık JSON string)`
          }
        };
        break;
    }

    await this.handleNotification(testNotification, isAppOpen);
  }

  /**
   * Android notification debug bilgilerini göster
   */
  async debugAndroidNotifications(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('⚠️ Bu fonksiyon sadece Android için geçerlidir');
      return;
    }

    console.log('🤖 Android Notification Debug Başlatılıyor...');
    console.log('=====================================');
    
    // Firebase durumu
    console.log('🔥 Firebase durumu:', {
      isInitialized: isFirebaseInitialized(),
      hasMessaging: !!this.messaging,
      hasRequestPermission: !!notificationFunctions.requestPermission,
      hasGetToken: !!notificationFunctions.getToken,
      hasOnMessage: !!notificationFunctions.onMessage
    });

    // İzin durumu
    try {
      const permission = await this.requestPermissions();
      console.log('📱 İzin durumu:', permission);
    } catch (error) {
      console.error('❌ İzin kontrolü hatası:', error);
    }

    // Token durumu
    try {
      const token = await this.getToken();
      console.log('🔑 Token durumu:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 30) + '...' : null
      });
    } catch (error) {
      console.error('❌ Token alma hatası:', error);
    }

    // Listener durumu
    console.log('👂 Listener durumu:', {
      hasMessageListener: !!this.messageListener,
      hasTokenRefreshListener: !!this.tokenRefreshListener
    });

    console.log('=====================================');
  }

  /**
   * Notification logging durumunu göster
   */
  showNotificationLoggingInfo(): void {
    console.log('📋 Notification Logging Bilgileri:');
    console.log('✅ Foreground mesajlar console\'da loglanıyor');
    console.log('✅ Background mesajlar console\'da loglanıyor');
    console.log('✅ Initial notification (uygulama bildirimle açılırsa) loglanıyor');
    console.log('✅ Token refresh olayları loglanıyor');
    console.log('✅ Local notification gösterim olayları loglanıyor');
    console.log('✅ Notification handler sistemi aktif');
    console.log('');
    console.log('🔍 Loglanacak bildirim verileri:');
    console.log('  • title: Bildirim başlığı');
    console.log('  • body: Bildirim içeriği');
    console.log('  • data: Özel veri (custom payload)');
    console.log('  • from: Gönderen bilgisi');
    console.log('  • messageId: Mesaj ID\'si');
    console.log('  • sentTime: Gönderilme zamanı');
    console.log('  • ttl: Time to live');
    console.log('  • timestamp: Log zamanı');
    console.log('');
    console.log('🎯 Test için push notification gönderin ve console\'ı kontrol edin!');
    console.log('🧪 Test için: NotificationService.getInstance().testNotificationHandler("12345", true/false)');
  }
}

export default NotificationService;
