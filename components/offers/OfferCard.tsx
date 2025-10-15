import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { TOffer } from '../../types/offer.types';
import { ThemedText } from '../themed-text';

interface OfferCardProps {
  offer: TOffer;
  onPress?: (offer: TOffer) => void;
}

export function OfferCard({ offer, onPress }: OfferCardProps) {
  const { colors, spacing, fontSize } = useStyles();

  const styles = StyleSheet.create({
    offerCard: {
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
    offerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.small,
    },
    offerHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
    },
    offerNumber: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.primary,
    },
    offerDate: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    companyName: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    offerDescription: {
      fontSize: fontSize.small,
      color: colors.textLight,
      marginBottom: spacing.small,
    },
    offerFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.small,
      paddingTop: spacing.small,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    offerAmount: {
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

  const getStatusInfo = (offer: TOffer) => {
    if (offer.approved) {
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

  const statusInfo = getStatusInfo(offer);

  return (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={() => onPress?.(offer)}
      activeOpacity={0.7}
    >
      <View style={styles.offerHeader}>
        <View style={styles.offerHeaderLeft}>
          <ThemedText style={styles.offerNumber}>
            #{offer.no || offer.number}
          </ThemedText>
          {offer.internalFirm && (
            <View style={styles.internalFirmChip}>
              <ThemedText style={styles.internalFirmText}>
                {offer.internalFirm}
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.offerDate}>
          {formatDate(offer.saleDate)}
        </ThemedText>
      </View>

      <ThemedText style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">
        {offer.company}
      </ThemedText>

      {offer.brand && (
        <ThemedText style={{ fontSize: fontSize.small, color: colors.textLight, marginBottom: 4 }}>
          {offer.brand}
        </ThemedText>
      )}

      {offer.description && (
        <ThemedText style={styles.offerDescription} numberOfLines={2}>
          {offer.description}
        </ThemedText>
      )}

      <View style={styles.sellerInfo}>
        <ThemedText style={styles.sellerText}>
          Satış: {offer.sellerName || 'Belirtilmemiş'}
        </ThemedText>
      </View>

      <View style={styles.offerFooter}>
        <ThemedText style={styles.offerAmount}>
          {formatCurrency(offer.grandTotal || offer.total || 0, 'tl')} / {formatCurrency(offer.saasTotal || 0, 'tl')}
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

