import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CustomerSearchParams, TCustomer } from '../../../types/customer.types';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { useBaseQuery } from './useBaseQuery';

/**
 * Müşteri verilerini yönetmek için özel hook
 * kerzz-contract veritabanındaki customers koleksiyonunu kullanır
 */
export function useCustomerQuery() {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();

  // Base query hook'unu kerzz-contract.customers için yapılandır
  const baseQuery = useBaseQuery<TCustomer>(
    {
      database: 'kerzz-contract',
      collection: 'customers',
      httpClient,
      authStore,
    },
    ['customers'] // Query key base
  );

  // Virtual list için sadece kart görünümünde gerekli alanları çek
  const defaultProjection = {
    id: 1,
    name: 1,
    brand: 1,
    'address.city': 1,
    'address.district': 1,
    phone: 1,
    email: 1,
    erpId: 1,
    segment: 1,
    isActive: 1,
    no: 1,
    contractCount: 1,
    _id: 1,
  } as const;

  // Arama / filtreleme hook'u
  const useCustomerSearch = (searchParams?: CustomerSearchParams, options?: { enabled?: boolean }) => {
    const filter = useMemo(() => {
      if (!searchParams) return {};

      const mongoFilter: any = {};

      if (searchParams.name) {
        mongoFilter.name = { $regex: searchParams.name, $options: 'i' };
      }

      if (searchParams.taxNo) {
        mongoFilter.taxNo = { $regex: searchParams.taxNo, $options: 'i' };
      }

      if (searchParams.segment) {
        mongoFilter.segment = searchParams.segment;
      }

      if (searchParams.city) {
        mongoFilter['address.city'] = { $regex: searchParams.city, $options: 'i' };
      }

      if (searchParams.isActive !== undefined) {
        mongoFilter.isActive = searchParams.isActive;
      }

      return mongoFilter;
    }, [searchParams]);

    return baseQuery.useList(
      {
        filter,
        sort: { updatedAt: -1 },
        projection: defaultProjection,
      },
      {
        enabled: options?.enabled !== false,
      }
    );
  };

  // Detay için tam veri
  const useCustomerDetail = (customerId: string) => {
    return baseQuery.useOne(customerId, {
      enabled: !!customerId,
    });
  };

  // ERP'ye bağlı gerçek müşteriler (erpId dolu)
  const useRealCustomers = (options?: { enabled?: boolean }) => {
    const filter = useMemo(() => ({
      erpId: { $exists: true, $ne: '' },
    }), []);

    return baseQuery.useList(
      {
        filter,
        sort: { updatedAt: -1 },
        projection: defaultProjection,
      },
      {
        enabled: options?.enabled !== false,
      }
    );
  };

  // Potansiyel müşteriler (erpId yok veya boş)
  const usePotentialCustomers = (options?: { enabled?: boolean }) => {
    const filter = useMemo(() => ({
      $or: [
        { erpId: { $exists: false } },
        { erpId: '' },
      ],
    }), []);

    return baseQuery.useList(
      {
        filter,
        sort: { updatedAt: -1 },
        projection: defaultProjection,
      },
      {
        enabled: options?.enabled !== false,
      }
    );
  };

  // Basit istatistikler
  const useCustomerStats = (options?: { enabled?: boolean }) => {
    const allQuery = baseQuery.useList(
      {
        filter: {},
        projection: { erpId: 1, isActive: 1, segment: 1, _id: 1 },
      },
      {
        enabled: options?.enabled !== false,
      }
    );

    const stats = useMemo(() => {
      const items = allQuery.data || [];
      const realCount = items.filter(c => (c as any).erpId && (c as any).erpId !== '').length;
      const potentialCount = items.length - realCount;
      const activeCount = items.filter(c => (c as any).isActive).length;

      const segmentCounts = items.reduce((acc: Record<string, number>, c: any) => {
        const seg = c.segment || 'unknown';
        acc[seg] = (acc[seg] || 0) + 1;
        return acc;
      }, {});

      return {
        total: items.length,
        realCount,
        potentialCount,
        activeCount,
        segmentCounts,
      };
    }, [allQuery.data]);

    return {
      ...allQuery,
      stats: options?.enabled === false ? null : stats,
    } as const;
  };

  // (İsteğe bağlı) Optimistic update örneği
  const queryClient = useQueryClient();
  const baseQueryKey = ['customers'];

  const useOptimisticUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TCustomer> }) => baseQuery.updateItem(id, data),
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: baseQueryKey });

        const allQueries = queryClient.getQueryCache().findAll({ queryKey: baseQueryKey });
        const previousData: any = {};

        allQueries.forEach((query) => {
          const qk = query.queryKey;
          const currentData = queryClient.getQueryData(qk);

          if (Array.isArray(currentData)) {
            previousData[qk.join('|')] = currentData;

            queryClient.setQueryData(qk, (old: TCustomer[] | undefined) =>
              old ? old.map(item => (item.id === id ? { ...item, ...data } as TCustomer : item)) : []
            );
          }
        });

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        if (context?.previousData) {
          Object.entries(context.previousData).forEach(([keyStr, data]) => {
            const qk = keyStr.split('|');
            queryClient.setQueryData(qk, data);
          });
        }
      },
    });
  };

  return {
    // Base query fonksiyonları
    ...baseQuery,

    // Özel query fonksiyonları
    useCustomerSearch,
    useCustomerDetail,
    useRealCustomers,
    usePotentialCustomers,
    useCustomerStats,

    // (İsteğe bağlı) optimistic update
    useOptimisticUpdate,
  } as const;
}
