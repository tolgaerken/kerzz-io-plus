import { useMemo } from 'react';
import { TCounty } from '../../../types/dto';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { useBaseQuery } from './useBaseQuery';

/**
 * Türkiye ilçe bilgilerini yönetmek için özel hook
 * helpers veritabanındaki counties_tr koleksiyonunu kullanır
 */
export function useCountiesQuery() {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();

  // Base query hook'unu helpers.counties_tr için yapılandır
  const baseQuery = useBaseQuery<TCounty>(
    {
      database: 'helpers',
      collection: 'counties_tr',
      httpClient,
      authStore,
    },
    ['counties'] // Query key base
  );

  // Tüm ilçeleri getiren hook
  const useAllCounties = () => {
    return baseQuery.useList(
      { 
        sort: { name: 1 } // İlçe isimlerine göre alfabetik sıralama
      },
      {
        staleTime: 24 * 60 * 60 * 1000, // 24 saat - ilçeler çok nadir değişir
        gcTime: 24 * 60 * 60 * 1000, // 24 saat cache
      }
    );
  };

  // Belirli bir ile ait ilçeleri getiren hook
  const useCountiesByCity = (cityId: string) => {
    const filter = useMemo(() => ({
      cityId
    }), [cityId]);

    return baseQuery.useList(
      { 
        filter,
        sort: { name: 1 }
      },
      {
        enabled: !!cityId,
        staleTime: 24 * 60 * 60 * 1000, // 24 saat
      }
    );
  };

  // İlçe ismine göre arama yapan hook
  const useCountiesByName = (searchTerm: string, cityId?: string) => {
    const filter = useMemo(() => {
      if (!searchTerm || searchTerm.trim().length < 2) return {};
      
      const baseFilter = {
        name: { $regex: searchTerm.trim(), $options: 'i' }
      };

      // Eğer cityId verilmişse, sadece o ile ait ilçelerde ara
      if (cityId) {
        return {
          ...baseFilter,
          cityId
        };
      }

      return baseFilter;
    }, [searchTerm, cityId]);

    return baseQuery.useList(
      { 
        filter,
        sort: { name: 1 },
        limit: 50
      },
      {
        enabled: !!(searchTerm && searchTerm.trim().length >= 2),
        staleTime: 24 * 60 * 60 * 1000, // 24 saat
      }
    );
  };

  // ID ile ilçe getiren utility fonksiyon
  const getCountyById = (countyId: string): TCounty | undefined => {
    const allCountiesQuery = useAllCounties();
    return allCountiesQuery.data?.find(county => county.id === countyId);
  };

  // İl ID'sine göre ilçeleri getiren utility fonksiyon
  const getCountiesByCity = (cityId: string): TCounty[] => {
    const allCountiesQuery = useAllCounties();
    return allCountiesQuery.data?.filter(county => county.cityId === cityId) || [];
  };

  // İlçe ismi ile ilçe getiren utility fonksiyon
  const getCountyByName = (countyName: string, cityId?: string): TCounty | undefined => {
    const allCountiesQuery = useAllCounties();
    return allCountiesQuery.data?.find(county => {
      const nameMatch = county.name.toLowerCase() === countyName.toLowerCase();
      if (cityId) {
        return nameMatch && county.cityId === cityId;
      }
      return nameMatch;
    });
  };

  // İlçe arama fonksiyonu (async)
  const searchCountiesByName = async (searchTerm: string, cityId?: string): Promise<TCounty[]> => {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const baseFilter = {
        name: { $regex: searchTerm.trim(), $options: 'i' }
      };

      const filter = cityId ? { ...baseFilter, cityId } : baseFilter;

      const results = await baseQuery.fetchList({
        filter,
        sort: { name: 1 },
        limit: 50
      });

      return results || [];
    } catch (error) {
      console.error('İlçe arama hatası:', error);
      throw error;
    }
  };

  // Belirli bir ile ait ilçeleri getiren fonksiyon (async)
  const fetchCountiesByCity = async (cityId: string): Promise<TCounty[]> => {
    try {
      if (!cityId) {
        return [];
      }

      const filter = { cityId };

      const results = await baseQuery.fetchList({
        filter,
        sort: { name: 1 }
      });

      return results || [];
    } catch (error) {
      console.error('İle göre ilçe getirme hatası:', error);
      throw error;
    }
  };

  return {
    // Base query fonksiyonları
    ...baseQuery,
    
    // Özel query fonksiyonları
    useAllCounties,
    useCountiesByCity,
    useCountiesByName,
    
    // Utility fonksiyonları
    getCountyById,
    getCountiesByCity,
    getCountyByName,
    
    // Arama fonksiyonları
    searchCountiesByName,
    fetchCountiesByCity,
  };
}
