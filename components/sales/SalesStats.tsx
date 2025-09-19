import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useStyles } from '../../modules/theme';
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
    profitValue: {
      color: colors.success,
    },
    approvedValue: {
      color: colors.success,
    },
    pendingValue: {
      color: colors.warning,
    },
  });

  const formatCurrency = (amount: number, currency: string = 'tl') => {
    const currencyMap: { [key: string]: string } = {
      'tl': 'TRY',
      'usd': 'USD',
      'eur': 'EUR'
    };
    
    const currencyCode = currencyMap[currency.toLowerCase()] || 'TRY';
    const locale = currencyCode === 'TRY' ? 'tr-TR' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
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
            {formatCurrency(stats.totalAmount, 'tl')}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Toplam Tutar
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={[styles.statValue, styles.profitValue]}>
            {formatCurrency(stats.totalProfit, 'tl')}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Toplam Kar
          </ThemedText>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatCurrency(stats.averageAmount, 'tl')}
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
