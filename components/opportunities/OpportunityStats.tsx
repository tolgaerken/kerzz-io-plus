import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { ThemedText } from '../themed-text';

interface OpportunityStatsData {
  totalOpportunities: number;
  hotOpportunities: number;
  warmOpportunities: number;
  coldOpportunities: number;
  newOpportunities: number;
  inProgressOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
}

interface OpportunityStatsProps {
  stats: OpportunityStatsData | null;
}

export function OpportunityStats({ stats }: OpportunityStatsProps) {
  const { colors, spacing, fontSize } = useStyles();

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.medium,
      backgroundColor: colors.background,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: spacing.small,
    },
    statCard: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border + '40',
      borderRadius: 12,
      padding: spacing.medium,
      width: '48%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    statValue: {
      fontSize: fontSize.xlarge,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: fontSize.small,
      color: colors.textLight,
      textAlign: 'center',
      fontWeight: '500',
    },
    // Heat level colors
    hotCard: {
      borderColor: '#EF4444' + '40',
      backgroundColor: '#EF4444' + '05',
    },
    hotValue: {
      color: '#EF4444',
    },
    warmCard: {
      borderColor: '#F59E0B' + '40',
      backgroundColor: '#F59E0B' + '05',
    },
    warmValue: {
      color: '#F59E0B',
    },
    coldCard: {
      borderColor: '#6B7280' + '40',
      backgroundColor: '#6B7280' + '05',
    },
    coldValue: {
      color: '#6B7280',
    },
    // Status colors
    newCard: {
      borderColor: '#3B82F6' + '40',
      backgroundColor: '#3B82F6' + '05',
    },
    newValue: {
      color: '#3B82F6',
    },
    inProgressCard: {
      borderColor: '#F59E0B' + '40',
      backgroundColor: '#F59E0B' + '05',
    },
    inProgressValue: {
      color: '#F59E0B',
    },
    wonCard: {
      borderColor: '#10B981' + '40',
      backgroundColor: '#10B981' + '05',
    },
    wonValue: {
      color: '#10B981',
    },
    lostCard: {
      borderColor: '#EF4444' + '40',
      backgroundColor: '#EF4444' + '05',
    },
    lostValue: {
      color: '#EF4444',
    },
    totalCard: {
      borderColor: colors.primary + '40',
      backgroundColor: colors.primary + '05',
    },
    totalValue: {
      color: colors.primary,
    },
    sectionTitle: {
      fontSize: fontSize.medium,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.small,
      marginTop: spacing.medium,
    },
  });

  if (!stats) {
    return (
      <View style={styles.container}>
        <View style={[styles.statCard, { width: '100%' }]}>
          <ThemedText style={styles.statLabel}>
            İstatistikler yükleniyor...
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Genel İstatistik */}
      <View style={[styles.statCard, styles.totalCard, { width: '100%', marginBottom: spacing.medium }]}>
        <ThemedText style={[styles.statValue, styles.totalValue]}>
          {stats.totalOpportunities}
        </ThemedText>
        <ThemedText style={styles.statLabel}>
          Toplam Fırsat
        </ThemedText>
      </View>

      {/* Sıcaklık Durumu */}
      <ThemedText style={styles.sectionTitle}>Fırsat Sıcaklığı</ThemedText>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.hotCard]}>
          <ThemedText style={[styles.statValue, styles.hotValue]}>
            {stats.hotOpportunities}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Sıcak Fırsatlar
          </ThemedText>
        </View>

        <View style={[styles.statCard, styles.warmCard]}>
          <ThemedText style={[styles.statValue, styles.warmValue]}>
            {stats.warmOpportunities}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Ilık Fırsatlar
          </ThemedText>
        </View>

        <View style={[styles.statCard, styles.coldCard]}>
          <ThemedText style={[styles.statValue, styles.coldValue]}>
            {stats.coldOpportunities}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Soğuk Fırsatlar
          </ThemedText>
        </View>
      </View>

      {/* Durum İstatistikleri */}
      <ThemedText style={styles.sectionTitle}>Fırsat Durumu</ThemedText>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.newCard]}>
          <ThemedText style={[styles.statValue, styles.newValue]}>
            {stats.newOpportunities}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Yeni
          </ThemedText>
        </View>

        <View style={[styles.statCard, styles.inProgressCard]}>
          <ThemedText style={[styles.statValue, styles.inProgressValue]}>
            {stats.inProgressOpportunities}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Devam Ediyor
          </ThemedText>
        </View>

        <View style={[styles.statCard, styles.wonCard]}>
          <ThemedText style={[styles.statValue, styles.wonValue]}>
            {stats.wonOpportunities}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Kazanıldı
          </ThemedText>
        </View>

        <View style={[styles.statCard, styles.lostCard]}>
          <ThemedText style={[styles.statValue, styles.lostValue]}>
            {stats.lostOpportunities}
          </ThemedText>
          <ThemedText style={styles.statLabel}>
            Kaybedildi
          </ThemedText>
        </View>
      </View>
    </View>
  );
}
