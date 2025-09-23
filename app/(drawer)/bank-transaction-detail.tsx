import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useStyles } from '../../modules/theme';
import { TBankTransactions } from '../../types/bank.types';

export default function BankTransactionDetailScreen() {
  const { transactionData } = useLocalSearchParams();
  const data: TBankTransactions | null = useMemo(() => {
    try {
      return transactionData ? JSON.parse(transactionData as string) : null;
    } catch {
      return null;
    }
  }, [transactionData]);
  const { colors, spacing, fontSize } = useStyles();

  const handleBack = useCallback(() => {
    router.push('/(drawer)/bank-transactions');
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    backButton: {
      padding: spacing.small,
      marginRight: spacing.small,
    },
    title: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.card,
      padding: spacing.medium,
      borderRadius: 12,
      margin: spacing.medium,
      borderWidth: 1,
      borderColor: colors.border + '40',
    },
    label: {
      fontSize: fontSize.small,
      color: colors.textLight,
      marginBottom: 4,
    },
    value: {
      fontSize: fontSize.medium,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.small,
    },
    code: {
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      fontSize: fontSize.small,
      color: colors.text,
    }
  });

  const renderRow = (label: string, value?: string | number) => (
    <View style={{ marginBottom: spacing.small }}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value ?? '-'}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Banka İşlemi Detayı</ThemedText>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          {renderRow('İşlem ID', data?.id)}
          {renderRow('Banka Hesabı', data?.bankAccName)}
          {renderRow('Banka', data?.bankName)}
          {renderRow('Tutar', data?.amount ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(data.amount) : '-')}
          {renderRow('Bakiye', data?.balance ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(data.balance) : '-')}
          {renderRow('Gönderen/Alıcı', data?.name)}
          {renderRow('Açıklama', data?.description)}
          {renderRow('İşlem Tarihi', data?.businessDate ? new Date(data.businessDate).toLocaleDateString('tr-TR') : '-')}
          {renderRow('Kayıt Tarihi', data?.createDate ? new Date(data.createDate).toLocaleDateString('tr-TR') : '-')}
          {renderRow('IBAN', data?.opponentIban && data.opponentIban !== '0' ? data.opponentIban : '-')}
          {renderRow('ERP Durumu', data?.erpStatus)}
          {renderRow('ERP Hesap Kodu', data?.erpAccountCode)}
          {renderRow('ERP GL Kodu', data?.erpGlAccountCode)}
        </View>
        <View style={styles.section}>
          <ThemedText style={styles.label}>Ham Veri</ThemedText>
          <ThemedText style={styles.code}>
            {JSON.stringify(data, null, 2)}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}



