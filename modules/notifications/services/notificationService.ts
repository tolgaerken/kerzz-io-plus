import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { isFirebaseInitialized } from '../../../config/firebase';
import {
    FCMToken,
    NotificationPermission,
    NotificationSettings
} from '../types';

// Debug data interface
interface NotificationDebugData {
  id: string;
  timestamp: string;
  type: 'foreground' | 'background' | 'initial';
  platform: string;
  rawData: any;
  parsedData?: any;
  module?: string;
  fullDocument?: any;
  notification?: {
    title?: string;
    body?: string;
  };
  data?: any;
  from?: string;
  messageId?: string;
  sentTime?: number;
  ttl?: number;
}

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
        getAPNSToken: firebaseMessaging.getAPNSToken,
        setAPNSToken: firebaseMessaging.setAPNSToken,
        registerDeviceForRemoteMessages: firebaseMessaging.registerDeviceForRemoteMessages,
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
    // Test fonksiyonlarını setup et
    NotificationService.setupConsoleTest();
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

        // Android 13+ (API 33) için çalışma zamanı izni gerekir
        const apiLevel = Platform.Version as number;
        if (apiLevel >= 33) {
          try {
            const result = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );

            const granted = result === PermissionsAndroid.RESULTS.GRANTED;
            const canAskAgain = result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

            const permissionResult: NotificationPermission = {
              status: granted ? 'granted' : 'denied',
              canAskAgain,
            };

            console.log('📱 Android 13+ notification izin sonucu:', {
              result,
              permissionResult,
            });

            return permissionResult;
          } catch (androidError) {
            console.error('❌ Android permission request hatası:', androidError);
            return { status: 'denied', canAskAgain: false };
          }
        }

        // Android 12 ve altı için çalışma zamanı izni yok, manifest yeterli
        console.log('ℹ️ Android < 13 için çalışma zamanı izni gerekmiyor');
        return { status: 'granted', canAskAgain: true };
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
      console.log('🔍 FCM Token alma işlemi başlatılıyor...', { 
        platform: Platform.OS,
        isFirebaseInitialized: isFirebaseInitialized(),
        hasMessaging: !!this.messaging,
        hasGetTokenFunction: !!notificationFunctions.getToken
      });

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

      // React Native platformları için - detaylı debug
      console.log('🔍 Firebase durumu kontrol ediliyor...');
      if (!isFirebaseInitialized()) {
        console.error('❌ Firebase App başlatılmamış');
        console.log('🔧 Firebase başlatma deneniyor...');
        
        try {
          const { initializeFirebase } = await import('../../../config/firebase');
          const initialized = await initializeFirebase();
          console.log('🔧 Firebase başlatma sonucu:', initialized);
          
          if (!initialized) {
            console.error('❌ Firebase başlatılamadı');
            return null;
          }
        } catch (initError) {
          console.error('❌ Firebase başlatma hatası:', initError);
          return null;
        }
      }

      if (!this.messaging) {
        console.error('❌ Messaging instance mevcut değil');
        console.log('🔧 Messaging instance oluşturuluyor...');
        await this.initializeMessaging();
        
        if (!this.messaging) {
          console.error('❌ Messaging instance oluşturulamadı');
          return null;
        }
      }

      console.log('✅ Firebase ve Messaging hazır');

      const permission = await this.requestPermissions();
      console.log('🔍 Token alma - permission durumu:', permission);
      if (permission.status !== 'granted') {
        console.warn('⚠️ FCM notification izni verilmedi, token alınamıyor');
        return null;
      }

      if (!notificationFunctions.getToken) {
        console.error('❌ Firebase getToken fonksiyonu yüklenemedi');
        console.log('🔍 Mevcut notification functions:', Object.keys(notificationFunctions));
        return null;
      }

      console.log('📱 FCM token alınıyor...', { 
        platform: Platform.OS,
        messagingInstance: !!this.messaging,
        getTokenFunction: !!notificationFunctions.getToken
      });

      // iOS için APNS token kontrolü ve ayarlama
      if (Platform.OS === 'ios') {
        console.log('🍎 iOS için APNS token kontrolü yapılıyor...');
        
        try {
          // iOS'ta remote messages için cihazı kaydet (APNS token üretimi için gerekli)
          if (notificationFunctions.registerDeviceForRemoteMessages) {
            try {
              await notificationFunctions.registerDeviceForRemoteMessages(this.messaging);
              console.log('🍎 registerDeviceForRemoteMessages çağrıldı');
            } catch (regError) {
              console.log('🍎 registerDeviceForRemoteMessages hatası:', regError instanceof Error ? regError.message : String(regError));
            }
          }

          // APNS token'ı kontrol et
          let apnsToken = null;
          if (notificationFunctions.getAPNSToken) {
            try {
              apnsToken = await notificationFunctions.getAPNSToken(this.messaging);
              console.log('🍎 Mevcut APNS Token:', apnsToken ? 'Var' : 'Yok');
            } catch (apnsError) {
              console.log('🍎 APNS Token alma hatası:', apnsError instanceof Error ? apnsError.message : String(apnsError));
            }
          }

          // APNS token yoksa, iOS simülatör için özel işlem
          if (!apnsToken) {
            console.log('🍎 APNS Token henüz yok, iOS simülatörde test için setAPNSToken denenecek');
            try {
              // Sadece simülatörde sahte APNS token set et
              if (!Device.isDevice && notificationFunctions.setAPNSToken) {
                // 32-byte (64 hex char) sahte token üret
                const fakeToken = 'a'.repeat(64);
                await notificationFunctions.setAPNSToken(this.messaging, fakeToken);
                console.log('🍎 setAPNSToken (fake) çağrıldı');
                // Tekrar kontrol et
                try {
                  apnsToken = await notificationFunctions.getAPNSToken(this.messaging);
                  console.log('🍎 set sonrası APNS Token:', apnsToken ? 'Var' : 'Yok');
                } catch {}
              } else {
                console.log('🍎 Fiziksel cihaz ya da setAPNSToken mevcut değil, beklemeye geçiliyor');
              }
            } catch (setError) {
              console.log('🍎 setAPNSToken hatası:', setError instanceof Error ? setError.message : String(setError));
            }
          }
        } catch (apnsCheckError) {
          console.log('🍎 APNS token kontrol hatası:', apnsCheckError instanceof Error ? apnsCheckError.message : String(apnsCheckError));
        }
      }
      
      const token = await notificationFunctions.getToken(this.messaging);
      console.log('📱 FCM token alma sonucu:', { 
        hasToken: !!token, 
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : null,
        tokenType: typeof token
      });

      if (!token) {
        console.error('❌ FCM token null döndü - detaylı debug:');
        console.log('🔍 Messaging instance detayları:', {
          messaging: this.messaging,
          messagingType: typeof this.messaging,
          messagingKeys: this.messaging ? Object.keys(this.messaging) : 'N/A'
        });
        
        // APNs token kontrolü (iOS için)
        if (Platform.OS === 'ios') {
          try {
            console.log('🍎 iOS APNs token kontrol ediliyor...');
            const apnsToken = await notificationFunctions.getAPNSToken?.(this.messaging);
            console.log('🍎 APNs token:', apnsToken ? 'Mevcut' : 'Yok');
          } catch (apnsError) {
            console.log('🍎 APNs token hatası:', apnsError);
          }
        }
        
        return null;
      }

      this.currentToken = token;
      await this.saveTokenToStorage(token);
      
      return token;
    } catch (error) {
      console.error('❌ FCM token alma hatası:', error);
      console.error('❌ Hata detayları:', {
        message: error instanceof Error ? error.message : String(error),
        code: error && typeof error === 'object' && 'code' in error ? error.code : 'unknown',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined
      });
      
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
    
    // Debug data kaydet
    this.saveDebugData(remoteMessage, 'foreground');
    
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
    
    // Debug data kaydet
    this.saveDebugData(remoteMessage, 'background');
    
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
        autoRedirect: false, // Varsayılan olarak kullanıcıya sor
      };
    } catch (error) {
      console.error('Ayarları okuma hatası:', error);
      return {
        categories: {},
        sound: true,
        vibration: true,
        badge: true,
        inApp: true,
        autoRedirect: false, // Varsayılan olarak kullanıcıya sor
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
        
        // Debug data kaydet
        this.saveDebugData(remoteMessage, 'initial');
        
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
   * Kullanıcının otomatik yönlendirme ayarını kontrol et
   */
  private async shouldAutoRedirect(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      return settings.autoRedirect;
    } catch (error) {
      console.error('❌ Ayar kontrolü hatası:', error);
      return false; // Hata durumunda güvenli taraf - kullanıcıya sor
    }
  }

  /**
   * Otomatik yönlendirme ayarını değiştir
   */
  async setAutoRedirect(enabled: boolean): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = {
        ...currentSettings,
        autoRedirect: enabled
      };
      await this.saveSettings(newSettings);
      console.log(`✅ Otomatik yönlendirme ayarı güncellendi: ${enabled ? 'Aktif' : 'Pasif'}`);
    } catch (error) {
      console.error('❌ Otomatik yönlendirme ayarı güncelleme hatası:', error);
    }
  }

  /**
   * Notification'dan gelen fromUserId'yi sakla
   */
  async setNotificationFromUserId(fromUserId: string): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_from_user_id', fromUserId);
      console.log('📤 Notification fromUserId kaydedildi:', fromUserId);
    } catch (error) {
      console.error('❌ Notification fromUserId kaydetme hatası:', error);
    }
  }

  /**
   * Saklanan fromUserId'yi al
   */
  async getNotificationFromUserId(): Promise<string | null> {
    try {
      const fromUserId = await AsyncStorage.getItem('notification_from_user_id');
      return fromUserId;
    } catch (error) {
      console.error('❌ Notification fromUserId alma hatası:', error);
      return null;
    }
  }

  /**
   * Saklanan fromUserId'yi temizle
   */
  async clearNotificationFromUserId(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notification_from_user_id');
      console.log('🗑️ Notification fromUserId temizlendi');
    } catch (error) {
      console.error('❌ Notification fromUserId temizleme hatası:', error);
    }
  }

  /**
   * Test için fromUserId set etme fonksiyonu
   */
  async testSetFromUserId(fromUserId: string): Promise<void> {
    try {
      await this.setNotificationFromUserId(fromUserId);
      console.log('🧪 Test için fromUserId set edildi:', fromUserId);
      
      // Doğrulama için tekrar oku
      const savedFromUserId = await this.getNotificationFromUserId();
      console.log('🔍 Kaydedilen fromUserId doğrulaması:', {
        setted: fromUserId,
        saved: savedFromUserId,
        isMatch: fromUserId === savedFromUserId
      });
    } catch (error) {
      console.error('❌ Test fromUserId set etme hatası:', error);
    }
  }

  /**
   * Console'da test etmek için global fonksiyon
   */
  static setupConsoleTest(): void {
    if (typeof window !== 'undefined') {
      (window as any).testNotificationFromUserId = async (fromUserId: string) => {
        const service = NotificationService.getInstance();
        await service.testSetFromUserId(fromUserId);
        console.log('✅ Test tamamlandı. Şimdi satış formuna gidin ve bir satışı onaylayın.');
      };
      
      (window as any).checkNotificationFromUserId = async () => {
        const service = NotificationService.getInstance();
        const fromUserId = await service.getNotificationFromUserId();
        console.log('🔍 Mevcut fromUserId:', fromUserId);
        return fromUserId;
      };
      
      (window as any).clearNotificationFromUserId = async () => {
        const service = NotificationService.getInstance();
        await service.clearNotificationFromUserId();
        console.log('🗑️ FromUserId temizlendi');
      };
      
      console.log('🧪 Test fonksiyonları hazır:');
      console.log('- testNotificationFromUserId("user-id-123")');
      console.log('- checkNotificationFromUserId()');
      console.log('- clearNotificationFromUserId()');
      console.log('');
      console.log('💡 Birden fazla satış onayı testi için:');
      console.log('1. testNotificationFromUserId("test-user-456")');
      console.log('2. Satış formuna gidin');
      console.log('3. Birden fazla satışı onaylayın');
      console.log('4. Sayfadan çıkın (özet mesaj gönderilecek)');
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

      // Notification data'dan fromUserId alanını çıkar ve global olarak sakla
      if (remoteMessage?.data?.fromUserId) {
        await this.setNotificationFromUserId(remoteMessage.data.fromUserId);
        console.log('📤 Notification fromUserId kaydedildi:', remoteMessage.data.fromUserId);
      }

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
        saleData,
        isAppOpen 
      });

      // String olarak gelen JSON'u parse et
      let parsedData = saleData;
      if (typeof saleData === 'string') {
        // Çift quoted string'i temizle: "'[...]'" -> "[...]"
        let cleanedString = saleData;
        
        try {
          // Başında ve sonunda tek tırnak varsa kaldır
          if (cleanedString.startsWith("'") && cleanedString.endsWith("'")) {
            cleanedString = cleanedString.slice(1, -1);
            console.log('🧹 Tek tırnaklar kaldırıldı:', cleanedString);
          }
          
          // Başında ve sonunda çift tırnak varsa kaldır
          if (cleanedString.startsWith('"') && cleanedString.endsWith('"')) {
            cleanedString = cleanedString.slice(1, -1);
            console.log('🧹 Çift tırnaklar kaldırıldı:', cleanedString);
          }
          
          parsedData = JSON.parse(cleanedString);
          console.log('📝 String JSON parse edildi:', parsedData);
        } catch (parseError) {
          console.error('❌ JSON parse hatası:', parseError);
          console.error('❌ Geçersiz JSON string:', saleData);
          console.error('❌ Temizlenmiş string:', cleanedString);
          return;
        }
      }

      // Yeni format: array of objects [{id, no}, {id, no}, ...]
      let searchQuery: string;
      
      if (Array.isArray(parsedData)) {
        // Array formatında geliyorsa no değerlerini çıkar
        const noValues = parsedData
          .map(item => item?.no)
          .filter(no => no) // Boş değerleri filtrele
          .filter((no, index, arr) => arr.indexOf(no) === index); // Duplicate'leri kaldır
        
        if (noValues.length === 0) {
          console.error('❌ Sale data array\'inde geçerli no değeri yok');
          return;
        }
        
        searchQuery = noValues.join(',');
      } else {
        // Eski format: tek obje
        if (!parsedData?.no && !parsedData?.id && !parsedData?._id) {
          console.error('❌ Sale data geçersiz (no/id/_id yok)');
          return;
        }

        // no alanı array ise virgül ile birleştir
        searchQuery = Array.isArray(parsedData?.no) 
          ? parsedData.no.join(',') 
          : parsedData?.no?.toString() || parsedData?.id || parsedData?._id;
      }

      console.log('🔍 Sale için oluşturulan searchQuery:', {
        searchQuery,
        originalData: saleData,
        parsedData: parsedData,
        isArray: Array.isArray(parsedData)
      });

      if (isAppOpen) {
        // Uygulama açıkken - ayara göre karar ver
        const shouldAutoRedirect = await this.shouldAutoRedirect();
        if (shouldAutoRedirect) {
          console.log('🚀 Foreground notification - otomatik yönlendirme (ayar aktif)');
          await this.navigateToSale(searchQuery);
        } else {
          console.log('🚀 Foreground notification - kullanıcıya onay soruluyor (ayar pasif)');
          await this.showSaleNavigationDialog(parsedData, searchQuery);
        }
      } else {
        // Uygulama kapalıyken direkt yönlendir
        await this.navigateToSale(searchQuery);
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
        opportunityData,
        isAppOpen
      });

      // String olarak gelen JSON'u parse et
      let parsedData = opportunityData;
      if (typeof opportunityData === 'string') {
        // Çift quoted string'i temizle: "'[...]'" -> "[...]"
        let cleanedString = opportunityData;
        
        try {
          // Başında ve sonunda tek tırnak varsa kaldır
          if (cleanedString.startsWith("'") && cleanedString.endsWith("'")) {
            cleanedString = cleanedString.slice(1, -1);
            console.log('🧹 Opportunity tek tırnaklar kaldırıldı:', cleanedString);
          }
          
          // Başında ve sonunda çift tırnak varsa kaldır
          if (cleanedString.startsWith('"') && cleanedString.endsWith('"')) {
            cleanedString = cleanedString.slice(1, -1);
            console.log('🧹 Opportunity çift tırnaklar kaldırıldı:', cleanedString);
          }
          
          parsedData = JSON.parse(cleanedString);
          console.log('📝 Opportunity string JSON parse edildi:', parsedData);
        } catch (parseError) {
          console.error('❌ Opportunity JSON parse hatası:', parseError);
          console.error('❌ Geçersiz JSON string:', opportunityData);
          console.error('❌ Temizlenmiş string:', cleanedString);
          return;
        }
      }

      // Yeni format: array of objects [{id, no}, {id, no}, ...]
      let searchQuery: string;
      
      if (Array.isArray(parsedData)) {
        // Array formatında geliyorsa no değerlerini çıkar
        const noValues = parsedData
          .map(item => item?.no)
          .filter(no => no) // Boş değerleri filtrele
          .filter((no, index, arr) => arr.indexOf(no) === index); // Duplicate'leri kaldır
        
        if (noValues.length === 0) {
          console.error('❌ Opportunity data array\'inde geçerli no değeri yok');
          return;
        }
        
        searchQuery = noValues.join(',');
      } else {
        // Eski format: tek obje
        if (!parsedData?.no && !parsedData?.id && !parsedData?._id && !parsedData?.company) {
          console.error('❌ Opportunity data geçersiz (no/id/_id/company yok)');
          return;
        }

        // no alanı array ise virgül ile birleştir, değilse string'e çevir
        if (Array.isArray(parsedData?.no)) {
          searchQuery = parsedData.no.join(',');
        } else {
          // Öncelik: no → id → company
          searchQuery = parsedData?.no?.toString() || parsedData?.id || parsedData?._id || parsedData?.company;
        }
      }
      
      console.log('🔍 Opportunity için oluşturulan searchQuery:', {
        searchQuery,
        type: typeof searchQuery,
        originalData: opportunityData,
        parsedData: parsedData,
        isArray: Array.isArray(parsedData)
      });

      if (isAppOpen) {
        // Uygulama açıkken - ayara göre karar ver
        const shouldAutoRedirect = await this.shouldAutoRedirect();
        if (shouldAutoRedirect) {
          console.log('🚀 Foreground opportunity notification - otomatik yönlendirme (ayar aktif)');
          await this.navigateToOpportunity(searchQuery);
        } else {
          console.log('🚀 Foreground opportunity notification - kullanıcıya onay soruluyor (ayar pasif)');
          await this.showOpportunityNavigationDialog(searchQuery, parsedData);
        }
      } else {
        // Uygulama kapalıyken direkt yönlendir
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
        if (!opportunityData?.no && (opportunityData?.id || opportunityData?._id)) bodyLines.push(`Fırsat: ${opportunityData?.id || opportunityData?._id}`);
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
      console.log('🧭 Fırsata yönlendiriliyor:', {
        searchQuery,
        type: typeof searchQuery,
        length: searchQuery?.length,
        stringified: searchQuery?.toString?.() || String(searchQuery)
      });
      const { router } = await import('expo-router');
      
      const finalSearchQuery = searchQuery?.toString?.() || String(searchQuery);
      console.log('📤 Router\'a gönderilen params:', {
        pathname: '/(drawer)/opportunities',
        params: { searchQuery: finalSearchQuery }
      });
      
      router.push({
        pathname: '/(drawer)/opportunities',
        params: {
          searchQuery: finalSearchQuery
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
  private async showSaleNavigationDialog(saleData: any, searchQuery?: string): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        if (Platform.OS === 'web') {
          // Web'de confirm kullan
          const canConfirm = typeof confirm === 'function';
          let displayKey = searchQuery;
          
          if (!displayKey) {
            if (Array.isArray(saleData)) {
              // Yeni format: array of objects
              const noValues = saleData.map(item => item?.no).filter(no => no);
              displayKey = noValues.join(',');
            } else {
              // Eski format: tek obje
              displayKey = Array.isArray(saleData?.no) ? saleData.no.join(',') : saleData?.no ?? saleData?.id ?? saleData?._id;
            }
          }
          
          const userConfirmed = canConfirm ? confirm(
            `Satış Bildirimi\n\nSatış: ${displayKey}\n\nBu satışı görüntülemek istiyor musunuz?`
          ) : true;
          
          if (userConfirmed) {
            console.log('📱 Kullanıcı satış yönlendirmesini onayladı (web)');
            await this.navigateToSale(searchQuery || displayKey || '');
          } else {
            console.log('📱 Kullanıcı satış yönlendirmesini iptal etti (web)');
          }
          resolve();
        } else {
          // React Native Alert'i güvenli şekilde import et
          try {
            let displayKey = searchQuery;
            
            if (!displayKey) {
              if (Array.isArray(saleData)) {
                // Yeni format: array of objects
                const noValues = saleData.map(item => item?.no).filter(no => no);
                displayKey = noValues.join(',');
              } else {
                // Eski format: tek obje
                displayKey = Array.isArray(saleData?.no) ? saleData.no.join(',') : saleData?.no ?? saleData?.id ?? saleData?._id;
              }
            }
            
            Alert.alert(
              'Satış Bildirimi',
              `Satış: ${displayKey}\n\nBu satışı görüntülemek istiyor musunuz?`,
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
                    await this.navigateToSale(searchQuery || displayKey || '');
                    resolve();
                  }
                }
              ]
            );
          } catch (importError) {
            console.error('❌ Alert import hatası:', importError);
            // Alert import edilemezse direkt yönlendir
            let fallbackKey = searchQuery;
            if (!fallbackKey) {
              if (Array.isArray(saleData)) {
                const noValues = saleData.map(item => item?.no).filter(no => no);
                fallbackKey = noValues.join(',');
              } else {
                fallbackKey = Array.isArray(saleData?.no) ? saleData.no.join(',') : saleData?.no ?? saleData?.id ?? saleData?._id;
              }
            }
            await this.navigateToSale(fallbackKey || '');
            resolve();
          }
        }
      } catch (error) {
        console.error('❌ Alert gösterme hatası:', error);
        // Hata durumunda direkt yönlendir
        let fallbackKey = searchQuery;
        if (!fallbackKey) {
          if (Array.isArray(saleData)) {
            const noValues = saleData.map(item => item?.no).filter(no => no);
            fallbackKey = noValues.join(',');
          } else {
            fallbackKey = Array.isArray(saleData?.no) ? saleData.no.join(',') : saleData?.no ?? saleData?.id ?? saleData?._id;
          }
        }
        await this.navigateToSale(fallbackKey || '');
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
        id: transactionData?.id || transactionData?._id,
        isAppOpen
      });

      // String olarak gelen JSON'u parse et
      let parsedData = transactionData;
      if (typeof transactionData === 'string') {
        try {
          // Başında ve sonunda tek tırnak varsa kaldır
          let cleanedString = transactionData;
          if (cleanedString.startsWith("'") && cleanedString.endsWith("'")) {
            cleanedString = cleanedString.slice(1, -1);
          }
          
          // Başında ve sonunda çift tırnak varsa kaldır
          if (cleanedString.startsWith('"') && cleanedString.endsWith('"')) {
            cleanedString = cleanedString.slice(1, -1);
          }
          
          parsedData = JSON.parse(cleanedString);
          console.log('📝 Bank transaction string JSON parse edildi:', parsedData);
        } catch (parseError) {
          console.error('❌ Bank transaction JSON parse hatası:', parseError);
          console.error('❌ Geçersiz JSON string:', transactionData);
          return;
        }
      }

      if (!parsedData || Object.keys(parsedData).length === 0) {
        console.error('❌ Banka hareketi verisi geçersiz');
        return;
      }

      // Transaction ID'sini belirle
      const transactionId = parsedData?.id || parsedData?._id;
      
      if (!transactionId) {
        console.error('❌ Banka hareketi ID\'si bulunamadı');
        return;
      }

      console.log('🔍 Bank transaction için oluşturulan ID:', {
        transactionId,
        originalData: transactionData,
        parsedData: parsedData
      });

      if (isAppOpen) {
        // Uygulama açıkken - ayara göre karar ver
        const shouldAutoRedirect = await this.shouldAutoRedirect();
        if (shouldAutoRedirect) {
          console.log('🚀 Foreground bank transaction notification - otomatik yönlendirme (ayar aktif)');
          await this.navigateToBankTransactionsList(transactionId);
        } else {
          console.log('🚀 Foreground bank transaction notification - kullanıcıya onay soruluyor (ayar pasif)');
          await this.showBankTransactionNavigationDialog(parsedData);
        }
      } else {
        // Uygulama kapalıyken direkt yönlendir
        await this.navigateToBankTransactionsList(transactionId);
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
        const txNo = transactionData?.id || transactionData?._id;
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
            const transactionId = transactionData?.id || transactionData?._id;
            if (transactionId) {
              await this.navigateToBankTransactionsList(transactionId);
            }
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
                    const transactionId = transactionData?.id || transactionData?._id;
                    if (transactionId) {
                      await this.navigateToBankTransactionsList(transactionId);
                    }
                    resolve();
                  }
                }
              ]
            );
          } catch (importError) {
            console.error('❌ Alert import hatası:', importError);
            const transactionId = transactionData?.id || transactionData?._id;
            if (transactionId) {
              await this.navigateToBankTransactionsList(transactionId);
            }
            resolve();
          }
        }
      } catch (error) {
        console.error('❌ Banka hareketi dialog gösterme hatası:', error);
        const transactionId = transactionData?.id || transactionData?._id;
        if (transactionId) {
          await this.navigateToBankTransactionsList(transactionId);
        }
        resolve();
      }
    });
  }

  /**
   * Banka hareketi listesine yönlendirme (bank-transactions ekranına git ve ilgili transaction'a scroll yap)
   */
  private async navigateToBankTransactionsList(transactionId: string): Promise<void> {
    try {
      console.log('🧭 Banka hareketi listesine yönlendiriliyor:', {
        transactionId,
        type: typeof transactionId,
        length: transactionId?.length
      });
      
      const { router } = await import('expo-router');
      
      const finalTransactionId = transactionId?.toString?.() || String(transactionId);
      console.log('📤 Router\'a gönderilen params:', {
        pathname: '/(drawer)/bank-transactions',
        params: { scrollToTransactionId: finalTransactionId }
      });
      
      // Her zaman replace kullan - bu sayede aynı sayfadayken de parametreler güncellenir
      console.log('🔄 Router replace kullanılıyor (parametreleri güncellemek için)');
      router.replace({
        pathname: '/(drawer)/bank-transactions',
        params: {
          scrollToTransactionId: finalTransactionId,
          timestamp: Date.now().toString() // Cache busting için
        }
      });
      
      console.log('✅ Banka hareketi listesine yönlendirildi');
    } catch (error) {
      console.error('❌ Banka hareketi liste yönlendirme hatası:', error);
    }
  }

  /**
   * Banka hareketine yönlendirme (detay ekranına git - eski fonksiyon)
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
   * Test için bank transaction notification handler'ı manuel olarak çağır
   */
  async testBankTransactionNotificationHandler(transactionId: string, isAppOpen: boolean = true, testFormat: 'object' | 'simple-json' | 'complex-json' = 'object'): Promise<void> {
    console.log('🧪 Test bank transaction notification handler çağrılıyor:', { transactionId, isAppOpen, testFormat });
    
    let testNotification;
    
    const transactionData = {
      id: transactionId,
      accounId: "acc-123",
      name: "Test Banka Hareketi",
      dc: "C",
      code: "TRF",
      amount: 1500.00,
      balance: 25000.00,
      description: "Test notification için örnek banka hareketi",
      businessDate: new Date(),
      createDate: new Date(),
      opponentId: "opp-456",
      opponentIban: "TR123456789012345678901234",
      sourceId: "src-789",
      source: "API",
      bankAccId: "bank-acc-123",
      bankAccName: "Test Banka Hesabı",
      bankId: "bank-001",
      bankName: "Test Bankası",
      erpStatus: "waiting" as const,
      erpMessage: "",
      erpGlAccountCode: "120.01",
      erpAccountCode: "120.01.001"
    };
    
    switch (testFormat) {
      case 'object':
        // fullDocument'ı obje olarak test et
        testNotification = {
          data: {
            module: 'bank-transaction',
            fullDocument: transactionData
          },
          notification: {
            title: 'Yeni Banka Hareketi',
            body: `${transactionData.amount} TL tutarında yeni işlem`
          }
        };
        break;
        
      case 'simple-json':
        // fullDocument'ı basit JSON string olarak test et
        testNotification = {
          data: {
            module: 'bank-transaction',
            fullDocument: JSON.stringify(transactionData)
          },
          notification: {
            title: 'Yeni Banka Hareketi (Simple JSON)',
            body: `${transactionData.amount} TL tutarında yeni işlem (basit JSON string)`
          }
        };
        break;
        
      case 'complex-json':
        // Gerçek notification formatını simüle et (çoklu escape)
        const complexFullDocument = JSON.stringify(JSON.stringify(transactionData));
        testNotification = {
          data: {
            timestamp: new Date().toISOString(),
            module: 'bank-transaction',
            fullDocument: complexFullDocument,
            pushLogId: "",
            source: "kerzz-ai-backend"
          },
          notification: {
            title: 'Yeni Banka Hareketi (Complex JSON)',
            body: `${transactionData.amount} TL tutarında yeni işlem (karmaşık JSON string)`
          }
        };
        break;
    }

    await this.handleNotification(testNotification, isAppOpen);
  }

  /**
   * Test için opportunity notification handler'ı manuel olarak çağır
   */
  async testOpportunityNotificationHandler(opportunityNo: string | number, isAppOpen: boolean = true, testFormat: 'object' | 'simple-json' | 'complex-json' | 'wrong-format' = 'object'): Promise<void> {
    console.log('🧪 Test opportunity notification handler çağrılıyor:', { opportunityNo, isAppOpen, testFormat });
    
    let testNotification;
    
    const opportunityData = {
      id: "opp-182b-79eb",
      no: opportunityNo.toString(),
      company: "Test Şirketi A.Ş."
    };
    
    // Yanlış format testi - 'no' string literal olarak geliyor
    const wrongOpportunityData = {
      id: "opp-182b-79eb",
      no: "no", // Bu yanlış format - string literal 'no'
      company: "Test Şirketi A.Ş."
    };
    
    switch (testFormat) {
      case 'object':
        // fullDocument'ı obje olarak test et
        testNotification = {
          data: {
            module: 'opportunity',
            fullDocument: opportunityData
          },
          notification: {
            title: 'Yeni Fırsat',
            body: `Fırsat No: ${opportunityNo} için bildirim`
          }
        };
        break;
        
      case 'simple-json':
        // fullDocument'ı basit JSON string olarak test et
        testNotification = {
          data: {
            module: 'opportunity',
            fullDocument: JSON.stringify(opportunityData)
          },
          notification: {
            title: 'Yeni Fırsat (Simple JSON)',
            body: `Fırsat No: ${opportunityNo} için bildirim (basit JSON string)`
          }
        };
        break;
        
      case 'complex-json':
        // Gerçek notification formatını simüle et (çoklu escape)
        const complexFullDocument = JSON.stringify(JSON.stringify(opportunityData));
        testNotification = {
          data: {
            timestamp: new Date().toISOString(),
            module: 'opportunity',
            fullDocument: complexFullDocument,
            pushLogId: "",
            source: "kerzz-ai-backend"
          },
          notification: {
            title: 'Yeni Fırsat (Complex JSON)',
            body: `Fırsat No: ${opportunityNo} için bildirim (karmaşık JSON string)`
          }
        };
        break;
        
      case 'wrong-format':
        // Yanlış format testi - 'no' field'ı string literal 'no' olarak geliyor
        testNotification = {
          data: {
            module: 'opportunity',
            fullDocument: wrongOpportunityData
          },
          notification: {
            title: 'Yeni Fırsat (Yanlış Format)',
            body: `Fırsat için bildirim (no field'ı yanlış)`
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
   * Debug data kaydet
   */
  private async saveDebugData(remoteMessage: any, type: 'foreground' | 'background' | 'initial'): Promise<void> {
    try {
      const debugData: NotificationDebugData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type,
        platform: Platform.OS,
        rawData: remoteMessage,
        notification: remoteMessage.notification,
        data: remoteMessage.data,
        from: remoteMessage.from,
        messageId: remoteMessage.messageId,
        sentTime: remoteMessage.sentTime,
        ttl: remoteMessage.ttl,
      };

      // Data içinden module ve fullDocument'ı çıkar
      if (remoteMessage.data) {
        debugData.module = remoteMessage.data.module;
        debugData.fullDocument = remoteMessage.data.fullDocument;
        
        // Parsed data'yı da kaydet
        if (remoteMessage.data.fullDocument) {
          try {
            let parsedDocument = remoteMessage.data.fullDocument;
            
            // String ise parse etmeye çalış
            if (typeof parsedDocument === 'string') {
              // Çoklu JSON parse (escape karakterleri için)
              let parseAttempts = 0;
              const maxAttempts = 5;
              
              while (typeof parsedDocument === 'string' && parseAttempts < maxAttempts) {
                try {
                  parsedDocument = JSON.parse(parsedDocument);
                  parseAttempts++;
                } catch {
                  break;
                }
              }
            }
            
            debugData.parsedData = parsedDocument;
          } catch (error) {
            console.error('❌ Debug data parse hatası:', error);
          }
        }
      }

      // Mevcut debug verilerini al
      const existingDataString = await AsyncStorage.getItem('notification_debug_data');
      let existingData: NotificationDebugData[] = [];
      
      if (existingDataString) {
        try {
          existingData = JSON.parse(existingDataString);
        } catch (error) {
          console.error('❌ Mevcut debug data parse hatası:', error);
          existingData = [];
        }
      }

      // Yeni veriyi ekle (en başa)
      existingData.unshift(debugData);

      // Maksimum 100 kayıt tut (performans için)
      if (existingData.length > 100) {
        existingData = existingData.slice(0, 100);
      }

      // Kaydet
      await AsyncStorage.setItem('notification_debug_data', JSON.stringify(existingData));
      
      console.log('💾 Debug data kaydedildi:', {
        id: debugData.id,
        type: debugData.type,
        module: debugData.module,
        hasFullDocument: !!debugData.fullDocument,
        totalRecords: existingData.length
      });
    } catch (error) {
      console.error('❌ Debug data kaydetme hatası:', error);
    }
  }

  /**
   * Debug verilerini temizle
   */
  async clearDebugData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notification_debug_data');
      console.log('✅ Debug verileri temizlendi');
    } catch (error) {
      console.error('❌ Debug verileri temizleme hatası:', error);
    }
  }

  /**
   * Debug verilerini al
   */
  async getDebugData(): Promise<NotificationDebugData[]> {
    try {
      const dataString = await AsyncStorage.getItem('notification_debug_data');
      if (dataString) {
        return JSON.parse(dataString);
      }
      return [];
    } catch (error) {
      console.error('❌ Debug verileri alma hatası:', error);
      return [];
    }
  }

  /**
   * iOS Simülatör FCM Token Debug
   */
  async debugIOSSimulatorFCMToken(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('⚠️ Bu debug fonksiyonu sadece iOS için geçerlidir');
      return;
    }

    console.log('🍎 iOS Simülatör FCM Token Debug Başlatılıyor...');
    console.log('=====================================');

    // 1. Platform ve ortam bilgileri
    console.log('📱 Platform Bilgileri:', {
      platform: Platform.OS,
      version: Platform.Version,
      isDev: __DEV__,
      isHermes: typeof HermesInternal !== 'undefined'
    });

    // 2. Firebase durumu
    console.log('🔥 Firebase Durumu:', {
      isInitialized: isFirebaseInitialized(),
      hasMessaging: !!this.messaging,
      hasNotificationFunctions: !!notificationFunctions,
      availableFunctions: Object.keys(notificationFunctions)
    });

    // 3. Notification functions detayları
    console.log('🔧 Notification Functions Detayları:', {
      getToken: !!notificationFunctions.getToken,
      requestPermission: !!notificationFunctions.requestPermission,
      onMessage: !!notificationFunctions.onMessage,
      onTokenRefresh: !!notificationFunctions.onTokenRefresh,
      AuthorizationStatus: !!notificationFunctions.AuthorizationStatus
    });

    // 4. Firebase modül yükleme durumu
    try {
      const firebaseApp = await import('@react-native-firebase/app');
      const firebaseMessaging = await import('@react-native-firebase/messaging');
      console.log('✅ Firebase modülleri başarıyla import edildi');
      
      // Apps kontrolü
      const apps = firebaseApp.getApps();
      console.log('📱 Firebase Apps:', {
        count: apps.length,
        names: apps.map(app => app.name)
      });

      // Messaging instance kontrolü
      try {
        const messaging = firebaseMessaging.getMessaging();
        console.log('📨 Messaging Instance:', {
          exists: !!messaging,
          type: typeof messaging
        });
      } catch (msgError) {
        console.error('❌ Messaging Instance Hatası:', msgError);
      }

    } catch (importError) {
      console.error('❌ Firebase modül import hatası:', importError);
    }

    // 5. İzin durumu kontrol
    try {
      console.log('🔍 İzin durumu kontrol ediliyor...');
      const permission = await this.requestPermissions();
      console.log('📋 İzin Sonucu:', permission);
    } catch (permError) {
      console.error('❌ İzin kontrolü hatası:', permError);
    }

    // 6. Token alma denemesi
    try {
      console.log('🔑 Token alma denemesi...');
      const token = await this.getToken();
      console.log('🔑 Token Sonucu:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 30) + '...' : null
      });
    } catch (tokenError) {
      console.error('❌ Token alma hatası:', tokenError);
    }

    // 7. APNs durumu (iOS özel)
    try {
      console.log('🍎 APNs durumu kontrol ediliyor...');
      
      // APNs token alma denemesi
      if (notificationFunctions.getAPNSToken) {
        try {
          const apnsToken = await notificationFunctions.getAPNSToken(this.messaging);
          console.log('🍎 APNs Token:', apnsToken ? 'Mevcut' : 'Yok');
        } catch (apnsError) {
          console.log('🍎 APNs Token Hatası:', apnsError instanceof Error ? apnsError.message : String(apnsError));
        }
      } else {
        console.log('🍎 getAPNSToken fonksiyonu mevcut değil');
      }

      // iOS authorization status
      if (notificationFunctions.requestPermission && notificationFunctions.AuthorizationStatus) {
        try {
          const authStatus = await notificationFunctions.requestPermission(this.messaging);
          console.log('🍎 iOS Authorization Status:', {
            status: authStatus,
            AUTHORIZED: notificationFunctions.AuthorizationStatus.AUTHORIZED,
            DENIED: notificationFunctions.AuthorizationStatus.DENIED,
            NOT_DETERMINED: notificationFunctions.AuthorizationStatus.NOT_DETERMINED,
            PROVISIONAL: notificationFunctions.AuthorizationStatus.PROVISIONAL
          });
        } catch (authError) {
          console.log('🍎 Authorization Status Hatası:', authError instanceof Error ? authError.message : String(authError));
        }
      }

    } catch (apnsError) {
      console.error('❌ APNs kontrol hatası:', apnsError);
    }

    console.log('=====================================');
    console.log('✅ iOS Simülatör FCM Token Debug Tamamlandı');
    console.log('');
    console.log('💡 Olası Çözümler:');
    console.log('1. Fiziksel iOS cihazında test edin');
    console.log('2. Firebase Console\'da APNs sertifikası kontrol edin');
    console.log('3. Xcode\'da Push Notifications capability\'si ekli mi kontrol edin');
    console.log('4. Bundle ID\'nin Firebase\'deki ile aynı olduğunu kontrol edin');
    console.log('5. iOS Simulator Settings > Notifications > Your App > Allow Notifications');
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
    console.log('');
    console.log('⚙️ Otomatik Yönlendirme Ayarları:');
    console.log('   NotificationService.getInstance().setAutoRedirect(true)  // Otomatik yönlendir');
    console.log('   NotificationService.getInstance().setAutoRedirect(false) // Kullanıcıya sor (varsayılan)');
    console.log('');
    console.log('🧪 Test Fonksiyonları:');
    console.log('   Sale Test: NotificationService.getInstance().testNotificationHandler("12345", true/false)');
    console.log('   Opportunity Test: NotificationService.getInstance().testOpportunityNotificationHandler("67890", true/false)');
    console.log('   Bank Transaction Test: NotificationService.getInstance().testBankTransactionNotificationHandler("tx-12345", true/false)');
    console.log('');
    console.log('📱 Davranış:');
    console.log('   - isAppOpen=true + autoRedirect=false: Kullanıcıya onay sorar');
    console.log('   - isAppOpen=true + autoRedirect=true: Direkt yönlendirir');
    console.log('   - isAppOpen=false: Her zaman direkt yönlendirir');
  }
}

export default NotificationService;
