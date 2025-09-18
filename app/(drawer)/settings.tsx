import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@modules/auth';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { logout, user } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(colorScheme === 'dark');

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
          <ThemedText type="subtitle">Genel</ThemedText>
          
          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="bell.fill" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
              <ThemedText style={styles.settingText}>Bildirimler</ThemedText>
            </ThemedView>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </ThemedView>

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
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
});
