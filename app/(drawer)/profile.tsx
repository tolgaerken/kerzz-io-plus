import React from 'react';
import { ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@modules/theme';

export default function ProfileScreen() {
  const { theme } = useTheme();

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
    infoItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: theme.spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    activeStatus: {
      color: theme.colors.success,
      fontWeight: 'bold' as const,
    },
  };

  return (
    <ScrollView style={dynamicStyles.container}>
      <ThemedView style={dynamicStyles.content}>
        <ThemedView style={dynamicStyles.header}>
          <ThemedText type="title">Profil</ThemedText>
        </ThemedView>
        
        <ThemedView style={dynamicStyles.section}>
          <ThemedText type="subtitle">Kullanıcı Bilgileri</ThemedText>
          <ThemedView style={dynamicStyles.infoItem}>
            <ThemedText type="defaultSemiBold">Ad Soyad:</ThemedText>
            <ThemedText>Kullanıcı Adı</ThemedText>
          </ThemedView>
          <ThemedView style={dynamicStyles.infoItem}>
            <ThemedText type="defaultSemiBold">E-posta:</ThemedText>
            <ThemedText>kullanici@example.com</ThemedText>
          </ThemedView>
          <ThemedView style={dynamicStyles.infoItem}>
            <ThemedText type="defaultSemiBold">Telefon:</ThemedText>
            <ThemedText>+90 555 123 45 67</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={dynamicStyles.section}>
          <ThemedText type="subtitle">Hesap Durumu</ThemedText>
          <ThemedView style={dynamicStyles.infoItem}>
            <ThemedText type="defaultSemiBold">Üyelik Tarihi:</ThemedText>
            <ThemedText>01 Ocak 2024</ThemedText>
          </ThemedView>
          <ThemedView style={dynamicStyles.infoItem}>
            <ThemedText type="defaultSemiBold">Durum:</ThemedText>
            <ThemedText style={dynamicStyles.activeStatus}>Aktif</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

