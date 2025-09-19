import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@modules/auth';
import { NotificationPermissionModal, useNotifications } from '@modules/notifications';
import { useTheme } from '@modules/theme';

export default function SettingsScreen() {
  const { theme, themeMode, toggleMode } = useTheme();
  const { logout, user } = useAuthStore();
  const { 
    hasPermission, 
    settings, 
    updateSettings, 
    sendNotification,
    unreadCount 
  } = useNotifications();
  
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(themeMode === 'dark');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Notification ayarlarını yükle
  useEffect(() => {
    if (settings) {
      // Settings yüklendikten sonra state'leri güncelle
    }
  }, [settings]);

  const handleNotificationToggle = async (value: boolean) => {
    if (value && !hasPermission) {
      // İzin yoksa modal göster
      setShowPermissionModal(true);
    } else if (value && hasPermission) {
      // İzin varsa bildirimleri etkinleştir
      await updateSettings({ 
        ...settings,
        categories: {
          ...settings?.categories,
          messages: true,
          updates: true,
        }
      });
    } else {
      // Bildirimleri devre dışı bırak
      await updateSettings({ 
        ...settings,
        categories: {
          ...settings?.categories,
          messages: false,
          updates: false,
          promotions: false,
          reminders: false,
        }
      });
    }
  };

  const handleCategoryToggle = async (category: string, value: boolean) => {
    await updateSettings({
      ...settings,
      categories: {
        ...settings?.categories,
        [category]: value,
      },
    });
  };

  const handleTestNotification = async () => {
    if (!hasPermission) {
      Alert.alert('Hata', 'Bildirim izni gerekli');
      return;
    }

    try {
      await sendNotification(
        'Test Bildirimi',
        'Bu bir test bildirimidir. Sistem düzgün çalışıyor! 🎉',
        { category: 'system', actionUrl: '/settings' }
      );
      
      Alert.alert('Başarılı', 'Test bildirimi gönderildi!');
    } catch {
      Alert.alert('Hata', 'Bildirim gönderilemedi');
    }
  };

  // Notification kategorilerinin aktif olup olmadığını kontrol et
  const isNotificationsEnabled = hasPermission && (
    settings?.categories?.messages || 
    settings?.categories?.updates || 
    settings?.categories?.promotions || 
    settings?.categories?.reminders
  );

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout hatası:', error);
          }
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Bu işlem geri alınamaz. Hesabınızı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => console.log('Delete Account') },
      ]
    );
  };

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.large,
    },
    header: {
      marginBottom: theme.spacing.xlarge,
      alignItems: 'center' as const,
    },
    userInfo: {
      marginTop: theme.spacing.medium,
      alignItems: 'center' as const,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.card,
      borderRadius: 8,
    },
    section: {
      marginBottom: theme.spacing.xlarge,
      padding: theme.spacing.large,
      borderRadius: 12,
      backgroundColor: theme.colors.card,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    settingItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    settingLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
    },
    settingText: {
      marginLeft: theme.spacing.medium,
      fontSize: theme.fontSize.medium,
      color: theme.colors.text,
    },
    settingSubtext: {
      marginLeft: theme.spacing.medium,
      fontSize: theme.fontSize.small,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    infoItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: theme.spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
    if ((value && themeMode === 'light') || (!value && themeMode === 'dark')) {
      toggleMode();
    }
  };

  return (
    <ScrollView style={dynamicStyles.container}>
      <ThemedView style={dynamicStyles.content}>
        <ThemedView style={dynamicStyles.header}>
          <ThemedText type="title">Ayarlar</ThemedText>
          {user && (
            <ThemedView style={dynamicStyles.userInfo}>
              <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
              <ThemedText type="default">{user.email}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={dynamicStyles.section}>
          <ThemedText type="subtitle">Bildirimler</ThemedText>
          
          <ThemedView style={dynamicStyles.settingItem}>
            <ThemedView style={dynamicStyles.settingLeft}>
              <IconSymbol name="bell.fill" size={20} color={theme.colors.text} />
              <ThemedView>
                <ThemedText style={dynamicStyles.settingText}>Bildirimler</ThemedText>
                <ThemedText style={dynamicStyles.settingSubtext}>
                  {hasPermission ? 'Etkin' : 'İzin gerekli'} 
                  {unreadCount > 0 && ` • ${unreadCount} okunmamış`}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={isNotificationsEnabled ? theme.colors.primary : theme.colors.textLight}
            />
          </ThemedView>

          {hasPermission && (
            <>
              <ThemedView style={dynamicStyles.settingItem}>
                <ThemedView style={dynamicStyles.settingLeft}>
                  <IconSymbol name="message.fill" size={20} color={theme.colors.text} />
                  <ThemedText style={dynamicStyles.settingText}>Mesajlar</ThemedText>
                </ThemedView>
                <Switch
                  value={settings?.categories?.messages || false}
                  onValueChange={(value) => handleCategoryToggle('messages', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                  thumbColor={settings?.categories?.messages ? theme.colors.primary : theme.colors.textLight}
                />
              </ThemedView>

              <ThemedView style={dynamicStyles.settingItem}>
                <ThemedView style={dynamicStyles.settingLeft}>
                  <IconSymbol name="arrow.up.circle.fill" size={20} color={theme.colors.text} />
                  <ThemedText style={dynamicStyles.settingText}>Güncellemeler</ThemedText>
                </ThemedView>
                <Switch
                  value={settings?.categories?.updates || false}
                  onValueChange={(value) => handleCategoryToggle('updates', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                  thumbColor={settings?.categories?.updates ? theme.colors.primary : theme.colors.textLight}
                />
              </ThemedView>

              <ThemedView style={dynamicStyles.settingItem}>
                <ThemedView style={dynamicStyles.settingLeft}>
                  <IconSymbol name="tag.fill" size={20} color={theme.colors.text} />
                  <ThemedText style={dynamicStyles.settingText}>Promosyonlar</ThemedText>
                </ThemedView>
                <Switch
                  value={settings?.categories?.promotions || false}
                  onValueChange={(value) => handleCategoryToggle('promotions', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                  thumbColor={settings?.categories?.promotions ? theme.colors.primary : theme.colors.textLight}
                />
              </ThemedView>

              <ThemedView style={dynamicStyles.settingItem}>
                <ThemedView style={dynamicStyles.settingLeft}>
                  <IconSymbol name="clock.fill" size={20} color={theme.colors.text} />
                  <ThemedText style={dynamicStyles.settingText}>Hatırlatmalar</ThemedText>
                </ThemedView>
                <Switch
                  value={settings?.categories?.reminders || false}
                  onValueChange={(value) => handleCategoryToggle('reminders', value)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
                  thumbColor={settings?.categories?.reminders ? theme.colors.primary : theme.colors.textLight}
                />
              </ThemedView>

              <TouchableOpacity style={dynamicStyles.settingItem} onPress={handleTestNotification}>
                <ThemedView style={dynamicStyles.settingLeft}>
                  <IconSymbol name="paperplane.fill" size={20} color={theme.colors.info} />
                  <ThemedText style={[dynamicStyles.settingText, { color: theme.colors.info }]}>Test Bildirimi Gönder</ThemedText>
                </ThemedView>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>

        <ThemedView style={dynamicStyles.section}>
          <ThemedText type="subtitle">Genel</ThemedText>

          <ThemedView style={dynamicStyles.settingItem}>
            <ThemedView style={dynamicStyles.settingLeft}>
              <IconSymbol name="location.fill" size={20} color={theme.colors.text} />
              <ThemedText style={dynamicStyles.settingText}>Konum Servisleri</ThemedText>
            </ThemedView>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={locationEnabled ? theme.colors.primary : theme.colors.textLight}
            />
          </ThemedView>

          <ThemedView style={dynamicStyles.settingItem}>
            <ThemedView style={dynamicStyles.settingLeft}>
              <IconSymbol name="moon.fill" size={20} color={theme.colors.text} />
              <ThemedText style={dynamicStyles.settingText}>Karanlık Mod</ThemedText>
            </ThemedView>
            <Switch
              value={darkModeEnabled}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
              thumbColor={darkModeEnabled ? theme.colors.primary : theme.colors.textLight}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={dynamicStyles.section}>
          <ThemedText type="subtitle">Hesap</ThemedText>
          
          <TouchableOpacity style={dynamicStyles.settingItem} onPress={() => console.log('Privacy')}>
            <ThemedView style={dynamicStyles.settingLeft}>
              <IconSymbol name="lock.fill" size={20} color={theme.colors.text} />
              <ThemedText style={dynamicStyles.settingText}>Gizlilik</ThemedText>
            </ThemedView>
            <IconSymbol name="chevron.right" size={16} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.settingItem} onPress={() => console.log('Security')}>
            <ThemedView style={dynamicStyles.settingLeft}>
              <IconSymbol name="shield.fill" size={20} color={theme.colors.text} />
              <ThemedText style={dynamicStyles.settingText}>Güvenlik</ThemedText>
            </ThemedView>
            <IconSymbol name="chevron.right" size={16} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.settingItem} onPress={handleLogout}>
            <ThemedView style={dynamicStyles.settingLeft}>
              <IconSymbol name="arrow.right.square.fill" size={20} color={theme.colors.error} />
              <ThemedText style={[dynamicStyles.settingText, { color: theme.colors.error }]}>Çıkış Yap</ThemedText>
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.settingItem} onPress={handleDeleteAccount}>
            <ThemedView style={dynamicStyles.settingLeft}>
              <IconSymbol name="trash.fill" size={20} color={theme.colors.error} />
              <ThemedText style={[dynamicStyles.settingText, { color: theme.colors.error }]}>Hesabı Sil</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={dynamicStyles.section}>
          <ThemedText type="subtitle">Hakkında</ThemedText>
          
          <ThemedView style={dynamicStyles.infoItem}>
            <ThemedText type="defaultSemiBold">Versiyon:</ThemedText>
            <ThemedText>1.0.0</ThemedText>
          </ThemedView>
          <ThemedView style={dynamicStyles.infoItem}>
            <ThemedText type="defaultSemiBold">Yapı Numarası:</ThemedText>
            <ThemedText>2024.09.18</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <NotificationPermissionModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionGranted={() => {
          setShowPermissionModal(false);
          // İzin verildikten sonra bildirimleri etkinleştir
          setTimeout(() => {
            handleNotificationToggle(true);
          }, 500);
        }}
        onPermissionDenied={() => {
          setShowPermissionModal(false);
        }}
      />
    </ScrollView>
  );
}

