import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { TOffer } from '../../../types/offer.types';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { useBaseQuery } from './useBaseQuery';

/**
 * Teklif verilerini yönetmek için özel hook
 * kerzz-contract veritabanındaki sale-offers koleksiyonunu kullanır
 */
export function useOffersQuery() {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();

  // Base query hook'unu kerzz-contract.sale-offers için yapılandır
  const baseQuery = useBaseQuery<TOffer>(
    {
      database: 'kerzz-contract',
      collection: 'sale-offers',
      httpClient,
      authStore,
    },
    ['offers'] // Query key base
  );

  // Ay/yıl filtresine göre teklifleri getiren özel hook
  const useOffersByMonth = (year: number, month: number) => {
    const filter = useMemo(() => {
      // Seçilen ay/yıl için tarih aralığı oluştur
      const startDate = new Date(year, month - 1, 1); // month - 1 çünkü JS'de aylar 0-11 arası
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Ayın son günü

      return {
        saleDate: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }, [year, month]);

    return baseQuery.useList(
      { 
        filter,
        sort: { saleDate: -1 } // En yeni teklifler önce
      },
      {
        enabled: !!(year && month), // Sadece year ve month varsa çalıştır
      }
    );
  };

  // Yıla göre teklifleri getiren hook
  const useOffersByYear = (year: number) => {
    const filter = useMemo(() => {
      const startDate = new Date(year, 0, 1); // Yılın başı
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // Yılın sonu

      return {
        saleDate: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }, [year]);

    return baseQuery.useList(
      { 
        filter,
        sort: { saleDate: -1 }
      },
      {
        enabled: !!year,
      }
    );
  };

  // Teklif durumuna göre filtreleme
  const useOffersByStatus = (status: string, year?: number, month?: number) => {
    const filter = useMemo(() => {
      let dateFilter = {};
      
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        dateFilter = {
          saleDate: {
            $gte: startDate,
            $lte: endDate
          }
        };
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        dateFilter = {
          saleDate: {
            $gte: startDate,
            $lte: endDate
          }
        };
      }

      return {
        ...dateFilter,
        status: { $in: [status] }
      };
    }, [status, year, month]);

    return baseQuery.useList(
      { 
        filter,
        sort: { saleDate: -1 }
      },
      {
        enabled: !!status,
      }
    );
  };

  // Satıcıya göre filtreleme
  const useOffersBySeller = (sellerId: string, year?: number, month?: number) => {
    const filter = useMemo(() => {
      let dateFilter = {};
      
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        dateFilter = {
          saleDate: {
            $gte: startDate,
            $lte: endDate
          }
        };
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        dateFilter = {
          saleDate: {
            $gte: startDate,
            $lte: endDate
          }
        };
      }

      return {
        ...dateFilter,
        sellerId
      };
    }, [sellerId, year, month]);

    return baseQuery.useList(
      { 
        filter,
        sort: { saleDate: -1 }
      },
      {
        enabled: !!sellerId,
      }
    );
  };

  // Toplam teklif istatistikleri
  const useOffersStats = (year: number, month?: number, options?: { enabled?: boolean }) => {
    // Her iki hook'u da çağır, sadece birini kullan
    const monthlyQuery = useOffersByMonth(year, month || 1);
    const yearlyQuery = useOffersByYear(year);
    
    // Hangi query'yi kullanacağını belirle
    const offersQuery = month ? monthlyQuery : yearlyQuery;

    const stats = useMemo(() => {
      if (!offersQuery.data) return null;

      const offers = offersQuery.data;
      
      return {
        totalOffers: offers.length,
        totalAmount: offers.reduce((sum, offer) => sum + (offer.grandTotal || 0), 0),
        totalProfit: offers.reduce((sum, offer) => sum + (offer.profit || 0), 0),
        averageAmount: offers.length > 0 
          ? offers.reduce((sum, offer) => sum + (offer.grandTotal || 0), 0) / offers.length 
          : 0,
        approvedOffers: offers.filter(offer => offer.approved).length,
        pendingOffers: offers.filter(offer => !offer.approved).length,
      };
    }, [offersQuery.data]);

    return {
      ...offersQuery,
      data: options?.enabled === false ? [] : offersQuery.data,
      stats: options?.enabled === false ? null : stats,
      isLoading: options?.enabled === false ? false : offersQuery.isLoading,
      isFetching: options?.enabled === false ? false : offersQuery.isFetching,
      error: options?.enabled === false ? null : offersQuery.error,
    };
  };

  const queryClient = useQueryClient();
  const baseQueryKey = ['offers'];

  // Sadece optimistic update yapan özel update hook'u
  const useOptimisticUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TOffer> }) => baseQuery.updateItem(id, data),
      onMutate: async ({ id, data }) => {
        // Tüm offers query'lerini iptal et
        await queryClient.cancelQueries({ queryKey: baseQueryKey });
        
        // Tüm offers list query'lerini güncelle
        const allQueries = queryClient.getQueryCache().findAll({ queryKey: baseQueryKey });
        const previousData: any = {};
        
        allQueries.forEach((query) => {
          const queryKey = query.queryKey;
          const currentData = queryClient.getQueryData(queryKey);
          
          if (Array.isArray(currentData)) {
            previousData[queryKey.join('|')] = currentData;
            
            // Cache'i optimistic olarak güncelle
            queryClient.setQueryData(queryKey, (old: TOffer[] | undefined) =>
              old ? old.map(item => 
                item.id === id ? { ...item, ...data } : item
              ) : []
            );
          }
        });
        
        return { previousData };
      },
      onError: (err, variables, context) => {
        // Hata durumunda tüm önceki verileri geri yükle
        if (context?.previousData) {
          Object.entries(context.previousData).forEach(([keyStr, data]) => {
            const queryKey = keyStr.split('|');
            queryClient.setQueryData(queryKey, data);
          });
        }
      },
      onSettled: () => {
        // API çağrısı tamamlandıktan sonra hiçbir şey yapma
        // invalidate etme ki liste yeniden fetch edilmesin
      },
    });
  };

  // Teklif onayı için özel mutation hook
  const useApproveOffer = () => {
    const optimisticUpdate = useOptimisticUpdate();
    
    return {
      ...optimisticUpdate,
      mutate: (variables: { id: string; data: Partial<TOffer> }, options?: any) => {
        console.log('✅ Teklif onayı başlatılıyor:', variables.id);
        optimisticUpdate.mutate(variables, {
          onSuccess: (updatedOffer) => {
            console.log('✅ Teklif onaylandı:', updatedOffer.id);
            options?.onSuccess?.(updatedOffer);
          },
          onError: (error) => {
            console.error('❌ Teklif onayı hatası:', error);
            options?.onError?.(error);
          },
        });
      },
    };
  };

  // Fatura onayı için özel mutation hook
  const useApproveInvoice = () => {
    const optimisticUpdate = useOptimisticUpdate();
    
    return {
      ...optimisticUpdate,
      mutate: (variables: { id: string; data: Partial<TOffer> }, options?: any) => {
        console.log('✅ Fatura onayı başlatılıyor:', variables.id);
        optimisticUpdate.mutate(variables, {
          onSuccess: (updatedOffer) => {
            console.log('✅ Fatura onaylandı:', updatedOffer.id);
            options?.onSuccess?.(updatedOffer);
          },
          onError: (error) => {
            console.error('❌ Fatura onayı hatası:', error);
            options?.onError?.(error);
          },
        });
      },
    };
  };

  // Teklif numarası ile arama fonksiyonu (virgül ile ayrılmış çoklu no'ları destekler)
  const searchOffersByNumber = async (offerNumber: string): Promise<TOffer[]> => {
    try {
      // Virgül ile ayrılmış no'ları kontrol et
      const numbers = offerNumber.split(',').map(num => num.trim()).filter(num => num);
      
      let filter;
      if (numbers.length > 1) {
        // Çoklu no araması
        const numberFilters = numbers.map(num => ({
          $or: [
            { no: parseInt(num) },
            { number: parseInt(num) }
          ]
        }));
        
        filter = {
          $or: numberFilters
        };
      } else {
        // Tekli no araması (mevcut mantık)
        filter = {
          $or: [
            { no: parseInt(offerNumber) },
            { number: parseInt(offerNumber) }
          ]
        };
      }

      console.log('🔍 Offers arama filtresi:', { 
        originalQuery: offerNumber, 
        numbers, 
        filter: JSON.stringify(filter) 
      });

      // baseQuery'nin fetchList fonksiyonunu kullan
      const results = await baseQuery.fetchList({
        filter,
        sort: { saleDate: -1 },
        limit: 50
      });

      return results || [];
    } catch (error) {
      console.error('Teklif arama hatası:', error);
      throw error;
    }
  };

  return {
    // Base query fonksiyonları
    ...baseQuery,
    
    // Özel query fonksiyonları
    useOffersByMonth,
    useOffersByYear,
    useOffersByStatus,
    useOffersBySeller,
    useOffersStats,
    
    // Özel mutation fonksiyonları
    useApproveOffer,
    useApproveInvoice,

    // Arama fonksiyonu
    searchOffersByNumber,
  };
}

