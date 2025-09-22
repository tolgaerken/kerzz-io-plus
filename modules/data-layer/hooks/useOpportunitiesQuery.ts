import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { TOpportunity, TOpportunityLog } from '../../../types/dto';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { useBaseQuery } from './useBaseQuery';
import { useSalespeopleQuery } from './useSalespeopleQuery';

/**
 * Fırsat verilerini yönetmek için özel hook
 * kerzz-contract veritabanındaki opportunities koleksiyonunu kullanır
 */
export function useOpportunitiesQuery() {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();

  // Base query hook'unu kerzz-contract.opportunities için yapılandır
  const baseQuery = useBaseQuery<TOpportunity>(
    {
      database: 'kerzz-contract',
      collection: 'opportunities',
      httpClient,
      authStore,
    },
    ['opportunities'] // Query key base
  );

  // Opportunities logs için ayrı base query
  const logsBaseQuery = useBaseQuery<TOpportunityLog>(
    {
      database: 'kerzz-contract',
      collection: 'opportunities-logs',
      httpClient,
      authStore,
    },
    ['opportunities-logs']
  );

  // Ay/yıl filtresine göre fırsatları getiren özel hook
  const useOpportunitiesByMonth = (year: number, month: number) => {
    const filter = useMemo(() => {
      // Seçilen ay/yıl için tarih aralığı oluştur
      const startDate = new Date(year, month - 1, 1); // month - 1 çünkü JS'de aylar 0-11 arası
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Ayın son günü

      return {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }, [year, month]);

    return baseQuery.useList(
      { 
        filter,
        sort: { date: -1 } // En yeni fırsatlar önce
      },
      {
        enabled: !!(year && month), // Sadece year ve month varsa çalıştır
      }
    );
  };

  // Yıla göre fırsatları getiren hook
  const useOpportunitiesByYear = (year: number) => {
    const filter = useMemo(() => {
      const startDate = new Date(year, 0, 1); // Yılın başı
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // Yılın sonu

      return {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }, [year]);

    return baseQuery.useList(
      { 
        filter,
        sort: { date: -1 }
      },
      {
        enabled: !!year,
      }
    );
  };

  // Duruma göre filtreleme
  const useOpportunitiesByStatus = (status: string, year?: number, month?: number) => {
    const filter = useMemo(() => {
      let dateFilter = {};
      
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        dateFilter = {
          date: {
            $gte: startDate,
            $lte: endDate
          }
        };
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        dateFilter = {
          date: {
            $gte: startDate,
            $lte: endDate
          }
        };
      }

      return {
        ...dateFilter,
        status
      };
    }, [status, year, month]);

    return baseQuery.useList(
      { 
        filter,
        sort: { date: -1 }
      },
      {
        enabled: !!status,
      }
    );
  };

  // Satıcıya göre filtreleme
  const useOpportunitiesBySeller = (sellerId: string, year?: number, month?: number) => {
    const filter = useMemo(() => {
      let dateFilter = {};
      
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        dateFilter = {
          date: {
            $gte: startDate,
            $lte: endDate
          }
        };
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        dateFilter = {
          date: {
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
        sort: { date: -1 }
      },
      {
        enabled: !!sellerId,
      }
    );
  };

  // Toplam fırsat istatistikleri
  const useOpportunitiesStats = (year: number, month?: number, options?: { enabled?: boolean }) => {
    // Her iki hook'u da çağır, sadece birini kullan
    const monthlyQuery = useOpportunitiesByMonth(year, month || 1);
    const yearlyQuery = useOpportunitiesByYear(year);
    
    // Hangi query'yi kullanacağını belirle
    const opportunitiesQuery = month ? monthlyQuery : yearlyQuery;

    const stats = useMemo(() => {
      if (!opportunitiesQuery.data) return null;

      const opportunities = opportunitiesQuery.data;
      
      return {
        totalOpportunities: opportunities.length,
        hotOpportunities: opportunities.filter(opp => opp.heat === 'hot').length,
        warmOpportunities: opportunities.filter(opp => opp.heat === 'warm').length,
        coldOpportunities: opportunities.filter(opp => opp.heat === 'cold').length,
        newOpportunities: opportunities.filter(opp => opp.status === 'new').length,
        inProgressOpportunities: opportunities.filter(opp => opp.status === 'in-progress').length,
        wonOpportunities: opportunities.filter(opp => opp.status === 'won').length,
        lostOpportunities: opportunities.filter(opp => opp.status === 'lost').length,
      };
    }, [opportunitiesQuery.data]);

    return {
      ...opportunitiesQuery,
      data: options?.enabled === false ? [] : opportunitiesQuery.data,
      stats: options?.enabled === false ? null : stats,
      isLoading: options?.enabled === false ? false : opportunitiesQuery.isLoading,
      isFetching: options?.enabled === false ? false : opportunitiesQuery.isFetching,
      error: options?.enabled === false ? null : opportunitiesQuery.error,
    };
  };

  const queryClient = useQueryClient();
  const baseQueryKey = ['opportunities'];

  // Fırsat güncelleme için optimistic update
  const useOptimisticUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TOpportunity> }) => baseQuery.updateItem(id, data),
      onMutate: async ({ id, data }) => {
        // Tüm opportunities query'lerini iptal et
        await queryClient.cancelQueries({ queryKey: baseQueryKey });
        
        // Tüm opportunities list query'lerini güncelle
        const allQueries = queryClient.getQueryCache().findAll({ queryKey: baseQueryKey });
        const previousData: any = {};
        
        allQueries.forEach((query) => {
          const queryKey = query.queryKey;
          const currentData = queryClient.getQueryData(queryKey);
          
          if (Array.isArray(currentData)) {
            previousData[queryKey.join('|')] = currentData;
            
            // Cache'i optimistic olarak güncelle
            queryClient.setQueryData(queryKey, (old: TOpportunity[] | undefined) =>
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

  // Satışçı atama için özel mutation hook
  const useAssignSeller = () => {
    const optimisticUpdate = useOptimisticUpdate();
    const addLogMutation = useAddLog();
    const { user } = useAuthStore();
    const { getSalespersonById } = useSalespeopleQuery();
    
    return {
      ...optimisticUpdate,
      mutate: async (variables: { 
        id: string; 
        data: Partial<TOpportunity>; 
        sellerName?: string;
        sellerToken?: string;
        opportunityData?: { no?: string | number; company?: string; request?: string };
      }, options?: any) => {
        console.log('✅ Satışçı ataması başlatılıyor:', variables.id);
        
        try {
          // 1. Opportunity'yi güncelle (sellerId + status)
          const updateData = {
            ...variables.data,
            status: 'delegated' as const // Status'ü delegated olarak güncelle
          };
          
          const updatedOpportunity = await baseQuery.updateItem(variables.id, updateData);
          
          // 2. Otomatik log kaydı ekle
          if (variables.sellerName && user) {
            try {
              await addLogMutation.mutateAsync({
                opportunityId: variables.id,
                logData: {
                  text: `Satışçı atandı: ${variables.sellerName}`,
                  userId: user.id || 'system',
                  userName: user.name || 'Sistem',
                  date: new Date()
                }
              });
              console.log('✅ Otomatik log kaydı eklendi');
            } catch (logError) {
              console.error('❌ Log kaydı eklenirken hata:', logError);
              // Log hatası ana işlemi engellemez
            }
          }

          // 3. Kapsamlı bildirim gönder (Email + SMS + Push)
          if (variables.sellerName && variables.data.sellerId) {
            try {
              const { NotificationService } = await import('../../notifications');
              const notificationService = NotificationService.getInstance();
              
              // Satışçı bilgilerini al
              const seller = getSalespersonById(variables.data.sellerId);
              
              // Kapsamlı bildirim gönder
              await notificationService.sendComprehensiveSellerAssignmentNotification(
                {
                  name: variables.sellerName,
                  email: seller?.mail || 'seller@example.com',
                  phone: seller?.phone || '+905551234567',
                  fcmToken: variables.sellerToken || 'mock-token'
                },
                {
                  name: 'Admin',
                  email: 'admin@kerzz.io',
                  phone: '+905559876543'
                },
                {
                  id: variables.id,
                  no: variables.opportunityData?.no,
                  company: variables.opportunityData?.company,
                  request: variables.opportunityData?.request || 'Fırsat talebi'
                }
              );

              console.log('✅ Kapsamlı bildirimler gönderildi (Email + SMS + Push)');
            } catch (notificationError) {
              console.error('❌ Bildirim gönderme hatası:', notificationError);
              // Bildirim hatası ana işlemi engellemez
            }
          }
          
          // 4. Optimistic update'i tetikle
          optimisticUpdate.mutate(
            { id: variables.id, data: updateData },
            {
              onSuccess: () => {
                console.log('✅ Satışçı atandı:', updatedOpportunity.id);
                options?.onSuccess?.(updatedOpportunity);
              },
              onError: (error) => {
                console.error('❌ Optimistic update hatası:', error);
                options?.onError?.(error);
              },
            }
          );
          
        } catch (error) {
          console.error('❌ Satışçı atama hatası:', error);
          options?.onError?.(error);
        }
      },
    };
  };

  // Fırsat numarası ile arama fonksiyonu (virgül ile ayrılmış çoklu no'ları destekler)
  const searchOpportunitiesByNumber = async (opportunityNumber: string): Promise<TOpportunity[]> => {
    try {
      // Virgül ile ayrılmış no'ları kontrol et
      const numbers = opportunityNumber.split(',').map(num => num.trim()).filter(num => num);
      
      let filter;
      if (numbers.length > 1) {
        // Çoklu no araması
        const numberFilters = numbers.map(num => ({ no: parseInt(num) }));
        
        filter = {
          $or: numberFilters
        };
      } else {
        // Tekli no araması (mevcut mantık)
        filter = {
          no: parseInt(opportunityNumber)
        };
      }

      console.log('🔍 Opportunities arama filtresi:', { 
        originalQuery: opportunityNumber, 
        numbers, 
        filter: JSON.stringify(filter) 
      });

      // baseQuery'nin fetchList fonksiyonunu kullan
      const results = await baseQuery.fetchList({
        filter,
        sort: { date: -1 },
        limit: 50
      });

      return results || [];
    } catch (error) {
      console.error('Fırsat arama hatası:', error);
      throw error;
    }
  };

  // Şirket adı ile arama fonksiyonu
  const searchOpportunitiesByCompany = async (companyName: string): Promise<TOpportunity[]> => {
    try {
      const filter = {
        company: { $regex: companyName, $options: 'i' }
      };

      const results = await baseQuery.fetchList({
        filter,
        sort: { date: -1 },
        limit: 50
      });

      return results || [];
    } catch (error) {
      console.error('Şirket arama hatası:', error);
      throw error;
    }
  };

  // Fırsat loglarını getiren hook
  const useOpportunityLogs = (opportunityId: string) => {
    const filter = useMemo(() => ({
      opportunityId
    }), [opportunityId]);

    return logsBaseQuery.useList(
      { 
        filter,
        sort: { date: -1 } // En yeni loglar önce
      },
      {
        enabled: !!opportunityId,
      }
    );
  };

  // Fırsat ile birlikte loglarını getiren hook (concat işlemi)
  const useOpportunityWithLogs = (opportunityId: string) => {
    const opportunityQuery = baseQuery.useOne(opportunityId);
    const logsQuery = useOpportunityLogs(opportunityId);

    const combinedLogs = useMemo(() => {
      if (!opportunityQuery.data || !logsQuery.data) return [];

      // Opportunity içindeki logs ile external logs'ları birleştir
      const opportunityLogs = opportunityQuery.data.logs || [];
      const externalLogs = logsQuery.data || [];

      // Tüm logları birleştir ve tarihe göre sırala
      return [...opportunityLogs, ...externalLogs].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }, [opportunityQuery.data, logsQuery.data]);

    return {
      opportunity: opportunityQuery.data,
      logs: combinedLogs,
      isLoading: opportunityQuery.isLoading || logsQuery.isLoading,
      error: opportunityQuery.error || logsQuery.error,
      refetch: () => {
        opportunityQuery.refetch();
        logsQuery.refetch();
      }
    };
  };

  // Log ekleme mutation
  const useAddLog = () => {
    return useMutation({
      mutationFn: async ({ opportunityId, logData }: { opportunityId: string; logData: Omit<TOpportunityLog, 'id'> }) => {
        // Log'u opportunities-logs koleksiyonuna ekle
        const newLog = {
          ...logData,
          id: Date.now().toString(), // Geçici ID
          date: new Date(),
        };

        return await logsBaseQuery.createItem(newLog);
      },
      onSuccess: () => {
        // Logs query'lerini invalidate et
        queryClient.invalidateQueries({ queryKey: ['opportunities-logs'] });
      },
    });
  };

  // Log silme mutation
  const useDeleteLog = () => {
    return useMutation({
      mutationFn: async (logId: string) => {
        return await logsBaseQuery.deleteItem(logId);
      },
      onSuccess: () => {
        // Logs query'lerini invalidate et
        queryClient.invalidateQueries({ queryKey: ['opportunities-logs'] });
      },
    });
  };

  return {
    // Base query fonksiyonları
    ...baseQuery,
    
    // Özel query fonksiyonları
    useOpportunitiesByMonth,
    useOpportunitiesByYear,
    useOpportunitiesByStatus,
    useOpportunitiesBySeller,
    useOpportunitiesStats,
    
    // Log query fonksiyonları
    useOpportunityLogs,
    useOpportunityWithLogs,
    
    // Özel mutation fonksiyonları
    useAssignSeller,
    useAddLog,
    useDeleteLog,

    // Arama fonksiyonları
    searchOpportunitiesByNumber,
    searchOpportunitiesByCompany,
  };
}
