import { Platform } from 'react-native';
import NotificationService from '../services/notificationService';

/**
 * iOS Simulator için push notification test helper'ı
 * Gerçek push notification'lar simulator\'da çalışmadığı için
 * local notification'lar ve debug yöntemleri kullanır
 */
export class SimulatorTestHelper {
  private static instance: SimulatorTestHelper;
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance(): SimulatorTestHelper {
    if (!SimulatorTestHelper.instance) {
      SimulatorTestHelper.instance = new SimulatorTestHelper();
    }
    return SimulatorTestHelper.instance;
  }

  /**
   * iOS Simulator'da push notification test et
   */
  async testPushNotificationInSimulator(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('⚠️ Bu test sadece iOS için tasarlanmıştır');
      return;
    }

    console.log('🧪 iOS Simulator Push Notification Test Başlatılıyor...');
    console.log('=====================================');

    // 1. Platform kontrolü
    console.log('📱 Platform:', Platform.OS);
    console.log('🔍 Simulator Detection:', this.isRunningInSimulator());

    // 2. Detaylı FCM Token Debug
    console.log('🔍 Detaylı FCM Token Debug çalıştırılıyor...');
    await this.notificationService.debugIOSSimulatorFCMToken();

    // 3. Firebase durumu
    await this.checkFirebaseStatus();

    // 4. İzin durumu
    await this.checkPermissionStatus();

    // 5. Token durumu
    await this.checkTokenStatus();

    // 6. Simulated push notification test
    await this.simulatePushNotification();

    console.log('=====================================');
    console.log('✅ iOS Simulator test tamamlandı');
    console.log('');
    console.log('🔧 Sorun giderme adımları:');
    console.log('1. Console\'da detaylı hata mesajlarını kontrol edin');
    console.log('2. Firebase Console > Project Settings > Cloud Messaging > iOS app configuration');
    console.log('3. Xcode > Project > Signing & Capabilities > Push Notifications ekli mi?');
    console.log('4. iOS Simulator > Settings > Notifications > Your App > Allow Notifications');
    console.log('5. Fiziksel iOS cihazında test edin');
  }

  /**
   * Simulator'da çalışıp çalışmadığını kontrol et
   */
  private isRunningInSimulator(): boolean {
    // iOS Simulator detection
    return Platform.OS === 'ios' && __DEV__;
  }

  /**
   * Firebase durumunu kontrol et
   */
  private async checkFirebaseStatus(): Promise<void> {
    console.log('🔥 Firebase Durumu Kontrol Ediliyor...');
    
    try {
      const { isFirebaseInitialized } = await import('../../../config/firebase');
      const isInitialized = isFirebaseInitialized();
      
      console.log('✅ Firebase Initialized:', isInitialized);
      
      if (!isInitialized) {
        console.log('⚠️ Firebase başlatılmamış - bu simulator\'da normal olabilir');
      }
    } catch (error) {
      console.error('❌ Firebase durum kontrolü hatası:', error);
    }
  }

  /**
   * İzin durumunu kontrol et
   */
  private async checkPermissionStatus(): Promise<void> {
    console.log('📱 İzin Durumu Kontrol Ediliyor...');
    
    try {
      const permission = await this.notificationService.requestPermissions();
      console.log('✅ Permission Status:', permission);
      
      if (permission.status !== 'granted') {
        console.log('⚠️ Notification izni verilmemiş');
        console.log('💡 Simulator\'da Settings > Notifications > Your App > Allow Notifications');
      }
    } catch (error) {
      console.error('❌ İzin kontrolü hatası:', error);
    }
  }

  /**
   * Token durumunu kontrol et
   */
  private async checkTokenStatus(): Promise<void> {
    console.log('🔑 Token Durumu Kontrol Ediliyor...');
    
    try {
      const token = await this.notificationService.getToken();
      console.log('✅ FCM Token:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 30) + '...' : null
      });
      
      if (!token) {
        console.log('⚠️ FCM Token alınamadı - bu simulator\'da normal olabilir');
      }
    } catch (error) {
      console.error('❌ Token alma hatası:', error);
    }
  }

  /**
   * Push notification simülasyonu yap
   */
  private async simulatePushNotification(): Promise<void> {
    console.log('🎭 Push Notification Simülasyonu Başlatılıyor...');
    
    try {
      // Simulated sale notification
      console.log('💰 Sale Notification Test...');
      await this.notificationService.testNotificationHandler('12345', true, 'object');
      
      await this.delay(2000);
      
      // Simulated opportunity notification  
      console.log('🎯 Opportunity Notification Test...');
      await this.notificationService.testOpportunityNotificationHandler('67890', true, 'object');
      
      await this.delay(2000);
      
      // Simulated bank transaction notification
      console.log('🏦 Bank Transaction Notification Test...');
      await this.notificationService.testBankTransactionNotificationHandler('tx-12345', true, 'object');
      
      console.log('✅ Tüm simülasyon testleri tamamlandı');
    } catch (error) {
      console.error('❌ Simülasyon hatası:', error);
    }
  }

  /**
   * Local notification test et
   */
  async testLocalNotification(): Promise<void> {
    console.log('📲 Local Notification Test...');
    
    try {
      await this.notificationService.sendSellerAssignmentNotification(
        'test-token',
        {
          id: 'test-opp-123',
          no: 'TEST-001',
          company: 'Test Şirketi A.Ş.',
          sellerName: 'Test Satışçısı'
        }
      );
      
      console.log('✅ Local notification gönderildi');
    } catch (error) {
      console.error('❌ Local notification hatası:', error);
    }
  }

  /**
   * Notification debug verilerini göster
   */
  async showDebugData(): Promise<void> {
    console.log('📊 Notification Debug Verileri...');
    
    try {
      const debugData = await this.notificationService.getDebugData();
      console.log('✅ Debug Data Count:', debugData.length);
      
      if (debugData.length > 0) {
        console.log('📋 Son 3 Notification:');
        debugData.slice(0, 3).forEach((data, index) => {
          console.log(`${index + 1}. ${data.timestamp} - ${data.type} - ${data.module || 'N/A'}`);
        });
      } else {
        console.log('ℹ️ Henüz debug verisi yok');
      }
    } catch (error) {
      console.error('❌ Debug data alma hatası:', error);
    }
  }

  /**
   * Comprehensive iOS Simulator test
   */
  async runComprehensiveTest(): Promise<void> {
    console.log('🚀 Kapsamlı iOS Simulator Test Başlatılıyor...');
    console.log('================================================');
    
    // 1. Temel testler
    await this.testPushNotificationInSimulator();
    
    await this.delay(3000);
    
    // 2. Local notification test
    await this.testLocalNotification();
    
    await this.delay(2000);
    
    // 3. Debug data göster
    await this.showDebugData();
    
    console.log('================================================');
    console.log('🎉 Kapsamlı test tamamlandı!');
    console.log('');
    console.log('📝 Sonuçlar:');
    console.log('• Simulator\'da gerçek push notification\'lar çalışmaz (Apple kısıtlaması)');
    console.log('• Local notification\'lar çalışmalıdır');
    console.log('• Fiziksel cihazda test etmeniz önerilir');
    console.log('• Console log\'larını kontrol edin');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global test fonksiyonları
export const testIOSSimulatorPushNotifications = async (): Promise<void> => {
  const helper = SimulatorTestHelper.getInstance();
  await helper.runComprehensiveTest();
};

export const quickSimulatorTest = async (): Promise<void> => {
  const helper = SimulatorTestHelper.getInstance();
  await helper.testPushNotificationInSimulator();
};

export const testLocalNotificationOnly = async (): Promise<void> => {
  const helper = SimulatorTestHelper.getInstance();
  await helper.testLocalNotification();
};
