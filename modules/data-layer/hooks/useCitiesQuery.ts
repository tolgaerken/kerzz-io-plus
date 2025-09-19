import { useMemo } from 'react';
import { TCity } from '../../../types/dto';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { useBaseQuery } from './useBaseQuery';

/**
 * Türkiye il bilgilerini yönetmek için özel hook
 * helpers veritabanındaki cities_tr koleksiyonunu kullanır
 */
export function useCitiesQuery() {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();

  // Base query hook'unu helpers.cities_tr için yapılandır
  const baseQuery = useBaseQuery<TCity>(
    {
      database: 'helpers',
      collection: 'cities_tr',
      httpClient,
      authStore,
    },
    ['cities'] // Query key base
  );

  // Tüm illeri getiren hook
  const useAllCities = () => {
    return baseQuery.useList(
      { 
        sort: { name: 1 } // İl isimlerine göre alfabetik sıralama
      },
      {
        staleTime: 24 * 60 * 60 * 1000, // 24 saat - iller çok nadir değişir
        gcTime: 24 * 60 * 60 * 1000, // 24 saat cache
      }
    );
  };

  // Plaka koduna göre il getiren hook
  const useCityByPlateCode = (plateCode: number) => {
    const filter = useMemo(() => ({
      plateCode
    }), [plateCode]);

    return baseQuery.useList(
      { 
        filter,
        limit: 1
      },
      {
        enabled: !!plateCode,
        staleTime: 24 * 60 * 60 * 1000, // 24 saat
      }
    );
  };

  // İl ismine göre arama yapan hook
  const useCitiesByName = (searchTerm: string) => {
    const filter = useMemo(() => {
      if (!searchTerm || searchTerm.trim().length < 2) return {};
      
      return {
        name: { $regex: searchTerm.trim(), $options: 'i' }
      };
    }, [searchTerm]);

    return baseQuery.useList(
      { 
        filter,
        sort: { name: 1 },
        limit: 20
      },
      {
        enabled: !!(searchTerm && searchTerm.trim().length >= 2),
        staleTime: 24 * 60 * 60 * 1000, // 24 saat
      }
    );
  };

  // Bölgeye göre illeri getiren hook
  const useCitiesByRegion = (region: string) => {
    const filter = useMemo(() => ({
      region
    }), [region]);

    return baseQuery.useList(
      { 
        filter,
        sort: { name: 1 }
      },
      {
        enabled: !!region,
        staleTime: 24 * 60 * 60 * 1000, // 24 saat
      }
    );
  };

  // ID ile il getiren utility fonksiyon
  const getCityById = (cityId: string): TCity | undefined => {
    const allCitiesQuery = useAllCities();
    return allCitiesQuery.data?.find(city => city.id === cityId);
  };

  // Plaka kodu ile il getiren utility fonksiyon
  const getCityByPlateCode = (plateCode: number): TCity | undefined => {
    const allCitiesQuery = useAllCities();
    return allCitiesQuery.data?.find(city => city.plateCode === plateCode);
  };

  // İl ismi ile il getiren utility fonksiyon
  const getCityByName = (cityName: string): TCity | undefined => {
    const allCitiesQuery = useAllCities();
    return allCitiesQuery.data?.find(city => 
      city.name.toLowerCase() === cityName.toLowerCase()
    );
  };

  // İl arama fonksiyonu (async)
  const searchCitiesByName = async (searchTerm: string): Promise<TCity[]> => {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const filter = {
        name: { $regex: searchTerm.trim(), $options: 'i' }
      };

      const results = await baseQuery.fetchList({
        filter,
        sort: { name: 1 },
        limit: 20
      });

      return results || [];
    } catch (error) {
      console.error('İl arama hatası:', error);
      throw error;
    }
  };

  return {
    // Base query fonksiyonları
    ...baseQuery,
    
    // Özel query fonksiyonları
    useAllCities,
    useCityByPlateCode,
    useCitiesByName,
    useCitiesByRegion,
    
    // Utility fonksiyonları
    getCityById,
    getCityByPlateCode,
    getCityByName,
    
    // Arama fonksiyonu
    searchCitiesByName,
  };
}
