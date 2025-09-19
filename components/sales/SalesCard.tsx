import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { TSale } from '../../types/dto';
import { ThemedText } from '../themed-text';

interface SalesCardProps {
  sale: TSale;
  onPress?: (sale: TSale) => void;
}

export function SalesCard({ sale, onPress }: SalesCardProps) {
  const { colors, spacing, fontSize } = useStyles();

  const styles = StyleSheet.create({
    saleCard: {
      backgroundColor: colors.card,
      marginHorizontal: spacing.medium,
      marginVertical: spacing.small / 2,
      padding: spacing.medium,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border + '40',
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
      marginBottom: spacing.small,
    },
    saleHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
    },
    saleNumber: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.primary,
    },
    saleDate: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    companyName: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    saleDescription: {
      fontSize: fontSize.small,
      color: colors.textLight,
      marginBottom: spacing.small,
    },
    saleFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.small,
      paddingTop: spacing.small,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    saleAmount: {
      fontSize: fontSize.medium,
      fontWeight: 'bold',
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: spacing.small,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.primary + '20',
    },
    statusText: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.primary,
    },
    approvedBadge: {
      backgroundColor: colors.success + '20',
    },
    approvedText: {
      color: colors.success,
    },
    pendingBadge: {
      backgroundColor: colors.warning + '20',
    },
    pendingText: {
      color: colors.warning,
    },
    sellerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    sellerText: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    internalFirmChip: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    internalFirmText: {
      fontSize: 8,
      fontWeight: '600',
      color: colors.primary,
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

  const calculatePaymentPercentage = (sale: TSale) => {
    const grandTotal = sale.grandTotal || sale.total || 0;
    if (grandTotal === 0) return 0;
    
    const paymentsTotal = (sale.payments || []).reduce((sum, payment) => {
      return sum + (payment.amount || 0);
    }, 0);
    
    return Math.round((paymentsTotal / grandTotal) * 100);
  };

  const getPaymentColor = (percentage: number) => {
    // %0 = koyu kırmızı #DC2626
    // %100 = yumuşak yeşil #16A34A
    // Arası gradient
    
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    if (clampedPercentage <= 50) {
      // %0-50 arası: kırmızıdan turuncuya
      const ratio = clampedPercentage / 50;
      const red = Math.round(220 + (239 - 220) * ratio); // 220 -> 239
      const green = Math.round(38 + (68 - 38) * ratio);   // 38 -> 68
      const blue = Math.round(38 + (28 - 38) * ratio);    // 38 -> 28
      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // %50-100 arası: turuncudan yumuşak yeşile
      const ratio = (clampedPercentage - 50) / 50;
      const red = Math.round(239 + (22 - 239) * ratio);   // 239 -> 22
      const green = Math.round(68 + (163 - 68) * ratio);  // 68 -> 163
      const blue = Math.round(28 + (74 - 28) * ratio);    // 28 -> 74
      return `rgb(${red}, ${green}, ${blue})`;
    }
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
        <View style={styles.saleHeaderLeft}>
          <ThemedText style={styles.saleNumber}>
            #{sale.no || sale.number}
          </ThemedText>
          {sale.internalFirm && (
            <View style={styles.internalFirmChip}>
              <ThemedText style={styles.internalFirmText}>
                {sale.internalFirm}
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.saleDate}>
          {formatDate(sale.saleDate)}
        </ThemedText>
      </View>

      <ThemedText style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">
        {sale.company}
      </ThemedText>

      {sale.brand && (
        <ThemedText style={{ fontSize: fontSize.small, color: colors.textLight, marginBottom: 4 }}>
          {sale.brand}
        </ThemedText>
      )}

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
        <View>
          <ThemedText style={styles.saleAmount}>
            {formatCurrency(sale.grandTotal || sale.total || 0, 'tl')} / {formatCurrency(sale.saasTotal || 0, 'tl')}
          </ThemedText>
          <ThemedText style={[
            styles.saleAmount, 
            { 
              fontSize: 12, 
              color: getPaymentColor(calculatePaymentPercentage(sale)), 
              marginTop: 2,
              fontWeight: '600'
            }
          ]}>
            Ödeme: %{calculatePaymentPercentage(sale)}
          </ThemedText>
        </View>
        
        <View style={[styles.statusBadge, statusInfo.badgeStyle]}>
          <Text style={[styles.statusText, statusInfo.textStyle]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

    </TouchableOpacity>
  );
}
