import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  BankFilters,
  BankSummaryCard,
  BankTransactionCard
} from '../../components/bank';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useBankTransactionsQuery } from '../../modules/data-layer/hooks';
import { useStyles } from '../../modules/theme';
import {
  bankIntegrationService,
  useBankStore
} from '../../services/bankIntegrationService';
import {
  BankTransactionFilters,
  TBankTransactions,
  TErpStatus
} from '../../types/bank.types';

export default function BankTransactionsScreen() {
  const { colors, spacing, fontSize } = useStyles();
  const [refreshing, setRefreshing] = useState(false);
  const { scrollToTransactionId, timestamp } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  // Data-layer hooks
  const bankQuery = useBankTransactionsQuery();
  
  // Zustand store (sadece UI state için)
  const { filters, setFilters } = useBankStore();

  // React Query hooks
  const { 
    data: transactions = [], 
    isLoading, 
    isError, 
    error,
    refetch 
  } = bankQuery.useTransactionsList(filters, {
    enabled: true,
  });

  const { 
    data: bankAccounts = []
  } = bankQuery.useBankAccounts();

  const updateStatusMutation = bankQuery.useUpdateTransactionStatus();

  // Initialize default filters on screen focus
  useFocusEffect(
    useCallback(() => {
      // Set default filters if not already set
      if (!filters.dateRange?.startDate && !filters.dateRange?.endDate) {
        const defaultDateRange = bankIntegrationService.getDefaultDateRange();
        setFilters({
          ...filters,
          dateRange: defaultDateRange,
          transactionType: 'all'
        });
      }
      return () => {
        // Cleanup if needed
      };
    }, [filters, setFilters])
  );

  // Scroll to specific transaction when data is loaded and scrollToTransactionId is provided
  const scrollToTransaction = useCallback((transactionId: string) => {
    if (!transactionId || transactions.length === 0 || isLoading) {
      return;
    }

    const targetIndex = transactions.findIndex(
      transaction => transaction.id === transactionId
    );
    
    if (targetIndex !== -1) {
      console.log('🎯 İlgili transaction bulundu, scroll yapılıyor:', {
        targetIndex,
        transactionId,
        foundTransaction: transactions[targetIndex]
      });
      
      // Kısa bir delay ile scroll yap (UI'ın render olması için)
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.2, // Transaction'ı ekranın üst %20'sinde göster
        });
        
        // Toast ile bilgilendirme
        Toast.show({
          type: 'info',
          text1: 'İşlem Bulundu',
          text2: 'İlgili banka işlemine yönlendirildiniz',
          visibilityTime: 3000,
        });
      }, 500);
    } else {
      console.log('⚠️ İlgili transaction bulunamadı:', {
        transactionId,
        transactionsCount: transactions.length,
        availableIds: transactions.map(t => ({ id: t.id })).slice(0, 5)
      });
      
      // Transaction bulunamadıysa bilgilendirme
      Toast.show({
        type: 'info',
        text1: 'İşlem Bulunamadı',
        text2: 'İlgili banka işlemi mevcut filtrelerde görünmüyor',
        visibilityTime: 4000,
      });
    }
  }, [transactions, isLoading]);

  // İlk yüklemede scroll parametresi varsa scroll yap
  useEffect(() => {
    if (scrollToTransactionId && transactions.length > 0 && !isLoading) {
      scrollToTransaction(scrollToTransactionId as string);
    }
  }, [scrollToTransactionId, transactions, isLoading, scrollToTransaction]);

  // Timestamp değiştiğinde scroll yap (replace ile gelen yeni parametreler için)
  useEffect(() => {
    if (timestamp && scrollToTransactionId && transactions.length > 0 && !isLoading) {
      console.log('🔄 Timestamp değişti, scroll tetikleniyor:', { timestamp, scrollToTransactionId });
      scrollToTransaction(scrollToTransactionId as string);
    }
  }, [timestamp, scrollToTransactionId, transactions, isLoading, scrollToTransaction]);

  // Navigation parametrelerinin değişimini dinle (sayfa zaten açıkken)
  useFocusEffect(
    useCallback(() => {
      // Sayfa focus olduğunda scroll parametresi varsa scroll yap
      if (scrollToTransactionId && transactions.length > 0 && !isLoading) {
        console.log('📍 Sayfa focus oldu, scroll parametresi mevcut:', scrollToTransactionId);
        scrollToTransaction(scrollToTransactionId as string);
      }
    }, [scrollToTransactionId, transactions, isLoading, scrollToTransaction])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Veriler güncellendi',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Veriler güncellenirken hata oluştu',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleFiltersChange = (newFilters: BankTransactionFilters) => {
    setFilters(newFilters);
    // React Query otomatik olarak yeni filtrelerle veri çekecek
  };

  const handleStatusChange = async (id: string, status: TErpStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'İşlem durumu güncellendi',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Durum güncellenirken hata oluştu',
      });
    }
  };

  const renderTransactionItem = ({ item }: { item: TBankTransactions }) => (
    <BankTransactionCard
      transaction={item}
      onStatusChange={handleStatusChange}
    />
  );

  const renderHeader = () => (
    <>
      <BankFilters
        filters={filters}
        bankAccounts={bankAccounts}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
      />
      <BankSummaryCard
        transactions={transactions}
        bankAccounts={bankAccounts}
      />
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>
        {isLoading ? 'Yükleniyor...' : 'Seçilen kriterlere uygun işlem bulunamadı'}
      </ThemedText>
      {!isLoading && (
        <ThemedText style={styles.emptySubText}>
          Farklı filtreler deneyebilir veya tarih aralığını değiştirebilirsiniz
        </ThemedText>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Yükleniyor...</ThemedText>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.large,
      paddingVertical: spacing.xlarge,
    },
    emptyText: {
      fontSize: fontSize.large,
      textAlign: 'center',
      color: colors.textLight,
      marginBottom: spacing.small,
    },
    emptySubText: {
      fontSize: fontSize.medium,
      textAlign: 'center',
      color: colors.textLight,
      opacity: 0.7,
    },
    loadingFooter: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.medium,
    },
    loadingText: {
      marginLeft: spacing.small,
      color: colors.textLight,
    },
    errorContainer: {
      backgroundColor: colors.error + '20',
      padding: spacing.medium,
      margin: spacing.medium,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.error + '40',
    },
    errorText: {
      color: colors.error,
      fontSize: fontSize.medium,
      textAlign: 'center',
    },
    initialLoadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    initialLoadingText: {
      marginTop: spacing.medium,
      fontSize: fontSize.large,
      color: colors.textLight,
    },
  });

  // Show error state
  if (isError) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'Bir hata oluştu'}
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          transactions.length === 0 ? { flex: 1 } : undefined
        }
        onScrollToIndexFailed={(info) => {
          console.log('⚠️ ScrollToIndex başarısız:', info);
          // Fallback: En yakın index'e scroll yap
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ 
              index: Math.min(info.index, transactions.length - 1), 
              animated: true 
            });
          });
        }}
      />
      <Toast />
    </ThemedView>
  );
}
