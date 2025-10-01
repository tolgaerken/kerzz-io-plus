import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@modules/auth';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { usePushNotificationLogsQuery } from '../../modules/data-layer/hooks/usePushNotificationLogsQuery';
import { useSalespeopleQuery } from '../../modules/data-layer/hooks/useSalespeopleQuery';
import { useStyles } from '../../modules/theme';
import { TPushNotificationLog } from '../../types/dto';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { PushNotificationLogCard } from './PushNotificationLogCard';

export function PushNotificationLogsScreen() {
  const { colors, spacing, fontSize } = useStyles();
  const { user } = useAuthStore();
  const logsQuery = usePushNotificationLogsQuery();
  
  // Kullanıcı listesini çek (opportunities'deki gibi)
  const { allUsers } = useSalespeopleQuery();

  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string | null>(null);

  // Kullanıcıya göre logları getir
  const logsStatsQuery = logsQuery.useLogsStats(user?.id);

  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
      backgroundColor: colors.card,
    },
    title: {
      fontSize: fontSize.xlarge,
      fontWeight: 'bold' as const,
      color: colors.text,
      textAlign: 'center' as const,
    },
    statsContainer: {
      backgroundColor: colors.card,
      padding: spacing.medium,
      marginHorizontal: spacing.medium,
      marginVertical: spacing.small,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    statsTitle: {
      fontSize: fontSize.medium,
      fontWeight: 'bold' as const,
      color: colors.text,
      marginBottom: spacing.small,
    },
    statsRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginVertical: spacing.tiny,
    },
    statsLabel: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    statsValue: {
      fontSize: fontSize.small,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    filtersContainer: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    filtersTitle: {
      fontSize: fontSize.small,
      fontWeight: 'bold' as const,
      color: colors.text,
      marginBottom: spacing.small,
    },
    filterChipsContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.small,
    },
    filterChip: {
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.tiny,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: fontSize.tiny,
      color: colors.text,
    },
    filterChipTextActive: {
      color: '#FFF',
      fontWeight: 'bold' as const,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xlarge,
    },
    errorText: {
      fontSize: fontSize.medium,
      color: colors.error,
      textAlign: 'center' as const,
      marginTop: spacing.medium,
    },
    emptyContainer: {
      padding: spacing.xlarge,
      alignItems: 'center' as const,
    },
    emptyText: {
      color: colors.textLight,
      textAlign: 'center' as const,
      fontSize: fontSize.medium,
    },
  };

  const handleRefresh = useCallback(() => {
    logsStatsQuery.refetch();
  }, [logsStatsQuery]);

  const handleLogPress = useCallback((log: TPushNotificationLog) => {
    // Log detaylarını göster
    const customDataStr = log.customData ? JSON.stringify(log.customData, null, 2) : 'Veri yok';
    const fullDocStr = log.fullDocument ? JSON.stringify(log.fullDocument, null, 2) : 'Veri yok';
    Alert.alert(
      'Log Detayları',
      `Başlık: ${log.title}\n\nİçerik: ${log.message}\n\nModül: ${log.module}\n\nAksiyon: ${log.action}\n\nGönderim: ${log.deliveryMethod}\n\nDurum: ${log.deliveryStatus}\n\nÖncelik: ${log.priority || 'normal'}\n\nOkundu: ${log.isRead ? 'Evet' : 'Hayır'}\n\nHata: ${log.errorMessage || '-'}\n\nÖzel Veri:\n${customDataStr}\n\nTam Döküman:\n${fullDocStr}`,
      [{ text: 'Tamam' }]
    );
  }, []);

  // Filtrelenmiş loglar
  const filteredLogs = useMemo(() => {
    if (!logsStatsQuery.data) return [];

    let logs = logsStatsQuery.data;

    if (filterStatus) {
      logs = logs.filter(log => log.deliveryStatus === filterStatus);
    }

    if (filterModule) {
      logs = logs.filter(log => log.module === filterModule);
    }

    return logs;
  }, [logsStatsQuery.data, filterStatus, filterModule]);

  // Benzersiz modüller
  const uniqueModules = useMemo(() => {
    if (!logsStatsQuery.data) return [];
    const modules = new Set(logsStatsQuery.data.map(log => log.module).filter(Boolean));
    return Array.from(modules);
  }, [logsStatsQuery.data]);

  if (logsStatsQuery.error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Bildirim Logları</ThemedText>
        </View>

        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <ThemedText style={styles.errorText}>
            Bildirim logları yüklenirken bir hata oluştu.
          </ThemedText>
          <ThemedText style={[styles.errorText, { fontSize: fontSize.small, marginTop: spacing.small }]}>
            {logsStatsQuery.error.message}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const logs = filteredLogs;
  const stats = logsStatsQuery.stats;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <ThemedText style={styles.title}>Bildirim Logları</ThemedText>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={logsStatsQuery.isFetching && !logsStatsQuery.isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* İstatistikler */}
        {stats && (
          <View style={styles.statsContainer}>
            <ThemedText style={styles.statsTitle}>İstatistikler</ThemedText>
            <View style={styles.statsRow}>
              <ThemedText style={styles.statsLabel}>Toplam Log</ThemedText>
              <ThemedText style={styles.statsValue}>{stats.total}</ThemedText>
            </View>
            <View style={styles.statsRow}>
              <ThemedText style={styles.statsLabel}>Başarılı</ThemedText>
              <ThemedText style={[styles.statsValue, { color: '#4CAF50' }]}>{stats.sent}</ThemedText>
            </View>
            <View style={styles.statsRow}>
              <ThemedText style={styles.statsLabel}>Başarısız</ThemedText>
              <ThemedText style={[styles.statsValue, { color: '#F44336' }]}>{stats.failed}</ThemedText>
            </View>
            <View style={styles.statsRow}>
              <ThemedText style={styles.statsLabel}>Okundu</ThemedText>
              <ThemedText style={[styles.statsValue, { color: '#2196F3' }]}>{stats.read}</ThemedText>
            </View>
            <View style={styles.statsRow}>
              <ThemedText style={styles.statsLabel}>Okunmadı</ThemedText>
              <ThemedText style={[styles.statsValue, { color: '#FF9800' }]}>{stats.unread}</ThemedText>
            </View>
          </View>
        )}

        {/* Filtreler */}
        <View style={styles.filtersContainer}>
          <ThemedText style={styles.filtersTitle}>Filtreler</ThemedText>
          
          {/* Durum Filtreleri */}
          <ThemedText style={[styles.filtersTitle, { fontSize: fontSize.tiny, marginTop: spacing.small }]}>Durum:</ThemedText>
          <View style={styles.filterChipsContainer}>
            <TouchableOpacity
              style={[styles.filterChip, !filterStatus && styles.filterChipActive]}
              onPress={() => setFilterStatus(null)}
            >
              <ThemedText style={[styles.filterChipText, !filterStatus && styles.filterChipTextActive]}>
                Tümü
              </ThemedText>
            </TouchableOpacity>
            {['sent', 'failed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
                onPress={() => setFilterStatus(status)}
              >
                <ThemedText style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                  {status === 'sent' ? 'Başarılı' : 'Başarısız'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Modül Filtreleri */}
          {uniqueModules.length > 0 && (
            <>
              <ThemedText style={[styles.filtersTitle, { fontSize: fontSize.tiny, marginTop: spacing.small }]}>Modül:</ThemedText>
              <View style={styles.filterChipsContainer}>
                <TouchableOpacity
                  style={[styles.filterChip, !filterModule && styles.filterChipActive]}
                  onPress={() => setFilterModule(null)}
                >
                  <ThemedText style={[styles.filterChipText, !filterModule && styles.filterChipTextActive]}>
                    Tümü
                  </ThemedText>
                </TouchableOpacity>
                {uniqueModules.map((module) => (
                  <TouchableOpacity
                    key={module}
                    style={[styles.filterChip, filterModule === module && styles.filterChipActive]}
                    onPress={() => setFilterModule(module)}
                  >
                    <ThemedText style={[styles.filterChipText, filterModule === module && styles.filterChipTextActive]}>
                      {module}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Loading State */}
        {logsStatsQuery.isLoading && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: spacing.medium, color: colors.textLight }}>
              Loglar yükleniyor...
            </ThemedText>
          </View>
        )}

        {/* Empty State */}
        {!logsStatsQuery.isLoading && logs.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-off" size={48} color={colors.textLight} />
            <ThemedText style={styles.emptyText}>
              {filterStatus || filterModule ? 'Filtreye uygun log bulunamadı' : 'Henüz bildirim logu yok'}
            </ThemedText>
          </View>
        )}

            {/* Log Listesi */}
            {!logsStatsQuery.isLoading && logs.map((log) => (
              <PushNotificationLogCard
                key={log.id || log._id?.$oid}
                log={log}
                onPress={handleLogPress}
                users={allUsers}
              />
            ))}

        {/* Bottom Padding */}
        <View style={{ height: spacing.medium }} />
      </ScrollView>
    </ThemedView>
  );
}
