import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { BankTransactionFilters, TBankAccount, TBankTransactions, TErpStatus } from '../../../types/bank.types';
import { useAuthStore } from '../../auth';
import { httpClient } from '../services/httpClient';
import { MongoGetParams } from '../types/mongo';
import { useBaseQuery } from './useBaseQuery';
import { useSocket } from './useSocket';

// Query keys
const BANK_QUERY_KEYS = {
  all: ['bank'] as const,
  transactions: () => [...BANK_QUERY_KEYS.all, 'transactions'] as const,
  transactionsList: (filters?: BankTransactionFilters) => [...BANK_QUERY_KEYS.transactions(), 'list', filters] as const,
  transaction: (id: string) => [...BANK_QUERY_KEYS.transactions(), id] as const,
  accounts: () => [...BANK_QUERY_KEYS.all, 'accounts'] as const,
  accountsList: () => [...BANK_QUERY_KEYS.accounts(), 'list'] as const,
};

// Database configuration
const BANK_DATABASE = 'kerzz-contract';
const BANK_TRANSACTIONS_COLLECTION = 'bank-transactions';

/**
 * Bank Transactions Query Hook
 * Data-layer pattern ile React Query kullanarak banka işlemlerini yönetir
 */
export function useBankTransactionsQuery() {
  const authStore = useAuthStore();
  const queryClient = useQueryClient();

  // Base query hook'u kullan
  const baseQuery = useBaseQuery<TBankTransactions>(
    {
      database: BANK_DATABASE,
      collection: BANK_TRANSACTIONS_COLLECTION,
      httpClient,
      authStore,
    },
    BANK_QUERY_KEYS.transactions()
  );

  // Socket integration
  const socket = useSocket({
    autoConnect: true,
    database: BANK_DATABASE,
    collection: BANK_TRANSACTIONS_COLLECTION,
    serviceName: 'useBankTransactionsQuery'
  });

  // Socket updates'i dinle ve cache'i güncelle
  socket.onSocketUpdate((socketData) => {
    console.group('🏦 Bank Transactions Socket Update');
    console.log('Operation:', socketData.operationType);
    console.log('Document ID:', socketData.documentKey?.id);
    
    switch (socketData.operationType) {
      case 'insert':
        if (socketData.fullDocument) {
          console.log('✅ Yeni banka işlemi eklendi:', socketData.fullDocument);
          
          // Cache'e yeni item ekle
          queryClient.setQueryData(
            BANK_QUERY_KEYS.transactionsList(),
            (old: TBankTransactions[] | undefined) => 
              old ? [socketData.fullDocument!, ...old] : [socketData.fullDocument!]
          );
          
          // Tüm liste query'lerini invalidate et
          queryClient.invalidateQueries({ 
            queryKey: BANK_QUERY_KEYS.transactions(),
            exact: false 
          });
        }
        break;
        
      case 'update':
        if (socketData.documentKey?.id && socketData.updateDescription?.updatedFields) {
          console.log('📝 Banka işlemi güncellendi:', socketData.updateDescription.updatedFields);
          
          const updatedFields = socketData.updateDescription.updatedFields;
          
          // Specific item cache'ini güncelle
          queryClient.setQueryData(
            BANK_QUERY_KEYS.transaction(socketData.documentKey.id),
            (old: TBankTransactions | undefined) => 
              old ? { ...old, ...updatedFields } : undefined
          );
          
          // Liste cache'lerini güncelle
          queryClient.setQueriesData(
            { queryKey: BANK_QUERY_KEYS.transactions(), exact: false },
            (old: TBankTransactions[] | undefined) =>
              old ? old.map(item => 
                item.id === socketData.documentKey!.id 
                  ? { ...item, ...updatedFields }
                  : item
              ) : undefined
          );
        }
        break;
        
      case 'delete':
        if (socketData.documentKey?.id) {
          console.log('🗑️ Banka işlemi silindi:', socketData.documentKey.id);
          
          // Cache'den sil
          queryClient.removeQueries({ 
            queryKey: BANK_QUERY_KEYS.transaction(socketData.documentKey.id) 
          });
          
          // Liste cache'lerinden sil
          queryClient.setQueriesData(
            { queryKey: BANK_QUERY_KEYS.transactions(), exact: false },
            (old: TBankTransactions[] | undefined) =>
              old ? old.filter(item => item.id !== socketData.documentKey!.id) : undefined
          );
        }
        break;
    }
    
    console.groupEnd();
  });

  // Filtered transactions query
  const useTransactionsList = useCallback((
    filters?: BankTransactionFilters,
    options?: Omit<UseQueryOptions<TBankTransactions[], Error>, 'queryKey' | 'queryFn'>
  ) => {
    const mongoParams = useMemo((): Partial<MongoGetParams> => {
      const params: Partial<MongoGetParams> = {
        filter: {},
        sort: { createDate: -1 }, // En yeni işlemler önce
      };

      // Filters'ı MongoDB query'sine çevir
      if (filters) {
        const mongoFilter: any = {};

        // Status filter
        if (filters.status) {
          mongoFilter.erpStatus = filters.status;
        }

        // Date range filter
        if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
          mongoFilter.businessDate = {};
          if (filters.dateRange.startDate) {
            mongoFilter.businessDate.$gte = filters.dateRange.startDate;
          }
          if (filters.dateRange.endDate) {
            mongoFilter.businessDate.$lte = filters.dateRange.endDate;
          }
        }

        // Bank account filter
        if (filters.bankAccId) {
          mongoFilter.bankAccId = filters.bankAccId;
        }

        // Transaction type filter (giriş/çıkış)
        if (filters.transactionType) {
          if (filters.transactionType === 'inflow') {
            mongoFilter.amount = { $gt: 0 };
          } else if (filters.transactionType === 'outflow') {
            mongoFilter.amount = { $lt: 0 };
          }
          // 'all' için filtre eklenmez
        }

        // Search text filter (MongoDB text search veya regex)
        if (filters.searchText) {
          const searchRegex = { $regex: filters.searchText, $options: 'i' };
          mongoFilter.$or = [
            { name: searchRegex },
            { description: searchRegex },
            { bankAccName: searchRegex }
          ];
        }

        params.filter = mongoFilter;
      }

      return params;
    }, [filters]);

    return baseQuery.useList(mongoParams, {
      staleTime: 2 * 60 * 1000, // 2 dakika (banka işlemleri için daha kısa)
      gcTime: 5 * 60 * 1000, // 5 dakika
      ...options,
    });
  }, [baseQuery]);

  // Single transaction query
  const useTransaction = useCallback((
    id: string,
    options?: Omit<UseQueryOptions<TBankTransactions | null, Error>, 'queryKey' | 'queryFn'>
  ) => {
    return baseQuery.useOne(id, options);
  }, [baseQuery]);

  // Update transaction status mutation
  const useUpdateTransactionStatus = useCallback(() => {
    return useMutation({
      mutationFn: async ({ id, status }: { id: string; status: TErpStatus }) => {
        return baseQuery.updateItem(id, { erpStatus: status });
      },
      onSuccess: (updatedTransaction, { id, status }) => {
        console.log(`✅ Transaction status updated: ${id} -> ${status}`);
        
        // Cache'i güncelle
        queryClient.setQueryData(
          BANK_QUERY_KEYS.transaction(id),
          updatedTransaction
        );
        
        // Liste cache'lerini güncelle
        queryClient.setQueriesData(
          { queryKey: BANK_QUERY_KEYS.transactions(), exact: false },
          (old: TBankTransactions[] | undefined) =>
            old ? old.map(item => 
              item.id === id ? updatedTransaction : item
            ) : undefined
        );
      },
      onError: (error, { id, status }) => {
        console.error(`❌ Failed to update transaction status: ${id} -> ${status}`, error);
      },
    });
  }, [baseQuery, queryClient]);

  // Update transaction mutation
  const useUpdateTransaction = useCallback(() => {
    return baseQuery.useUpdate({
      onSuccess: (updatedTransaction, { id }) => {
        console.log(`✅ Transaction updated: ${id}`);
      },
      onError: (error, { id }) => {
        console.error(`❌ Failed to update transaction: ${id}`, error);
      },
    });
  }, [baseQuery]);

  // Bank accounts query (separate collection)
  const useBankAccounts = useCallback((
    options?: Omit<UseQueryOptions<TBankAccount[], Error>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery({
      queryKey: BANK_QUERY_KEYS.accountsList(),
      queryFn: async (): Promise<TBankAccount[]> => {
        try {
          // Bu endpoint'i gerçek API'ye göre ayarlayın
          const response = await httpClient.post<TBankAccount[]>(
            'https://smarty.kerzz.com:4004/erp/getErpBankMaps',
            {}
          );
          return response || [];
        } catch (error) {
          console.error('Failed to fetch bank accounts:', error);
          return [];
        }
      },
      staleTime: 10 * 60 * 1000, // 10 dakika (banka hesapları daha az değişir)
      gcTime: 30 * 60 * 1000, // 30 dakika
      retry: 2,
      ...options,
    });
  }, []);

  // Utility functions
  const invalidateTransactions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BANK_QUERY_KEYS.transactions() });
  }, [queryClient]);

  const invalidateTransaction = useCallback((id: string) => {
    queryClient.invalidateQueries({ queryKey: BANK_QUERY_KEYS.transaction(id) });
  }, [queryClient]);

  const invalidateBankAccounts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BANK_QUERY_KEYS.accounts() });
  }, [queryClient]);

  // Prefetch functions
  const prefetchTransaction = useCallback((id: string) => {
    return queryClient.prefetchQuery({
      queryKey: BANK_QUERY_KEYS.transaction(id),
      queryFn: () => baseQuery.fetchOne(id),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, baseQuery]);

  return {
    // Query hooks
    useTransactionsList,
    useTransaction,
    useBankAccounts,
    
    // Mutation hooks
    useUpdateTransactionStatus,
    useUpdateTransaction,
    
    // Utility functions
    invalidateTransactions,
    invalidateTransaction,
    invalidateBankAccounts,
    prefetchTransaction,
    
    // Socket state
    socketState: socket.socketState,
    isSocketConnected: socket.isConnected,
    
    // Query keys (for advanced usage)
    queryKeys: BANK_QUERY_KEYS,
  };
}
