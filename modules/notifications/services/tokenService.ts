import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { httpClient } from '../../auth/services/httpClient';
import { FCMToken } from '../types';

interface TokenRegistrationRequest {
  token: string;
  userId: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  deviceName?: string;
  appVersion?: string;
  osVersion?: string;
}

interface TokenRegistrationResponse {
  success: boolean;
  message?: string;
  tokenId?: string;
}

/**
 * FCM token'larını sunucu ile senkronize eden servis
 */
class TokenService {
  private static instance: TokenService;
  private readonly API_ENDPOINTS = {
    REGISTER_TOKEN: '/api/notifications/register-token',
    UPDATE_TOKEN: '/api/notifications/update-token',
    DELETE_TOKEN: '/api/notifications/delete-token',
    GET_USER_TOKENS: '/api/notifications/user-tokens',
  };

  private constructor() {}

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * FCM token'ını sunucuya kaydet
   */
  async registerToken(token: string, userId: string): Promise<TokenRegistrationResponse> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const request: TokenRegistrationRequest = {
        token,
        userId,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        appVersion: deviceInfo.appVersion,
        osVersion: deviceInfo.osVersion,
      };

      const response = await httpClient.post<TokenRegistrationResponse>(
        this.API_ENDPOINTS.REGISTER_TOKEN,
        request
      );

      console.log('Token sunucuya kaydedildi:', response);
      return response;
    } catch (error) {
      console.error('Token kaydetme hatası:', error);
      throw error;
    }
  }

  /**
   * Mevcut token'ı güncelle
   */
  async updateToken(oldToken: string, newToken: string, userId: string): Promise<TokenRegistrationResponse> {
    try {
      const response = await httpClient.put<TokenRegistrationResponse>(
        this.API_ENDPOINTS.UPDATE_TOKEN,
        {
          oldToken,
          newToken,
          userId,
          platform: Platform.OS,
          updatedAt: Date.now(),
        }
      );

      console.log('Token güncellendi:', response);
      return response;
    } catch (error) {
      console.error('Token güncelleme hatası:', error);
      throw error;
    }
  }

  /**
   * Token'ı sunucudan sil (logout sırasında)
   */
  async deleteToken(token: string, userId: string): Promise<TokenRegistrationResponse> {
    try {
      const response = await httpClient.delete<TokenRegistrationResponse>(
        `${this.API_ENDPOINTS.DELETE_TOKEN}?token=${encodeURIComponent(token)}&userId=${userId}`
      );

      console.log('Token silindi:', response);
      return response;
    } catch (error) {
      console.error('Token silme hatası:', error);
      throw error;
    }
  }

  /**
   * Kullanıcının tüm token'larını getir
   */
  async getUserTokens(userId: string): Promise<FCMToken[]> {
    try {
      const response = await httpClient.get<{ tokens: FCMToken[] }>(
        this.API_ENDPOINTS.GET_USER_TOKENS,
        { userId }
      );

      return response.tokens || [];
    } catch (error) {
      console.error('Token listesi alma hatası:', error);
      return [];
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
      console.error('Cihaz bilgisi alma hatası:', error);
      return {
        deviceId: 'unknown',
        deviceName: 'Unknown Device',
        appVersion: '1.0.0',
        osVersion: 'Unknown',
      };
    }
  }

  /**
   * Token'ın geçerli olup olmadığını kontrol et
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // Bu endpoint sunucuda token'ın geçerli olup olmadığını kontrol eder
      const response = await httpClient.post<{ valid: boolean }>(
        '/api/notifications/validate-token',
        { token }
      );

      return response.valid;
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      return false;
    }
  }

  /**
   * Toplu token işlemleri (birden fazla cihaz için)
   */
  async syncUserTokens(userId: string, currentToken: string): Promise<void> {
    try {
      // Önce kullanıcının mevcut token'larını al
      const existingTokens = await this.getUserTokens(userId);
      
      // Mevcut cihazın token'ı var mı kontrol et
      const deviceId = (await this.getDeviceInfo()).deviceId;
      const existingToken = existingTokens.find(t => t.deviceId === deviceId);

      if (existingToken && existingToken.token !== currentToken) {
        // Token değişmişse güncelle
        await this.updateToken(existingToken.token, currentToken, userId);
      } else if (!existingToken) {
        // Yeni cihaz, token'ı kaydet
        await this.registerToken(currentToken, userId);
      }

      // Eski/geçersiz token'ları temizle (opsiyonel)
      await this.cleanupOldTokens(userId);
    } catch (error) {
      console.error('Token senkronizasyon hatası:', error);
    }
  }

  /**
   * Eski token'ları temizle
   */
  private async cleanupOldTokens(userId: string): Promise<void> {
    try {
      const tokens = await this.getUserTokens(userId);
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000); // 30 gün

      // 30 günden eski token'ları sil
      for (const token of tokens) {
        if (token.updatedAt < thirtyDaysAgo) {
          await this.deleteToken(token.token, userId);
        }
      }
    } catch (error) {
      console.error('Eski token temizleme hatası:', error);
    }
  }
}

export default TokenService;
