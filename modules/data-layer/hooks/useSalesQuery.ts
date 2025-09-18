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
  const useSalesStats = (year: number, month?: number) => {
    const salesQuery = month 
      ? useSalesByMonth(year, month)
      : useSalesByYear(year);

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
      stats
    };
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
  };
}
