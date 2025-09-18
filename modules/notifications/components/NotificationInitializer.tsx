import React, { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuthStore } from '../../auth';

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
    // Bu fonksiyon auth modülündeki httpClient'ı kullanarak
    // token'ı sunucuya gönderecek
    
    // Örnek API çağrısı:
    // await httpClient.post('/api/notifications/register-token', {
    //   token,
    //   userId,
    //   platform: Platform.OS,
    //   deviceId: Device.modelId,
    // });
    
    console.log('Token sunucuya gönderildi:', { token, userId });
  } catch (error) {
    console.error('Token gönderme hatası:', error);
    throw error;
  }
};

export default NotificationInitializer;
