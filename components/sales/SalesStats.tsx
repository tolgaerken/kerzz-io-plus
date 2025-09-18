import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

interface SalesStatsProps {
  stats: {
    totalSales: number;
    totalAmount: number;
    totalProfit: number;
    averageAmount: number;
    approvedSales: number;
    pendingSales: number;
  } | null;
}

export function SalesStats({ stats }: SalesStatsProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackgroundColor = useThemeColor({ light: '#F9FAFB', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'text');

  const styles = StyleSheet.create({
    container: {
      backgroundColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      backgroundColor: cardBackgroundColor,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: borderColor + '40',
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
      fontSize: 20,
      fontWeight: 'bold',
      color: tintColor,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: textColor + '80',
      fontWeight: '500',
    },
    profitValue: {
      color: '#10B981',
    },
    approvedValue: {
      color: '#10B981',
    },
    pendingValue: {
      color: '#F59E0B',
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
            {formatNumber(stats.totalSales)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Toplam Satış
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatCurrency(stats.totalAmount)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Toplam Tutar
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={[styles.statValue, styles.profitValue]}>
            {formatCurrency(stats.totalProfit)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Toplam Kar
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatCurrency(stats.averageAmount)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Ortalama Tutar
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={[styles.statValue, styles.approvedValue]}>
            {formatNumber(stats.approvedSales)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Onaylanan
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={[styles.statValue, styles.pendingValue]}>
            {formatNumber(stats.pendingSales)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Bekleyen
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}
