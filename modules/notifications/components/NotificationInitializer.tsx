import React, { useEffect } from 'react';
import { useAuthStore } from '../../auth';
import { useNotifications } from '../hooks/useNotifications';
import FCMTokenService from '../services/fcmTokenService';

interface NotificationInitializerProps {
  children: React.ReactNode;
}

/**
 * Notification sistemini başlatan ve auth durumuna göre yöneten component
 */
const NotificationInitializer: React.FC<NotificationInitializerProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { 
    isInitialized, 
    hasPermission, 
    getToken, 
    requestPermission 
  } = useNotifications();

  // Auth durumu değiştiğinde notification token'ını sunucuya gönder
  useEffect(() => {
    const syncTokenWithServer = async () => {
      if (isAuthenticated && hasPermission && isInitialized) {
        try {
          const token = await getToken();
          if (token && user?.id) {
            // Token'ı sunucuya gönder
            await sendTokenToServer(token, user.id);
          }
        } catch (error) {
          console.error('Token sunucuya gönderilirken hata:', error);
        }
      }
    };

    syncTokenWithServer();
  }, [isAuthenticated, hasPermission, isInitialized, user?.id, getToken]);

  // Kullanıcı giriş yaptığında notification izni iste (eğer daha önce istenmemişse)
  useEffect(() => {
    const requestPermissionIfNeeded = async () => {
      if (isAuthenticated && !hasPermission && isInitialized) {
        // Kullanıcıya notification'ların faydalarını anlatan bir modal gösterebiliriz
        // Şimdilik otomatik olarak izin isteyelim
        setTimeout(() => {
          requestPermission();
        }, 2000); // 2 saniye bekle ki kullanıcı uygulamaya alışsın
      }
    };

    requestPermissionIfNeeded();
  }, [isAuthenticated, hasPermission, isInitialized, requestPermission]);

  return <>{children}</>;
};

/**
 * FCM token'ını sunucuya gönderen fonksiyon
 */
const sendTokenToServer = async (token: string, userId: string): Promise<void> => {
  try {
    const tokenService = FCMTokenService.getInstance();
    await tokenService.syncToken(token, userId);
    console.log('Token başarıyla sunucuya gönderildi:', { token, userId });
  } catch (error) {
    console.error('Token gönderme hatası:', error);
    // Token gönderme hatası kritik değil, uygulamanın çalışmasını engellemez
    // Sadece log'larız ve devam ederiz
  }
};

export default NotificationInitializer;
