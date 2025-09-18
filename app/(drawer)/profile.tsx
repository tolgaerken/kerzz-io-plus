import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Profil</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Kullanıcı Bilgileri</ThemedText>
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">Ad Soyad:</ThemedText>
            <ThemedText>Kullanıcı Adı</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">E-posta:</ThemedText>
            <ThemedText>kullanici@example.com</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">Telefon:</ThemedText>
            <ThemedText>+90 555 123 45 67</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Hesap Durumu</ThemedText>
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">Üyelik Tarihi:</ThemedText>
            <ThemedText>01 Ocak 2024</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">Durum:</ThemedText>
            <ThemedText style={styles.activeStatus}>Aktif</ThemedText>
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
  section: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
