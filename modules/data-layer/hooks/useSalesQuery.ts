import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { TSale } from '../../../types/dto';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { useBaseQuery } from './useBaseQuery';

/**
 * Satış verilerini yönetmek için özel hook
 * kerzz-contract veritabanındaki sales koleksiyonunu kullanır
 */
export function useSalesQuery() {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();

  // Base query hook'unu kerzz-contract.sales için yapılandır
  const baseQuery = useBaseQuery<TSale>(
    {
      database: 'kerzz-contract',
      collection: 'sales',
      httpClient,
      authStore,
    },
    ['sales'] // Query key base
  );

  // Ay/yıl filtresine göre satışları getiren özel hook
  const useSalesByMonth = (year: number, month: number) => {
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
        sort: { saleDate: -1 } // En yeni satışlar önce
      },
      {
        enabled: !!(year && month), // Sadece year ve month varsa çalıştır
      }
    );
  };

  // Yıla göre satışları getiren hook
  const useSalesByYear = (year: number) => {
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

  // Satış durumuna göre filtreleme
  const useSalesByStatus = (status: string, year?: number, month?: number) => {
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
  const useSalesBySeller = (sellerId: string, year?: number, month?: number) => {
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

  // Toplam satış istatistikleri
  const useSalesStats = (year: number, month?: number, options?: { enabled?: boolean }) => {
    // Her iki hook'u da çağır, sadece birini kullan
    const monthlyQuery = useSalesByMonth(year, month || 1);
    const yearlyQuery = useSalesByYear(year);
    
    // Hangi query'yi kullanacağını belirle
    const salesQuery = month ? monthlyQuery : yearlyQuery;

    const stats = useMemo(() => {
      if (!salesQuery.data) return null;

      const sales = salesQuery.data;
      
      return {
        totalSales: sales.length,
        totalAmount: sales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0),
        totalProfit: sales.reduce((sum, sale) => sum + (sale.profit || 0), 0),
        averageAmount: sales.length > 0 
          ? sales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0) / sales.length 
          : 0,
        approvedSales: sales.filter(sale => sale.approved).length,
        pendingSales: sales.filter(sale => !sale.approved).length,
      };
    }, [salesQuery.data]);

    return {
      ...salesQuery,
      data: options?.enabled === false ? [] : salesQuery.data,
      stats: options?.enabled === false ? null : stats,
      isLoading: options?.enabled === false ? false : salesQuery.isLoading,
      isFetching: options?.enabled === false ? false : salesQuery.isFetching,
      error: options?.enabled === false ? null : salesQuery.error,
    };
  };

  const queryClient = useQueryClient();
  const baseQueryKey = ['sales'];

  // Sadece optimistic update yapan özel update hook'u
  const useOptimisticUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TSale> }) => baseQuery.updateItem(id, data),
      onMutate: async ({ id, data }) => {
        // Tüm sales query'lerini iptal et
        await queryClient.cancelQueries({ queryKey: baseQueryKey });
        
        // Tüm sales list query'lerini güncelle
        const allQueries = queryClient.getQueryCache().findAll({ queryKey: baseQueryKey });
        const previousData: any = {};
        
        allQueries.forEach((query) => {
          const queryKey = query.queryKey;
          const currentData = queryClient.getQueryData(queryKey);
          
          if (Array.isArray(currentData)) {
            previousData[queryKey.join('|')] = currentData;
            
            // Cache'i optimistic olarak güncelle
            queryClient.setQueryData(queryKey, (old: TSale[] | undefined) =>
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

  // Satış onayı için özel mutation hook
  const useApproveSale = () => {
    const optimisticUpdate = useOptimisticUpdate();
    
    return {
      ...optimisticUpdate,
      mutate: (variables: { id: string; data: Partial<TSale> }, options?: any) => {
        console.log('✅ Satış onayı başlatılıyor:', variables.id);
        optimisticUpdate.mutate(variables, {
          onSuccess: (updatedSale) => {
            console.log('✅ Satış onaylandı:', updatedSale.id);
            options?.onSuccess?.(updatedSale);
          },
          onError: (error) => {
            console.error('❌ Satış onayı hatası:', error);
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
      mutate: (variables: { id: string; data: Partial<TSale> }, options?: any) => {
        console.log('✅ Fatura onayı başlatılıyor:', variables.id);
        optimisticUpdate.mutate(variables, {
          onSuccess: (updatedSale) => {
            console.log('✅ Fatura onaylandı:', updatedSale.id);
            options?.onSuccess?.(updatedSale);
          },
          onError: (error) => {
            console.error('❌ Fatura onayı hatası:', error);
            options?.onError?.(error);
          },
        });
      },
    };
  };

  // Satış numarası ile arama fonksiyonu (virgül ile ayrılmış çoklu no'ları destekler)
  const searchSalesByNumber = async (saleNumber: string): Promise<TSale[]> => {
    try {
      // Virgül ile ayrılmış no'ları kontrol et
      const numbers = saleNumber.split(',').map(num => num.trim()).filter(num => num);
      
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
            { no: parseInt(saleNumber) },
            { number: parseInt(saleNumber) }
          ]
        };
      }

      console.log('🔍 Sales arama filtresi:', { 
        originalQuery: saleNumber, 
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
      console.error('Satış arama hatası:', error);
      throw error;
    }
  };

  return {
    // Base query fonksiyonları
    ...baseQuery,
    
    // Özel query fonksiyonları
    useSalesByMonth,
    useSalesByYear,
    useSalesByStatus,
    useSalesBySeller,
    useSalesStats,
    
    // Özel mutation fonksiyonları
    useApproveSale,
    useApproveInvoice,

    // Arama fonksiyonu
    searchSalesByNumber,
  };
}
