import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { TSale } from '../../types/dto';

interface SalesToolbarProps {
  sale: TSale;
  onApprove?: (sale: TSale) => void;
  onInvoiceApprove?: (sale: TSale) => void;
  onViewDetails?: (sale: TSale) => void;
  isApprovingLoading?: boolean;
  isInvoiceApprovingLoading?: boolean;
}

export function SalesToolbar({ 
  sale, 
  onApprove, 
  onInvoiceApprove, 
  onViewDetails,
  isApprovingLoading, 
  isInvoiceApprovingLoading 
}: SalesToolbarProps) {
  const { colors, spacing } = useStyles();

  const styles = StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: spacing.medium,
      marginTop: spacing.small,
      marginBottom: spacing.small / 2,
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.medium,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border + '40',
      borderRadius: 12,
      gap: spacing.medium,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
    },
    toggleButtonActive: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    toggleButtonInactive: {
      backgroundColor: 'transparent',
      borderColor: colors.border + '60',
    },
    iconContainer: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonLabel: {
      fontSize: 10,
      marginTop: 4,
      textAlign: 'center',
    },
    buttonLabelActive: {
      color: colors.success,
      fontWeight: '600',
    },
    buttonLabelInactive: {
      color: colors.textLight,
      fontWeight: '400',
    },
  });

  // Check Icon Component
  const CheckIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
    <MaterialIcons name="check" size={size} color={color} />
  );

  // Invoice Icon Component  
  const InvoiceIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
    <MaterialIcons name="receipt" size={size} color={color} />
  );

  // Detail Icon Component  
  const DetailIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
    <MaterialIcons name="visibility" size={size} color={color} />
  );

  return (
    <View style={styles.toolbar}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            sale.approved ? styles.toggleButtonActive : styles.toggleButtonInactive,
          ]}
          onPress={() => onApprove?.(sale)}
          activeOpacity={0.7}
          disabled={isApprovingLoading || isInvoiceApprovingLoading}
        >
          <View style={styles.iconContainer}>
            {isApprovingLoading ? (
              <ActivityIndicator 
                size="small" 
                color={sale.approved ? '#FFFFFF' : colors.primary} 
              />
            ) : (
              <CheckIcon 
                color={sale.approved ? '#FFFFFF' : colors.textLight} 
                size={20}
              />
            )}
          </View>
        </TouchableOpacity>
        <Text style={[
          styles.buttonLabel,
          sale.approved ? styles.buttonLabelActive : styles.buttonLabelInactive
        ]}>
          Onayla
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            sale.invoiceApproved ? styles.toggleButtonActive : styles.toggleButtonInactive,
          ]}
          onPress={() => onInvoiceApprove?.(sale)}
          activeOpacity={0.7}
          disabled={isApprovingLoading || isInvoiceApprovingLoading}
        >
          <View style={styles.iconContainer}>
            {isInvoiceApprovingLoading ? (
              <ActivityIndicator 
                size="small" 
                color={sale.invoiceApproved ? '#FFFFFF' : colors.primary} 
              />
            ) : (
              <InvoiceIcon 
                color={sale.invoiceApproved ? '#FFFFFF' : colors.textLight} 
                size={20}
              />
            )}
          </View>
        </TouchableOpacity>
        <Text style={[
          styles.buttonLabel,
          sale.invoiceApproved ? styles.buttonLabelActive : styles.buttonLabelInactive
        ]}>
          Fatura
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonInactive,
            { borderColor: colors.primary + '60' }
          ]}
          onPress={() => onViewDetails?.(sale)}
          activeOpacity={0.7}
          disabled={isApprovingLoading || isInvoiceApprovingLoading}
        >
          <View style={styles.iconContainer}>
            <DetailIcon 
              color={colors.primary} 
              size={20}
            />
          </View>
        </TouchableOpacity>
        <Text style={[
          styles.buttonLabel,
          { color: colors.primary, fontWeight: '600' }
        ]}>
          Detay
        </Text>
      </View>
    </View>
  );
}
