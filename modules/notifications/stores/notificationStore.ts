import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import NotificationService from '../services/notificationService';
import {
    NotificationData,
    NotificationPermission,
    NotificationSettings
} from '../types';

interface NotificationState {
  // State
  notifications: NotificationData[];
  unreadCount: number;
  permission: NotificationPermission | null;
  settings: NotificationSettings | null;
  fcmToken: string | null;
  isInitialized: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  refreshToken: () => Promise<string | null>;
  sendLocalNotification: (title: string, body: string, data?: Record<string, any>) => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      permission: null,
      settings: null,
      fcmToken: null,
      isInitialized: false,
      isLoading: false,

      // Initialize notification system
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        set({ isLoading: true });

        try {
          const notificationService = NotificationService.getInstance();
          
          // Permission durumunu kontrol et
          const permission = await notificationService.requestPermissions();
          
          // Ayarları yükle
          const settings = await notificationService.getSettings();
          
          // Token'ı al
          let token = null;
          if (permission.status === 'granted') {
            token = await notificationService.getToken();
            
            // Listener'ları başlat
            notificationService.startListening();
            
            // Initial notification'ı kontrol et (uygulama notification ile açıldıysa)
            await notificationService.getInitialNotification();
          }

          set({
            permission,
            settings,
            fcmToken: token,
            isInitialized: true,
            isLoading: false,
          });

        } catch (error) {
          console.error('Notification initialization hatası:', error);
          set({ isLoading: false });
        }
      },

      // Request notification permission
      requestPermission: async () => {
        set({ isLoading: true });
        
        try {
          const notificationService = NotificationService.getInstance();
          const permission = await notificationService.requestPermissions();
          
          let token = null;
          if (permission.status === 'granted') {
            token = await notificationService.getToken();
            notificationService.startListening();
          }

          set({ 
            permission, 
            fcmToken: token,
            isLoading: false 
          });

          return permission;
        } catch (error) {
          console.error('Permission request hatası:', error);
          set({ isLoading: false });
          return { status: 'denied', canAskAgain: false };
        }
      },

      // Add new notification
      addNotification: (notificationData) => {
        const newNotification: NotificationData = {
          ...notificationData,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      // Mark notification as read
      markAsRead: (notificationId) => {
        set((state) => {
          const notifications = state.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          );

          const unreadCount = notifications.filter(n => !n.read).length;

          return { notifications, unreadCount };
        });
      },

      // Mark all notifications as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        }));
      },

      // Remove notification
      removeNotification: (notificationId) => {
        set((state) => {
          const notifications = state.notifications.filter(n => n.id !== notificationId);
          const unreadCount = notifications.filter(n => !n.read).length;
          
          return { notifications, unreadCount };
        });
      },

      // Clear all notifications
      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });

        // System notification'ları da temizle
        const notificationService = NotificationService.getInstance();
        notificationService.clearAllNotifications();
      },

      // Update notification settings
      updateSettings: async (newSettings) => {
        const state = get();
        const updatedSettings = { ...state.settings, ...newSettings };
        
        try {
          const notificationService = NotificationService.getInstance();
          await notificationService.saveSettings(updatedSettings);
          
          set({ settings: updatedSettings });
        } catch (error) {
          console.error('Settings güncelleme hatası:', error);
        }
      },

      // Refresh FCM token
      refreshToken: async () => {
        try {
          const notificationService = NotificationService.getInstance();
          const token = await notificationService.getToken();
          
          set({ fcmToken: token });
          return token;
        } catch (error) {
          console.error('Token yenileme hatası:', error);
          return null;
        }
      },

      // Send local notification
      sendLocalNotification: async (title, body, data) => {
        try {
          const notificationService = NotificationService.getInstance();
          await notificationService.sendLocalNotification(title, body, data);
          
          // Store'a da ekle
          get().addNotification({ title, body, data });
        } catch (error) {
          console.error('Local notification gönderme hatası:', error);
        }
      },

      // Set badge count
      setBadgeCount: async (count) => {
        try {
          const notificationService = NotificationService.getInstance();
          await notificationService.setBadgeCount(count);
        } catch (error) {
          console.error('Badge count güncelleme hatası:', error);
        }
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        settings: state.settings,
        permission: state.permission,
      }),
    }
  )
);
