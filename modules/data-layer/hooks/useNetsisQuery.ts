/**
 * Netsis SQL Query Hooks
 * TanStack Query ile Netsis ERP verilerini yönetir
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { createNetsisSqlService, NetsisSqlService } from '../../../services/netsisSqlService';
import {
    TErpBalanceList,
    TNetsisAccount,
    TNetsisDocumentDetail,
    TNetsisInvoice,
    TNetsisMuhPivot,
    TNetsisStockBalance,
    TNetsisTransaction,
} from '../../../types/netsis.types';
import { useAuthStore } from '../../auth';

// Netsis SQL servis URL'i - environment'tan al
const NETSIS_SQL_URL = process.env.EXPO_PUBLIC_NETSIS_SQL_URL || 'https://socketio.kerzz.com:1443';

/**
 * Netsis servisini al
 */
function useNetsisService(): NetsisSqlService {
  const authStore = useAuthStore();
  const token = authStore.userInfo?.token;
  
  return useMemo(() => {
    return createNetsisSqlService(NETSIS_SQL_URL, undefined, token);
  }, [token]);
}

/**
 * Faturaları getir
 */
export function useNetsisInvoices(
  year: string | number,
  company: string,
  options?: Omit<UseQueryOptions<TNetsisInvoice[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'invoices', year, company],
    queryFn: () => service.getInvoices(year, company),
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Cari hesapları getir
 */
export function useNetsisAccounts(
  year: string | number,
  company: string,
  options?: Omit<UseQueryOptions<TNetsisAccount[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'accounts', year, company],
    queryFn: () => service.getAccounts(year, company),
    staleTime: 10 * 60 * 1000, // 10 dakika - hesaplar sık değişmez
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Cari hareketleri getir
 */
export function useNetsisTransactions(
  accountId: string,
  year: string | number,
  company: string,
  options?: Omit<UseQueryOptions<TNetsisTransaction[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'transactions', accountId, year, company],
    queryFn: () => service.getTransactions(accountId, year, company),
    enabled: !!accountId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Muhasebe hareketleri getir
 */
export function useNetsisMuhTransactions(
  accountId: string,
  year: string | number,
  company: string,
  options?: Omit<UseQueryOptions<TNetsisTransaction[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'muh-transactions', accountId, year, company],
    queryFn: () => service.getMuhTransactions(accountId, year, company),
    enabled: !!accountId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hesap bakiyesi getir
 */
export function useNetsisBalance(
  accountId: string,
  year: string | number,
  company: string,
  options?: Omit<UseQueryOptions<number, Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'balance', accountId, year, company],
    queryFn: () => service.getBalance(accountId, year, company),
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Tüm hesap bakiyelerini getir
 */
export function useNetsisAllBalances(
  year: string | number,
  company: string,
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'all-balances', year, company],
    queryFn: () => service.getAllBalances(year, company),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...options,
  });
}

/**
 * Belge detayı getir
 */
export function useNetsisDocumentDetail(
  year: string | number,
  documentId: string,
  company: string,
  options?: Omit<UseQueryOptions<TNetsisDocumentDetail[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'document-detail', year, documentId, company],
    queryFn: () => service.getDocumentDetail(year, documentId, company),
    enabled: !!documentId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Cari borç yaşlandırma
 */
export function useNetsisCariBorcYas(
  year: string | number,
  company: string,
  options?: Omit<UseQueryOptions<TErpBalanceList[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'cari-borc-yas', year, company],
    queryFn: () => service.getCariBorcYas(year, company),
    staleTime: 15 * 60 * 1000, // 15 dakika
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Stok listesi getir
 */
export function useNetsisStocks(
  company: string = 'VERI2022',
  options?: Omit<UseQueryOptions<TNetsisStockBalance[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'stocks', company],
    queryFn: () => service.getStocks(company),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Muhasebe pivot - Gider hesapları
 */
export function useNetsisMuhPivotOutcome(
  company: string,
  options?: Omit<UseQueryOptions<TNetsisMuhPivot[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'muh-pivot-outcome', company],
    queryFn: () => service.getMuhPivotOutcome(company),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Muhasebe pivot - Tüm hesaplar
 */
export function useNetsisMuhPivot(
  company: string,
  options?: Omit<UseQueryOptions<TNetsisMuhPivot[], Error>, 'queryKey' | 'queryFn'>
) {
  const service = useNetsisService();

  return useQuery({
    queryKey: ['netsis', 'muh-pivot', company],
    queryFn: () => service.getMuhPivot(company),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}

/**
 * Birleştirilmiş hook - Hesap bilgisi + Bakiye + Hareketler
 */
export function useNetsisAccountDetails(
  accountId: string,
  year: string | number,
  company: string
) {
  const accountsQuery = useNetsisAccounts(year, company);
  const balanceQuery = useNetsisBalance(accountId, year, company);
  const transactionsQuery = useNetsisTransactions(accountId, year, company);

  const account = useMemo(() => {
    return accountsQuery.data?.find(acc => acc.ID === accountId);
  }, [accountsQuery.data, accountId]);

  const isLoading = accountsQuery.isLoading || balanceQuery.isLoading || transactionsQuery.isLoading;
  const error = accountsQuery.error || balanceQuery.error || transactionsQuery.error;

  return {
    account,
    balance: balanceQuery.data ?? 0,
    transactions: transactionsQuery.data ?? [],
    isLoading,
    error,
    refetch: useCallback(async () => {
      await Promise.all([
        accountsQuery.refetch(),
        balanceQuery.refetch(),
        transactionsQuery.refetch(),
      ]);
    }, [accountsQuery, balanceQuery, transactionsQuery]),
  };
}

/**
 * Cache invalidation helpers
 */
export function useNetsisInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateInvoices: (year?: string | number, company?: string) => {
      if (year && company) {
        queryClient.invalidateQueries({ queryKey: ['netsis', 'invoices', year, company] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['netsis', 'invoices'] });
      }
    },
    invalidateAccounts: (year?: string | number, company?: string) => {
      if (year && company) {
        queryClient.invalidateQueries({ queryKey: ['netsis', 'accounts', year, company] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['netsis', 'accounts'] });
      }
    },
    invalidateTransactions: (accountId?: string) => {
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: ['netsis', 'transactions', accountId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['netsis', 'transactions'] });
      }
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['netsis'] });
    },
  };
}

