import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { TCustomer } from '../../types/customer.types';
import { ThemedText } from '../themed-text';

interface CustomerCardProps {
  customer: TCustomer;
  onPress?: (customer: TCustomer) => void;
}

export const CustomerCard = React.memo(function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const { colors, spacing, fontSize } = useStyles();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      marginHorizontal: spacing.medium,
      marginTop: spacing.small,
      marginBottom: spacing.small,
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.small,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
    },
    number: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.primary,
    },
    erpBadge: {
      paddingHorizontal: spacing.small,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: (customer.erpId && customer.erpId !== '' ? colors.success : colors.warning) + '20',
      borderWidth: 1,
      borderColor: (customer.erpId && customer.erpId !== '' ? colors.success : colors.warning) + '40',
    },
    erpText: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: customer.erpId && customer.erpId !== '' ? colors.success : colors.warning,
    },
    name: {
      fontSize: fontSize.medium,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    brand: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    address: {
      fontSize: fontSize.small,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 3,
    },
    contact: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      marginBottom: 4,
    },
    contactText: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.small,
      paddingTop: spacing.small,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    segmentChip: {
      paddingHorizontal: spacing.small,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.secondary + '15',
      borderWidth: 1,
      borderColor: colors.secondary + '30',
    },
    segmentText: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.secondary,
    },
    statusText: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: customer.isActive ? colors.success : colors.warning,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(customer)} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.left}>
          <ThemedText style={styles.number}>#{customer.id || '—'}</ThemedText>
          <View style={styles.erpBadge}>
            <ThemedText style={styles.erpText}>
              {customer.erpId && customer.erpId !== '' ? 'Müşteri' : 'Potansiyel'}
            </ThemedText>
          </View>
        </View>
        {/* sağ üst köşe boş */}
      </View>

      <ThemedText style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {customer.name || 'İsim yok'}
      </ThemedText>

      {!!customer.brand && (
        <ThemedText style={styles.brand} numberOfLines={1} ellipsizeMode="tail">
          {customer.brand}
        </ThemedText>
      )}

      <ThemedText style={styles.address} numberOfLines={1} ellipsizeMode="tail">
        {customer.address?.city && customer.address?.district
          ? `${customer.address.city} / ${customer.address.district}`
          : 'Adres bilgisi yok'}
      </ThemedText>

      {(customer.phone || customer.email) && (
        <View style={styles.contact}>
          <ThemedText style={styles.contactText} numberOfLines={1} ellipsizeMode="tail">
            {customer.phone && `${customer.phone}`}
            {customer.phone && customer.email && ' • '}
            {customer.email && `${customer.email}`}
          </ThemedText>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.segmentChip}>
          <ThemedText style={styles.segmentText}>
            {customer.segment || 'standart'}
          </ThemedText>
        </View>
        <ThemedText style={styles.statusText}>
          {customer.isActive ? 'Aktif' : 'Pasif'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
});


