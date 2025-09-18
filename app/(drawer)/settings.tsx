import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@modules/auth';
import { NotificationPermissionModal, useNotifications } from '@modules/notifications';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { logout, user } = useAuthStore();
  const { 
    hasPermission, 
    settings, 
    updateSettings, 
    requestPermission,
    sendNotification,
    unreadCount 
  } = useNotifications();
  
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(colorScheme === 'dark');
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
    } catch (error) {
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

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Ayarlar</ThemedText>
          {user && (
            <ThemedView style={styles.userInfo}>
              <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
              <ThemedText type="default">{user.email}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Bildirimler</ThemedText>
          
          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="bell.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
              <ThemedView>
                <ThemedText style={styles.settingText}>Bildirimler</ThemedText>
                <ThemedText style={styles.settingSubtext}>
                  {hasPermission ? 'Etkin' : 'İzin gerekli'} 
                  {unreadCount > 0 && ` • ${unreadCount} okunmamış`}
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={handleNotificationToggle}
            />
          </ThemedView>

          {hasPermission && (
            <>
              <ThemedView style={styles.settingItem}>
                <ThemedView style={styles.settingLeft}>
                  <IconSymbol name="message.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                  <ThemedText style={styles.settingText}>Mesajlar</ThemedText>
                </ThemedView>
                <Switch
                  value={settings?.categories?.messages || false}
                  onValueChange={(value) => handleCategoryToggle('messages', value)}
                />
              </ThemedView>

              <ThemedView style={styles.settingItem}>
                <ThemedView style={styles.settingLeft}>
                  <IconSymbol name="arrow.up.circle.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                  <ThemedText style={styles.settingText}>Güncellemeler</ThemedText>
                </ThemedView>
                <Switch
                  value={settings?.categories?.updates || false}
                  onValueChange={(value) => handleCategoryToggle('updates', value)}
                />
              </ThemedView>

              <ThemedView style={styles.settingItem}>
                <ThemedView style={styles.settingLeft}>
                  <IconSymbol name="tag.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                  <ThemedText style={styles.settingText}>Promosyonlar</ThemedText>
                </ThemedView>
                <Switch
                  value={settings?.categories?.promotions || false}
                  onValueChange={(value) => handleCategoryToggle('promotions', value)}
                />
              </ThemedView>

              <ThemedView style={styles.settingItem}>
                <ThemedView style={styles.settingLeft}>
                  <IconSymbol name="clock.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                  <ThemedText style={styles.settingText}>Hatırlatmalar</ThemedText>
                </ThemedView>
                <Switch
                  value={settings?.categories?.reminders || false}
                  onValueChange={(value) => handleCategoryToggle('reminders', value)}
                />
              </ThemedView>

              <TouchableOpacity style={styles.settingItem} onPress={handleTestNotification}>
                <ThemedView style={styles.settingLeft}>
                  <IconSymbol name="paperplane.fill" size={20} color="#3B82F6" />
                  <ThemedText style={[styles.settingText, { color: '#3B82F6' }]}>Test Bildirimi Gönder</ThemedText>
                </ThemedView>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Genel</ThemedText>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="location.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
              <ThemedText style={styles.settingText}>Konum Servisleri</ThemedText>
            </ThemedView>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
            />
          </ThemedView>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="moon.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
              <ThemedText style={styles.settingText}>Karanlık Mod</ThemedText>
            </ThemedView>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Hesap</ThemedText>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => console.log('Privacy')}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="lock.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
              <ThemedText style={styles.settingText}>Gizlilik</ThemedText>
            </ThemedView>
            <IconSymbol name="chevron.right" size={16} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => console.log('Security')}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="shield.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
              <ThemedText style={styles.settingText}>Güvenlik</ThemedText>
            </ThemedView>
            <IconSymbol name="chevron.right" size={16} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="arrow.right.square.fill" size={20} color="#FF6B6B" />
              <ThemedText style={[styles.settingText, { color: '#FF6B6B' }]}>Çıkış Yap</ThemedText>
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
              <ThemedText style={[styles.settingText, { color: '#FF3B30' }]}>Hesabı Sil</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Hakkında</ThemedText>
          
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">Versiyon:</ThemedText>
            <ThemedText>1.0.0</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoItem}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  userInfo: {
    marginTop: 16,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    fontSize: 16,
  },
  settingSubtext: {
    marginLeft: 12,
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
});
