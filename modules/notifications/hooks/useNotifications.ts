import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { NotificationSettings } from '../types';

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    permission,
    settings,
    fcmToken,
    isInitialized,
    isLoading,
    initialize,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    updateSettings,
    refreshToken,
    sendLocalNotification,
    setBadgeCount,
  } = useNotificationStore();

  // Initialize notification system on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Update badge count when unread count changes
  useEffect(() => {
    if (isInitialized) {
      setBadgeCount(unreadCount);
    }
  }, [unreadCount, isInitialized, setBadgeCount]);

  const hasPermission = permission?.status === 'granted';
  const canRequestPermission = permission?.canAskAgain !== false;

  const requestNotificationPermission = useCallback(async () => {
    return await requestPermission();
  }, [requestPermission]);

  const sendNotification = useCallback(async (
    title: string, 
    body: string, 
    data?: Record<string, any>
  ) => {
    if (!hasPermission) {
      console.warn('Notification izni yok');
      return;
    }
    
    await sendLocalNotification(title, body, data);
  }, [hasPermission, sendLocalNotification]);

  const updateNotificationSettings = useCallback(async (
    newSettings: Partial<NotificationSettings>
  ) => {
    await updateSettings(newSettings);
  }, [updateSettings]);

  const getToken = useCallback(async () => {
    if (!hasPermission) {
      return null;
    }
    
    return fcmToken || await refreshToken();
  }, [hasPermission, fcmToken, refreshToken]);

  return {
    // State
    notifications,
    unreadCount,
    permission,
    settings,
    fcmToken,
    isInitialized,
    isLoading,
    hasPermission,
    canRequestPermission,

    // Actions
    requestPermission: requestNotificationPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    updateSettings: updateNotificationSettings,
    sendNotification,
    getToken,
    refreshToken,
  };
};
