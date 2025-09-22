import { Platform } from 'react-native';

// Platform-specific Firebase imports
let firebaseApp: any = null;
let firebaseMessaging: any = null;

// Firebase modüllerinin yüklenme durumunu takip et
let modulesLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Firebase fonksiyonlarını dinamik olarak yükle
const loadFirebaseModules = async (): Promise<void> => {
  if (modulesLoaded) {
    return;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      if (Platform.OS === 'web') {
        try {
          // Web için Firebase Web SDK
          const firebaseAppModule = await import('firebase/app');
          const firebaseMessagingModule = await import('firebase/messaging');
          
          // Firebase Web config - bu değerleri Firebase Console'dan alın
          const firebaseConfig = {
            // Web için Firebase config buraya gelecek
            // Şimdilik boş bırakıyoruz, çünkü config dosyası yok
          };

          const initializeWebFirebase = async () => {
            try {
              // Messaging desteklenip desteklenmediğini kontrol et
              const messagingSupported = await firebaseMessagingModule.isSupported();
              if (!messagingSupported) {
                console.log('📱 Web Messaging desteklenmiyor (HTTP veya localhost olabilir)');
                return false;
              }

              // Firebase App'i başlat
              const apps = firebaseAppModule.getApps();
              if (apps.length === 0) {
                firebaseApp = firebaseAppModule.initializeApp(firebaseConfig);
                console.log('✅ Firebase Web App başlatıldı');
              } else {
                firebaseApp = firebaseAppModule.getApp();
                console.log('✅ Firebase Web App zaten mevcut');
              }

              // Messaging'i başlat
              firebaseMessaging = firebaseMessagingModule.getMessaging(firebaseApp);
              console.log('📨 Firebase Web Messaging başlatıldı');
              
              return true;
            } catch (error) {
              console.error('❌ Firebase Web başlatma hatası:', error);
              return false;
            }
          };

          firebaseApp = { initializeWebFirebase };
          console.log('✅ Firebase Web modülleri yüklendi');
        } catch (error) {
          console.warn('⚠️ Firebase Web SDK yüklenemedi:', error);
        }
      } else {
        try {
          // React Native için Firebase
          const firebaseAppModule = await import('@react-native-firebase/app');
          const firebaseMessagingModule = await import('@react-native-firebase/messaging');
          
          firebaseApp = { 
            getApp: firebaseAppModule.getApp, 
            getApps: firebaseAppModule.getApps 
          };
          firebaseMessaging = { 
            getMessaging: firebaseMessagingModule.getMessaging, 
            requestPermission: firebaseMessagingModule.requestPermission 
          };
          console.log('✅ Firebase React Native modülleri yüklendi');
        } catch (error) {
          console.warn('⚠️ React Native Firebase yüklenemedi:', error);
          throw error;
        }
      }
      
      modulesLoaded = true;
    } catch (error) {
      console.error('❌ Firebase modül yükleme hatası:', error);
      throw error;
    }
  })();

  return loadingPromise;
};

/**
 * Firebase App'i başlat
 * Bu fonksiyon uygulama başlangıcında çağrılmalı
 */
export const initializeFirebase = async (): Promise<boolean> => {
  try {
    console.log(`🔍 Firebase App durumu kontrol ediliyor... (${Platform.OS})`);
    
    // Önce Firebase modüllerinin yüklenmesini bekle
    console.log('⏳ Firebase modülleri yükleniyor...');
    await loadFirebaseModules();
    console.log('✅ Firebase modülleri yükleme tamamlandı');
    
    // Web platformu için
    if (Platform.OS === 'web') {
      if (firebaseApp && firebaseApp.initializeWebFirebase) {
        return await firebaseApp.initializeWebFirebase();
      } else {
        console.log('⚠️ Web platformunda Firebase config eksik - şimdilik atlanıyor');
        return true; // Web'de Firebase olmadan da çalışabilir
      }
    }
    
    // React Native platformları için
    if (!firebaseApp || !firebaseMessaging) {
      console.error('❌ Firebase modülleri yüklenemedi');
      return false;
    }

    // Expo + React Native Firebase için özel başlatma
    const apps = firebaseApp.getApps();
    console.log('📱 Mevcut Firebase Apps:', apps.length);
    
    if (apps.length > 0) {
      console.log('✅ Firebase App zaten başlatılmış');
      console.log('📋 App isimleri:', apps.map((app: any) => app.name));
      return true;
    }
    
    // Firebase App'i manuel olarak başlatmaya çalış
    console.log('⚠️ Firebase App bulunamadı, manuel başlatma deneniyor...');
    
    try {
      // Messaging instance'ı al - bu Firebase'i otomatik başlatmalı
      const messagingInstance = firebaseMessaging.getMessaging();
      console.log('📨 Messaging instance oluşturuldu:', !!messagingInstance);
      
      // Kısa bir bekleme sonrası tekrar kontrol et
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const appsAfterMessaging = firebaseApp.getApps();
      console.log('📱 Başlatma sonrası Firebase Apps:', appsAfterMessaging.length);
      
      if (appsAfterMessaging.length > 0) {
        console.log('✅ Firebase App messaging ile başlatıldı');
        return true;
      }
    } catch (msgError) {
      console.error('❌ Messaging ile başlatma hatası:', msgError);
    }
    
    // Son çare: Permission request ile başlatmaya çalış
    try {
      console.log('🔄 Permission request ile başlatma deneniyor...');
      const messagingInstance = firebaseMessaging.getMessaging();
      await firebaseMessaging.requestPermission(messagingInstance);
      
      const appsAfterPermission = firebaseApp.getApps();
      if (appsAfterPermission.length > 0) {
        console.log('✅ Firebase App permission request ile başlatıldı');
        return true;
      }
    } catch (permError) {
      console.log('⚠️ Permission request hatası (normal olabilir):', permError);
    }
    
    console.log('❌ Firebase App başlatılamadı - Expo konfigürasyonu kontrol edilmeli');
    return false;
  } catch (error) {
    console.error('❌ Firebase başlatma hatası:', error);
    return false;
  }
};

/**
 * Firebase App'in başlatılıp başlatılmadığını kontrol et
 */
export const isFirebaseInitialized = (): boolean => {
  try {
    if (Platform.OS === 'web') {
      // Web'de Firebase config eksik olabilir, bu durumda true döndür
      return true;
    }
    
    if (firebaseApp && firebaseApp.getApps) {
      const apps = firebaseApp.getApps();
      return apps.length > 0;
    }
    return false;
  } catch (error) {
    console.error('❌ Firebase durum kontrolü hatası:', error);
    return false;
  }
};

// Default app'i export et (v22 uyumlu)
export const getDefaultApp = () => {
  try {
    if (Platform.OS === 'web') {
      return firebaseApp;
    }
    
    if (firebaseApp && firebaseApp.getApp) {
      return firebaseApp.getApp();
    }
    return null;
  } catch (error) {
    console.error('❌ Default app alınamadı:', error);
    return null;
  }
};
