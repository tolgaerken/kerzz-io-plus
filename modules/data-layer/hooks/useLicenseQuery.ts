import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { LicenseSearchParams, TLicense } from '../../../types/license.types';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { useBaseQuery } from './useBaseQuery';

/**
 * Lisans verilerini yönetmek için özel hook
 * kerzz-contract veritabanındaki licenses koleksiyonunu kullanır
 */
export function useLicenseQuery() {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();

  // Base query hook'unu kerzz-contract.licenses için yapılandır
  const baseQuery = useBaseQuery<TLicense>(
    {
      database: 'kerzz-contract',
      collection: 'licenses',
      httpClient,
      authStore,
    },
    ['licenses'] // Query key base
  );

  // Lisans arama hook'u - virtual list için projection ile
  const useLicenseSearch = (searchParams?: LicenseSearchParams, options?: { enabled?: boolean }) => {
    const filter = useMemo(() => {
      if (!searchParams) return {};

      const mongoFilter: any = {};

      // Text based searches
      if (searchParams.customerName) {
        mongoFilter.customerName = { $regex: searchParams.customerName, $options: 'i' };
      }

      if (searchParams.brandName) {
        mongoFilter.brandName = { $regex: searchParams.brandName, $options: 'i' };
      }

      if (searchParams.phone) {
        mongoFilter.phone = { $regex: searchParams.phone, $options: 'i' };
      }

      if (searchParams.email) {
        mongoFilter.email = { $regex: searchParams.email, $options: 'i' };
      }

      if (searchParams.city) {
        mongoFilter['address.city'] = { $regex: searchParams.city, $options: 'i' };
      }

      // Exact matches
      if (searchParams.type) {
        mongoFilter.type = searchParams.type;
      }

      if (searchParams.companyType) {
        mongoFilter.companyType = searchParams.companyType;
      }

      if (searchParams.customerId) {
        mongoFilter.customerId = searchParams.customerId;
      }

      // Boolean filters
      if (searchParams.active !== undefined) {
        mongoFilter.active = searchParams.active;
      }

      if (searchParams.block !== undefined) {
        mongoFilter.block = searchParams.block;
      }

      if (searchParams.isOpen !== undefined) {
        mongoFilter.isOpen = searchParams.isOpen;
      }

      if (searchParams.hasContract !== undefined) {
        mongoFilter.haveContract = searchParams.hasContract;
      }

      return mongoFilter;
    }, [searchParams]);

    // Virtual list için sadece kart görünümünde gerekli alanları çek
    const projection = {
      id: 1,
      no: 1,
      customerName: 1,
      brandName: 1,
      'address.city': 1,
      'address.town': 1,
      phone: 1,
      email: 1,
      type: 1,
      companyType: 1,
      active: 1,
      block: 1,
      isOpen: 1,
      lastOnline: 1,
      creation: 1,
      haveContract: 1,
      currentVersion: 1,
      _id: 1
    };

    return baseQuery.useList(
      { 
        filter,
        sort: { creation: -1 }, // En yeni lisanslar önce
        projection
      },
      {
        enabled: options?.enabled !== false,
      }
    );
  };

  // Lisans detayı için tam veri çekme
  const useLicenseDetail = (licenseId: string) => {
    return baseQuery.useOne(licenseId, {
      enabled: !!licenseId,
    });
  };

  // Aktif lisansları getiren hook
  const useActiveLicenses = (options?: { enabled?: boolean }) => {
    const filter = useMemo(() => ({
      active: true,
      block: false
    }), []);

    const projection = {
      id: 1,
      no: 1,
      customerName: 1,
      brandName: 1,
      'address.city': 1,
      'address.town': 1,
      phone: 1,
      type: 1,
      companyType: 1,
      lastOnline: 1,
      creation: 1,
      _id: 1
    };

    return baseQuery.useList(
      { 
        filter,
        sort: { lastOnline: -1 },
        projection
      },
      {
        enabled: options?.enabled !== false,
      }
    );
  };

  // Bloklu lisansları getiren hook
  const useBlockedLicenses = (options?: { enabled?: boolean }) => {
    const filter = useMemo(() => ({
      block: true
    }), []);

    const projection = {
      id: 1,
      no: 1,
      customerName: 1,
      brandName: 1,
      'address.city': 1,
      'address.town': 1,
      phone: 1,
      type: 1,
      block: 1,
      blockMessage: 1,
      creation: 1,
      _id: 1
    };

    return baseQuery.useList(
      { 
        filter,
        sort: { creation: -1 },
        projection
      },
      {
        enabled: options?.enabled !== false,
      }
    );
  };

  // Lisans tipine göre filtreleme
  const useLicensesByType = (type: 'kerzz-pos' | 'orwi-pos' | 'kerzz-cloud', options?: { enabled?: boolean }) => {
    const filter = useMemo(() => ({
      type
    }), [type]);

    const projection = {
      id: 1,
      no: 1,
      customerName: 1,
      brandName: 1,
      'address.city': 1,
      'address.town': 1,
      phone: 1,
      type: 1,
      companyType: 1,
      active: 1,
      lastOnline: 1,
      creation: 1,
      _id: 1
    };

    return baseQuery.useList(
      { 
        filter,
        sort: { creation: -1 },
        projection
      },
      {
        enabled: options?.enabled !== false && !!type,
      }
    );
  };

  // Lisans istatistikleri
  const useLicenseStats = (options?: { enabled?: boolean }) => {
    const allLicensesQuery = baseQuery.useList(
      { 
        filter: {},
        projection: {
          active: 1,
          block: 1,
          type: 1,
          companyType: 1,
          haveContract: 1,
          lastOnline: 1,
          _id: 1
        }
      },
      {
        enabled: options?.enabled !== false,
      }
    );

    const stats = useMemo(() => {
      if (!allLicensesQuery.data) return null;

      const licenses = allLicensesQuery.data;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      return {
        totalLicenses: licenses.length,
        activeLicenses: licenses.filter(license => license.active && !license.block).length,
        blockedLicenses: licenses.filter(license => license.block).length,
        inactiveLicenses: licenses.filter(license => !license.active).length,
        kerzzPosCount: licenses.filter(license => license.type === 'kerzz-pos').length,
        orwiPosCount: licenses.filter(license => license.type === 'orwi-pos').length,
        kerzzCloudCount: licenses.filter(license => license.type === 'kerzz-cloud').length,
        chainCount: licenses.filter(license => license.companyType === 'chain').length,
        singleCount: licenses.filter(license => license.companyType === 'single').length,
        withContractCount: licenses.filter(license => license.haveContract).length,
        recentlyOnlineCount: licenses.filter(license => 
          license.lastOnline && new Date(license.lastOnline) > thirtyDaysAgo
        ).length,
      };
    }, [allLicensesQuery.data]);

    return {
      ...allLicensesQuery,
      stats: options?.enabled === false ? null : stats,
    };
  };

  const queryClient = useQueryClient();
  const baseQueryKey = ['licenses'];

  // Optimistic update hook'u
  const useOptimisticUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TLicense> }) => baseQuery.updateItem(id, data),
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: baseQueryKey });
        
        const allQueries = queryClient.getQueryCache().findAll({ queryKey: baseQueryKey });
        const previousData: any = {};
        
        allQueries.forEach((query) => {
          const queryKey = query.queryKey;
          const currentData = queryClient.getQueryData(queryKey);
          
          if (Array.isArray(currentData)) {
            previousData[queryKey.join('|')] = currentData;
            
            queryClient.setQueryData(queryKey, (old: TLicense[] | undefined) =>
              old ? old.map(item => 
                item.id === id ? { ...item, ...data } : item
              ) : []
            );
          }
        });
        
        return { previousData };
      },
      onError: (err, variables, context) => {
        if (context?.previousData) {
          Object.entries(context.previousData).forEach(([keyStr, data]) => {
            const queryKey = keyStr.split('|');
            queryClient.setQueryData(queryKey, data);
          });
        }
      },
    });
  };

  // Lisans blok/unblock hook'u
  const useToggleBlock = () => {
    const optimisticUpdate = useOptimisticUpdate();
    
    return {
      ...optimisticUpdate,
      mutate: (variables: { id: string; block: boolean; blockMessage?: string }, options?: any) => {
        console.log('🔒 Lisans blok durumu değiştiriliyor:', variables.id, variables.block);
        optimisticUpdate.mutate(
          { 
            id: variables.id, 
            data: { 
              block: variables.block,
              blockMessage: variables.blockMessage || ''
            } 
          }, 
          {
            onSuccess: (updatedLicense) => {
              console.log('✅ Lisans blok durumu güncellendi:', updatedLicense.id);
              options?.onSuccess?.(updatedLicense);
            },
            onError: (error) => {
              console.error('❌ Lisans blok durumu güncelleme hatası:', error);
              options?.onError?.(error);
            },
          }
        );
      },
    };
  };

  // Lisans aktif/pasif hook'u
  const useToggleActive = () => {
    const optimisticUpdate = useOptimisticUpdate();
    
    return {
      ...optimisticUpdate,
      mutate: (variables: { id: string; active: boolean }, options?: any) => {
        console.log('⚡ Lisans aktif durumu değiştiriliyor:', variables.id, variables.active);
        optimisticUpdate.mutate(
          { 
            id: variables.id, 
            data: { active: variables.active } 
          }, 
          {
            onSuccess: (updatedLicense) => {
              console.log('✅ Lisans aktif durumu güncellendi:', updatedLicense.id);
              options?.onSuccess?.(updatedLicense);
            },
            onError: (error) => {
              console.error('❌ Lisans aktif durumu güncelleme hatası:', error);
              options?.onError?.(error);
            },
          }
        );
      },
    };
  };

  // Lisans numarası ile arama fonksiyonu
  const searchLicensesByNumber = async (licenseNumber: string): Promise<TLicense[]> => {
    try {
      const filter = {
        $or: [
          { no: parseInt(licenseNumber) },
          { licenseId: parseInt(licenseNumber) }
        ]
      };

      const projection = {
        id: 1,
        no: 1,
        customerName: 1,
        brandName: 1,
        'address.city': 1,
        'address.town': 1,
        phone: 1,
        email: 1,
        type: 1,
        companyType: 1,
        active: 1,
        block: 1,
        creation: 1,
        _id: 1
      };

      const results = await baseQuery.fetchList({
        filter,
        sort: { creation: -1 },
        limit: 50,
        projection
      });

      return results || [];
    } catch (error) {
      console.error('Lisans arama hatası:', error);
      throw error;
    }
  };

  return {
    // Base query fonksiyonları
    ...baseQuery,
    
    // Özel query fonksiyonları
    useLicenseSearch,
    useLicenseDetail,
    useActiveLicenses,
    useBlockedLicenses,
    useLicensesByType,
    useLicenseStats,
    
    // Özel mutation fonksiyonları
    useToggleBlock,
    useToggleActive,

    // Arama fonksiyonu
    searchLicensesByNumber,
  };
}
