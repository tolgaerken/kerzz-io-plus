import { useMemo } from 'react';
import { TPushNotificationLog } from '../../../types/dto';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { useBaseQuery } from './useBaseQuery';

/**
 * Push notification loglarını yönetmek için özel hook
 * kerzz-contract veritabanındaki push-notification-logs koleksiyonunu kullanır
 */
export function usePushNotificationLogsQuery() {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();

  // Base query hook'unu kerzz-contract.push-notification-logs için yapılandır
  const baseQuery = useBaseQuery<TPushNotificationLog>(
    {
      database: 'kerzz-contract',
      collection: 'push-notification-logs',
      httpClient,
      authStore,
    },
    ['push-notification-logs'] // Query key base
  );

  // Kullanıcıya göre filtrelenmiş logları getiren hook
  const useLogsByUser = (userId?: string, options?: { enabled?: boolean }) => {
    const filter = useMemo(() => {
      if (!userId) return {};
      
      return {
        userId: userId
      };
    }, [userId]);

    return baseQuery.useList(
      { 
        filter,
        sort: { sentAt: -1 } // En yeni loglar önce
      },
      {
        enabled: options?.enabled !== false && !!userId,
      }
    );
  };

  // Tüm logları getiren hook (admin için)
  const useAllLogs = (options?: { enabled?: boolean; limit?: number }) => {
    return baseQuery.useList(
      { 
        filter: {},
        sort: { sentAt: -1 },
        limit: options?.limit || 100 // Default 100 log
      },
      {
        enabled: options?.enabled !== false,
      }
    );
  };

  // Duruma göre filtreleme
  const useLogsByStatus = (
    deliveryStatus: 'sent' | 'failed',
    userId?: string,
    options?: { enabled?: boolean }
  ) => {
    const filter = useMemo(() => {
      const baseFilter: any = { deliveryStatus };
      
      if (userId) {
        baseFilter.userId = userId;
      }

      return baseFilter;
    }, [deliveryStatus, userId]);

    return baseQuery.useList(
      { 
        filter,
        sort: { sentAt: -1 }
      },
      {
        enabled: options?.enabled !== false && !!deliveryStatus,
      }
    );
  };

  // Modül'e göre filtreleme
  const useLogsByModule = (
    module: string,
    userId?: string,
    options?: { enabled?: boolean }
  ) => {
    const filter = useMemo(() => {
      const baseFilter: any = { module };
      
      if (userId) {
        baseFilter.userId = userId;
      }

      return baseFilter;
    }, [module, userId]);

    return baseQuery.useList(
      { 
        filter,
        sort: { sentAt: -1 }
      },
      {
        enabled: options?.enabled !== false && !!module,
      }
    );
  };

  // Tarih aralığına göre filtreleme
  const useLogsByDateRange = (
    startDate: Date,
    endDate: Date,
    userId?: string,
    options?: { enabled?: boolean }
  ) => {
    const filter = useMemo(() => {
      const baseFilter: any = {
        sentAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
      
      if (userId) {
        baseFilter.userId = userId;
      }

      return baseFilter;
    }, [startDate, endDate, userId]);

    return baseQuery.useList(
      { 
        filter,
        sort: { sentAt: -1 }
      },
      {
        enabled: options?.enabled !== false && !!(startDate && endDate),
      }
    );
  };

  // İstatistikler
  const useLogsStats = (userId?: string, options?: { enabled?: boolean }) => {
    const logsQuery = userId 
      ? useLogsByUser(userId, options)
      : useAllLogs(options);

    const stats = useMemo(() => {
      if (!logsQuery.data) return null;

      const logs = logsQuery.data;
      
      return {
        total: logs.length,
        sent: logs.filter(log => log.deliveryStatus === 'sent').length,
        failed: logs.filter(log => log.deliveryStatus === 'failed').length,
        read: logs.filter(log => log.isRead).length,
        unread: logs.filter(log => !log.isRead).length,
        byModule: logs.reduce((acc, log) => {
          const module = log.module || 'unknown';
          acc[module] = (acc[module] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byDeliveryMethod: logs.reduce((acc, log) => {
          const method = log.deliveryMethod || 'unknown';
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byAction: logs.reduce((acc, log) => {
          const action = log.action || 'unknown';
          acc[action] = (acc[action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    }, [logsQuery.data]);

    return {
      ...logsQuery,
      data: options?.enabled === false ? [] : logsQuery.data,
      stats: options?.enabled === false ? null : stats,
      isLoading: options?.enabled === false ? false : logsQuery.isLoading,
      isFetching: options?.enabled === false ? false : logsQuery.isFetching,
      error: options?.enabled === false ? null : logsQuery.error,
    };
  };

  return {
    // Base query fonksiyonları
    ...baseQuery,
    
    // Özel query fonksiyonları
    useLogsByUser,
    useAllLogs,
    useLogsByStatus,
    useLogsByModule,
    useLogsByDateRange,
    useLogsStats,
  };
}
