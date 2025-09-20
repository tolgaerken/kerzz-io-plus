import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

interface LicenseStatsProps {
  stats: {
    totalLicenses: number;
    activeLicenses: number;
    blockedLicenses: number;
    inactiveLicenses: number;
    kerzzPosCount: number;
    orwiPosCount: number;
    kerzzCloudCount: number;
    chainCount: number;
    singleCount: number;
    withContractCount: number;
    recentlyOnlineCount: number;
  } | null;
}

export function LicenseStats({ stats }: LicenseStatsProps) {
  const { colors, spacing, fontSize } = useStyles();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.medium,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.medium,
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: spacing.medium,
      flex: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: colors.border + '40',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 3,
    },
    statValue: {
      fontSize: fontSize.xlarge,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: fontSize.small,
      color: colors.textLight,
      fontWeight: '500',
    },
    activeValue: {
      color: colors.success,
    },
    blockedValue: {
      color: colors.error,
    },
    inactiveValue: {
      color: colors.warning,
    },
    contractValue: {
      color: colors.secondary,
    },
    onlineValue: {
      color: colors.info || colors.primary,
    },
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  if (!stats) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatNumber(stats.totalLicenses)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Toplam Lisans
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={[styles.statValue, styles.activeValue]}>
            {formatNumber(stats.activeLicenses)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Aktif Lisans
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={[styles.statValue, styles.blockedValue]}>
            {formatNumber(stats.blockedLicenses)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Bloklu Lisans
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={[styles.statValue, styles.inactiveValue]}>
            {formatNumber(stats.inactiveLicenses)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Pasif Lisans
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatNumber(stats.kerzzPosCount)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Kerzz POS
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatNumber(stats.orwiPosCount)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Orwi POS
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatNumber(stats.kerzzCloudCount)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Kerzz Cloud
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatNumber(stats.chainCount)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Zincir Şirket
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatNumber(stats.singleCount)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Tekil Şirket
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={[styles.statValue, styles.contractValue]}>
            {formatNumber(stats.withContractCount)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Sözleşmeli
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={[styles.statValue, styles.onlineValue]}>
            {formatNumber(stats.recentlyOnlineCount)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Son 30 Gün Online
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}
