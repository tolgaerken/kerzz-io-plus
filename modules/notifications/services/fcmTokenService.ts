import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { httpClient } from '../../auth/services/httpClient';
import { BaseModel } from '../../data-layer/types/mongo';

// FCM Token model for kerzz-contract database
interface FCMTokenModel extends BaseModel {
  fcmToken: string;
  userId: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  deviceName?: string;
  appVersion?: string;
  osVersion?: string;
  isActive: boolean;
  lastUsedAt: Date;
  registeredAt: Date;
}

interface TokenRegistrationResponse {
  success: boolean;
  message?: string;
  tokenId?: string;
}

/**
 * FCM token'larını kerzz-contract veritabanında yöneten servis
 * useBaseMongo kullanarak fcm-tokens koleksiyonuna kayıt yapar
 */
class FCMTokenService {
  private static instance: FCMTokenService;

  private constructor() {}

  static getInstance(): FCMTokenService {
    if (!FCMTokenService.instance) {
      FCMTokenService.instance = new FCMTokenService();
    }
    return FCMTokenService.instance;
  }

  /**
   * MongoDB payload oluştur
   */
  private createPayload(
    job: 'get' | 'upsert' | 'delete',
    filter: any,
    data?: any
  ) {
    return {
      job,
      database: 'kerzz-contract',
      collection: 'fcm-tokens',
      filter,
      data,
    };
  }

  /**
   * MongoDB API'ye direkt çağrı yap
   */
  private async callMongoDB<T>(payload: any): Promise<T> {
    const mongoUrl = 'https://public.kerzz.com:50502/api/database/dataAction';
    return await httpClient.post<T>(mongoUrl, payload);
  }

  /**
   * FCM token'ını kerzz-contract veritabanına kaydet
   */
  async registerToken(token: string, userId: string): Promise<TokenRegistrationResponse> {
    try {
      console.log('🔔 FCM Token kaydediliyor:', { userId, token: token.substring(0, 20) + '...' });
      
      const deviceInfo = await this.getDeviceInfo();
      const docId = 'fcm' + userId;
      
      // Önce aynı cihaz için mevcut token var mı kontrol et
      const searchPayload = this.createPayload('get', { id: docId });

      const existingTokens = await this.callMongoDB<FCMTokenModel[]>(searchPayload);
      const now = new Date();
      
      if (existingTokens && existingTokens.length > 0) {
        // Mevcut token'ı güncelle
        
        const updatedToken: Partial<FCMTokenModel> = {
          fcmToken: token,
          lastUsedAt: now,
          platform: Platform.OS as 'ios' | 'android',
          deviceName: deviceInfo.deviceName,
          appVersion: deviceInfo.appVersion,
          osVersion: deviceInfo.osVersion,
          updatedAt: now
        };

        const updatePayload = this.createPayload('upsert', { id: docId }, updatedToken);
        await this.callMongoDB(updatePayload);
        
        console.log('✅ Mevcut FCM token güncellendi:', docId);
        
        return {
          success: true,
          message: 'Token güncellendi',
          tokenId: docId
        };
      } else {
        // Yeni token kaydet
        const newToken: Partial<FCMTokenModel> = {
          id: docId,
          fcmToken: token,
          userId,
          platform: Platform.OS as 'ios' | 'android',
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          appVersion: deviceInfo.appVersion,
          osVersion: deviceInfo.osVersion,
          isActive: true,
          lastUsedAt: now,
          registeredAt: now,
          createdAt: now
        };

        const insertPayload = this.createPayload('upsert', { id: docId }, newToken);
        await this.callMongoDB<FCMTokenModel>(insertPayload);
        
        console.log('✅ Yeni FCM token kaydedildi:', docId);
        
        return {
          success: true,
          message: 'Token kaydedildi',
          tokenId: docId
        };
      }
    } catch (error) {
      console.error('❌ FCM Token kaydetme hatası:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Token kaydetme hatası'
      };
    }
  }

  /**
   * Token'ı deaktif et (logout sırasında)
   */
  async deactivateToken(token: string, userId: string): Promise<TokenRegistrationResponse> {
    try {
      console.log('🔔 FCM Token deaktif ediliyor:', { userId, token: token.substring(0, 20) + '...' });
      
      const docId = 'fcm' + userId;
      // Token'ı bul
      const searchPayload = this.createPayload('get', { id: docId });

      const existingTokens = await this.callMongoDB<FCMTokenModel[]>(searchPayload);

      if (existingTokens && existingTokens.length > 0) {
        // Token'ı deaktif et
        const updatePayload = this.createPayload('upsert', { id: docId }, {
          isActive: false,
          updatedAt: new Date()
        });
        
        await this.callMongoDB(updatePayload);
        
        console.log('✅ FCM token deaktif edildi:', docId);
        
        return {
          success: true,
          message: 'Token deaktif edildi',
          tokenId: docId
        };
      } else {
        console.log('⚠️ Deaktif edilecek token bulunamadı');
        return {
          success: true,
          message: 'Token bulunamadı'
        };
      }
    } catch (error) {
      console.error('❌ FCM Token deaktif etme hatası:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Token deaktif etme hatası'
      };
    }
  }

  /**
   * Kullanıcının tüm aktif token'larını getir
   */
  async getUserActiveTokens(userId: string): Promise<FCMTokenModel[]> {
    try {
      const docId = 'fcm' + userId;
      const searchPayload = this.createPayload('get', { id: docId });

      const tokens = await this.callMongoDB<FCMTokenModel[]>(searchPayload);
      return tokens || [];
    } catch (error) {
      console.error('❌ Kullanıcı tokenları alma hatası:', error);
      return [];
    }
  }

  /**
   * Eski token'ları temizle (30 günden eski olanlar)
   */
  async cleanupOldTokens(userId: string): Promise<void> {
    try {
      console.log('🧹 Eski FCM tokenlar temizleniyor:', userId);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 30 günden eski token'ları bul
      const docId = 'fcm' + userId;
      const searchPayload = this.createPayload('get', { id: docId });

      const oldTokens = await this.callMongoDB<FCMTokenModel[]>(searchPayload);

      // Eski token'ları deaktif et
      if (oldTokens && oldTokens.length > 0) {
        for (const token of oldTokens) {
          if (token.lastUsedAt && token.lastUsedAt < thirtyDaysAgo) {
            const updatePayload = this.createPayload('upsert', { id: docId }, {
              isActive: false,
              updatedAt: new Date()
            });
            await this.callMongoDB(updatePayload);
          }
        }

        console.log(`✅ ${oldTokens.length} eski FCM token deaktif edildi`);
      } else {
        console.log('✅ Temizlenecek eski token bulunamadı');
      }
    } catch (error) {
      console.error('❌ Eski token temizleme hatası:', error);
    }
  }

  /**
   * Token senkronizasyonu (login sonrası çağrılır)
   */
  async syncToken(token: string, userId: string): Promise<void> {
    try {
      console.log('🔄 FCM Token senkronizasyonu başlatılıyor:', { userId });
      
      // Token'ı kaydet/güncelle
      await this.registerToken(token, userId);
      
      // Eski token'ları temizle
      await this.cleanupOldTokens(userId);
      
      console.log('✅ FCM Token senkronizasyonu tamamlandı');
    } catch (error) {
      console.error('❌ FCM Token senkronizasyon hatası:', error);
    }
  }

  /**
   * Cihaz bilgilerini topla
   */
  private async getDeviceInfo(): Promise<{
    deviceId: string;
    deviceName?: string;
    appVersion?: string;
    osVersion?: string;
  }> {
    try {
      return {
        deviceId: Device.modelId || Device.osInternalBuildId || 'unknown',
        deviceName: Device.deviceName || Device.modelName || 'Unknown Device',
        appVersion: '1.0.0', // Bu değer package.json'dan alınabilir
        osVersion: Device.osVersion || 'Unknown',
      };
    } catch (error) {
      console.error('❌ Cihaz bilgisi alma hatası:', error);
      return {
        deviceId: 'unknown',
        deviceName: 'Unknown Device',
        appVersion: '1.0.0',
        osVersion: 'Unknown',
      };
    }
  }
}

export default FCMTokenService;
