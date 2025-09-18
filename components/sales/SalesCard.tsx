import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';
import { TSale } from '../../types/dto';
import { ThemedText } from '../themed-text';

interface SalesCardProps {
  sale: TSale;
  onPress?: (sale: TSale) => void;
}

export function SalesCard({ sale, onPress }: SalesCardProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackgroundColor = useThemeColor({ light: '#F9FAFB', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'text');

  const styles = StyleSheet.create({
    saleCard: {
      backgroundColor: cardBackgroundColor,
      marginHorizontal: 16,
      marginVertical: 6,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor + '40',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    saleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    saleNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: tintColor,
    },
    saleDate: {
      fontSize: 14,
      color: textColor + '80',
    },
    companyName: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 4,
    },
    saleDescription: {
      fontSize: 14,
      color: textColor + '90',
      marginBottom: 8,
    },
    saleFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: borderColor + '30',
    },
    saleAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textColor,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: tintColor + '20',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: tintColor,
    },
    approvedBadge: {
      backgroundColor: '#10B981' + '20',
    },
    approvedText: {
      color: '#10B981',
    },
    pendingBadge: {
      backgroundColor: '#F59E0B' + '20',
    },
    pendingText: {
      color: '#F59E0B',
    },
    sellerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    sellerText: {
      fontSize: 12,
      color: textColor + '70',
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getStatusInfo = (sale: TSale) => {
    if (sale.approved) {
      return {
        text: 'Onaylandı',
        badgeStyle: styles.approvedBadge,
        textStyle: styles.approvedText,
      };
    } else {
      return {
        text: 'Beklemede',
        badgeStyle: styles.pendingBadge,
        textStyle: styles.pendingText,
      };
    }
  };

  const statusInfo = getStatusInfo(sale);

  return (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => onPress?.(sale)}
      activeOpacity={0.7}
    >
      <View style={styles.saleHeader}>
        <ThemedText style={styles.saleNumber}>
          #{sale.no || sale.number}
        </ThemedText>
        <ThemedText style={styles.saleDate}>
          {formatDate(sale.saleDate)}
        </ThemedText>
      </View>

      <ThemedText style={styles.companyName}>
        {sale.company}
      </ThemedText>

      {sale.description && (
        <ThemedText style={styles.saleDescription} numberOfLines={2}>
          {sale.description}
        </ThemedText>
      )}

      <View style={styles.sellerInfo}>
        <ThemedText style={styles.sellerText}>
          Satış: {sale.sellerName || 'Belirtilmemiş'}
        </ThemedText>
      </View>

      <View style={styles.saleFooter}>
        <ThemedText style={styles.saleAmount}>
          {formatCurrency(sale.grandTotal || sale.total || 0)}
        </ThemedText>
        
        <View style={[styles.statusBadge, statusInfo.badgeStyle]}>
          <Text style={[styles.statusText, statusInfo.textStyle]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
