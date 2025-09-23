import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { BankSummary, TBankAccount, TBankTransactions } from '../../types/bank.types';

interface BankSummaryCardProps {
  transactions: TBankTransactions[];
  bankAccounts: TBankAccount[];
  title?: string;
}

export const BankSummaryCard: React.FC<BankSummaryCardProps> = ({
  transactions,
  bankAccounts,
  title = 'Banka Özeti'
}) => {
  const { colors, spacing, fontSize, card } = useStyles();

  const summaryData = useMemo(() => {
    // Genel toplamlar
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalBalance = 0;

    // Banka bazında özetler
    const bankSummaries = new Map<string, BankSummary>();

    transactions.forEach(transaction => {
      // Genel toplamlar
      if (transaction.amount > 0) {
        totalInflow += transaction.amount;
      } else {
        totalOutflow += Math.abs(transaction.amount);
      }
      totalBalance += transaction.amount;

      // Banka bazında toplamlar
      if (!bankSummaries.has(transaction.bankAccId)) {
        const bankAccount = bankAccounts.find(acc => acc.bankAccId === transaction.bankAccId);
        bankSummaries.set(transaction.bankAccId, {
          bankAccId: transaction.bankAccId,
          bankAccName: bankAccount?.bankAccName || transaction.bankAccName,
          inflow: 0,
          outflow: 0,
          balance: 0
        });
      }

      const summary = bankSummaries.get(transaction.bankAccId)!;
      if (transaction.amount > 0) {
        summary.inflow += transaction.amount;
      } else {
        summary.outflow += Math.abs(transaction.amount);
      }
      summary.balance += transaction.amount;
    });

    return {
      totalInflow,
      totalOutflow,
      totalBalance,
      bankSummaries: Array.from(bankSummaries.values()),
      transactionCount: transactions.length
    };
  }, [transactions, bankAccounts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const styles = StyleSheet.create({
    container: {
      ...card.default,
      marginHorizontal: spacing.medium,
      marginVertical: spacing.small,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.medium,
      paddingBottom: spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
    },
    title: {
      fontSize: fontSize.large,
      fontWeight: '600',
      color: colors.text,
    },
    transactionCount: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    totalsContainer: {
      marginBottom: spacing.medium,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.tiny,
    },
    totalLabel: {
      fontSize: fontSize.medium,
      color: colors.text,
      fontWeight: '500',
    },
    totalAmount: {
      fontSize: fontSize.medium,
      fontWeight: '600',
    },
    inflowAmount: {
      color: colors.success,
    },
    outflowAmount: {
      color: colors.error,
    },
    balanceAmount: {
      color: colors.text,
    },
    netBalanceRow: {
      paddingTop: spacing.small,
      borderTopWidth: 1,
      borderTopColor: colors.border + '40',
    },
    netBalanceAmount: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
    },
    bankSummariesContainer: {
      marginTop: spacing.small,
    },
    bankSummariesTitle: {
      fontSize: fontSize.medium,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.small,
    },
    bankSummaryCard: {
      backgroundColor: colors.cardAlt,
      borderRadius: 8,
      padding: spacing.small,
      marginBottom: spacing.small,
      borderWidth: 1,
      borderColor: colors.border + '20',
    },
    bankName: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.tiny,
    },
    bankAmountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 1,
    },
    bankAmountLabel: {
      fontSize: fontSize.tiny,
      color: colors.textLight,
    },
    bankAmount: {
      fontSize: fontSize.tiny,
      fontWeight: '500',
    },
    noDataText: {
      textAlign: 'center',
      color: colors.textLight,
      fontSize: fontSize.medium,
      fontStyle: 'italic',
      paddingVertical: spacing.large,
    },
  });

  if (summaryData.transactionCount === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>
          Seçilen kriterlere uygun işlem bulunamadı
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.transactionCount}>
          {summaryData.transactionCount} işlem
        </Text>
      </View>

      {/* Genel Toplamlar */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Toplam Giren:</Text>
          <Text style={[styles.totalAmount, styles.inflowAmount]}>
            {formatCurrency(summaryData.totalInflow)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Toplam Çıkan:</Text>
          <Text style={[styles.totalAmount, styles.outflowAmount]}>
            {formatCurrency(summaryData.totalOutflow)}
          </Text>
        </View>

        <View style={[styles.totalRow, styles.netBalanceRow]}>
          <Text style={styles.totalLabel}>Net Bakiye:</Text>
          <Text 
            style={[
              styles.totalAmount, 
              styles.netBalanceAmount,
              summaryData.totalBalance >= 0 ? styles.inflowAmount : styles.outflowAmount
            ]}
          >
            {formatCurrency(summaryData.totalBalance)}
          </Text>
        </View>
      </View>

      {/* Banka Bazında Özetler */}
      {summaryData.bankSummaries.length > 0 && (
        <View style={styles.bankSummariesContainer}>
          <Text style={styles.bankSummariesTitle}>Banka Detayları</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: spacing.medium }}
          >
            {summaryData.bankSummaries.map((bankSummary) => (
              <View key={bankSummary.bankAccId} style={styles.bankSummaryCard}>
                <Text style={styles.bankName} numberOfLines={1}>
                  {bankSummary.bankAccName}
                </Text>
                
                <View style={styles.bankAmountRow}>
                  <Text style={styles.bankAmountLabel}>Giren:</Text>
                  <Text style={[styles.bankAmount, styles.inflowAmount]}>
                    {formatCurrency(bankSummary.inflow)}
                  </Text>
                </View>

                <View style={styles.bankAmountRow}>
                  <Text style={styles.bankAmountLabel}>Çıkan:</Text>
                  <Text style={[styles.bankAmount, styles.outflowAmount]}>
                    {formatCurrency(bankSummary.outflow)}
                  </Text>
                </View>

                <View style={styles.bankAmountRow}>
                  <Text style={styles.bankAmountLabel}>Bakiye:</Text>
                  <Text 
                    style={[
                      styles.bankAmount,
                      bankSummary.balance >= 0 ? styles.inflowAmount : styles.outflowAmount
                    ]}
                  >
                    {formatCurrency(bankSummary.balance)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default BankSummaryCard;
