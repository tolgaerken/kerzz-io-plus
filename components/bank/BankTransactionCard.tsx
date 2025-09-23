import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { TBankTransactions, TErpStatus } from '../../types/bank.types';

interface BankTransactionCardProps {
  transaction: TBankTransactions;
  onStatusChange?: (id: string, status: TErpStatus) => void;
  onPress?: () => void;
}

export const BankTransactionCard: React.FC<BankTransactionCardProps> = ({
  transaction,
  onStatusChange,
  onPress
}) => {
  const { colors, spacing, fontSize, card } = useStyles();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to detail screen
      router.push({
        pathname: '/(drawer)/bank-transaction-detail',
        params: { transactionData: JSON.stringify(transaction) }
      });
    }
  };

  const handleStatusChange = (status: TErpStatus) => {
    if (onStatusChange && transaction.erpStatus !== 'success') {
      onStatusChange(transaction.id, status);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: TErpStatus) => {
    switch (status) {
      case 'success': return colors.success;
      case 'error': return colors.error;
      case 'manual': return colors.warning;
      case 'waiting': return colors.textLight;
      default: return colors.textLight;
    }
  };

  const getStatusText = (status: TErpStatus) => {
    switch (status) {
      case 'success': return 'İşlendi';
      case 'error': return 'Hatalı';
      case 'manual': return 'Manuel';
      case 'waiting': return 'Bekliyor';
      default: return 'Bilinmiyor';
    }
  };

  const isInflow = transaction.amount > 0;

  const styles = StyleSheet.create({
    container: {
      ...card.default,
      marginHorizontal: spacing.medium,
      marginVertical: spacing.small,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.small,
    },
    bankInfo: {
      flex: 1,
      marginRight: spacing.small,
    },
    bankName: {
      fontSize: fontSize.medium,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    transactionDate: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    amountContainer: {
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: isInflow ? colors.success : colors.error,
    },
    balance: {
      fontSize: fontSize.small,
      color: colors.textLight,
      marginTop: 2,
    },
    content: {
      marginBottom: spacing.small,
    },
    name: {
      fontSize: fontSize.medium,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: fontSize.small,
      color: colors.textLight,
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.small,
      borderTopWidth: 1,
      borderTopColor: colors.border + '40',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.tiny,
    },
    statusText: {
      fontSize: fontSize.small,
      fontWeight: '500',
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: spacing.tiny,
      marginLeft: spacing.small,
      borderRadius: 4,
    },
    ibanContainer: {
      marginTop: spacing.tiny,
    },
    iban: {
      fontSize: fontSize.tiny,
      color: colors.textLight,
      fontFamily: 'monospace',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.bankInfo}>
          <Text style={styles.bankName}>{transaction.bankAccName}</Text>
          <Text style={styles.transactionDate}>
            {formatDate(transaction.createDate)}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {formatCurrency(transaction.amount)}
          </Text>
          <Text style={styles.balance}>
            Bakiye: {formatCurrency(transaction.balance)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {transaction.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {transaction.description}
        </Text>
        {transaction.opponentIban && transaction.opponentIban !== '0' && (
          <View style={styles.ibanContainer}>
            <Text style={styles.iban}>
              IBAN: {transaction.opponentIban}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusDot, 
              { backgroundColor: getStatusColor(transaction.erpStatus) }
            ]} 
          />
          <Text 
            style={[
              styles.statusText, 
              { color: getStatusColor(transaction.erpStatus) }
            ]}
          >
            {getStatusText(transaction.erpStatus)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {transaction.erpStatus !== 'success' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusChange('manual')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={colors.success} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusChange('waiting')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons 
                  name="refresh" 
                  size={20} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons 
              name="arrow-forward-ios" 
              size={16} 
              color={colors.textLight} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default BankTransactionCard;
