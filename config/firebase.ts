import { getApp, getApps } from '@react-native-firebase/app';
import { getMessaging, requestPermission } from '@react-native-firebase/messaging';

/**
 * Firebase App'i başlat
 * Bu fonksiyon uygulama başlangıcında çağrılmalı
 */
export const initializeFirebase = async (): Promise<boolean> => {
  try {
    console.log('🔍 Firebase App durumu kontrol ediliyor...');
    
    // Expo + React Native Firebase için özel başlatma
    // Önce mevcut durumu kontrol et
    const apps = getApps();
    console.log('📱 Mevcut Firebase Apps:', apps.length);
    
    if (apps.length > 0) {
      console.log('✅ Firebase App zaten başlatılmış');
      console.log('📋 App isimleri:', apps.map(app => app.name));
      return true;
    }
    
    // Firebase App'i manuel olarak başlatmaya çalış
    console.log('⚠️ Firebase App bulunamadı, manuel başlatma deneniyor...');
    
    // Expo'da React Native Firebase otomatik başlatılır
    // Messaging modülünü import etmek yeterli olmalı
    try {
      // Messaging instance'ı al - bu Firebase'i otomatik başlatmalı
      const messagingInstance = getMessaging();
      console.log('📨 Messaging instance oluşturuldu:', !!messagingInstance);
      
      // Kısa bir bekleme sonrası tekrar kontrol et
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const appsAfterMessaging = getApps();
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
      const messagingInstance = getMessaging();
      await requestPermission(messagingInstance);
      
      const appsAfterPermission = getApps();
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
    const apps = getApps();
    return apps.length > 0;
  } catch (error) {
    console.error('❌ Firebase durum kontrolü hatası:', error);
    return false;
  }
};

// Default app'i export et (v22 uyumlu)
export const getDefaultApp = () => {
  try {
    return getApp();
  } catch (error) {
    console.error('❌ Default app alınamadı:', error);
    return null;
  }
};
