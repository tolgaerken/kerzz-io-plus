import { useMutation, UseMutationOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
import { MONGO_API, RN_CONFIG } from '../constants';
import { BaseModel, MongoGetParams, MongoPayload } from '../types/mongo';
import { generateMaxiId } from '../utils/idGenerator';

// External dependencies interfaces
interface AuthStore {
  userInfo?: any;
}

interface HttpClient {
  post<T>(url: string, body: any, headers?: Record<string, string>, trackLoading?: boolean): Promise<T>;
}

interface BaseQueryOptions {
  database: string;
  collection: string;
  httpClient: HttpClient;
  authStore: AuthStore;
}

interface UseBaseQueryResult<T extends BaseModel> {
  // Query hooks
  useList: (
    params?: Partial<MongoGetParams>,
    options?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>
  ) => ReturnType<typeof useQuery<T[], Error>>;
  
  useOne: (
    id: string,
    options?: Omit<UseQueryOptions<T | null, Error>, 'queryKey' | 'queryFn'>
  ) => ReturnType<typeof useQuery<T | null, Error>>;

  // Mutation hooks
  useCreate: (
    options?: UseMutationOptions<T, Error, Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'creatorId' | 'updaterId'>, unknown>
  ) => any;

  useUpdate: (
    options?: UseMutationOptions<T, Error, { id: string; data: Partial<T> }, unknown>
  ) => any;

  useDelete: (
    options?: UseMutationOptions<any, Error, string, unknown>
  ) => any;

  // Utility functions
  fetchList: (params?: Partial<MongoGetParams>) => Promise<T[]>;
  fetchOne: (id: string) => Promise<T | null>;
  createItem: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'creatorId' | 'updaterId'>) => Promise<T>;
  updateItem: (id: string, data: Partial<T>) => Promise<T>;
  deleteItem: (id: string) => Promise<any>;
  invalidateList: () => void;
  invalidateOne: (id: string) => void;
}

export function useBaseQuery<T extends BaseModel>(
  { database, collection, httpClient, authStore }: BaseQueryOptions,
  baseQueryKey: readonly string[]
): UseBaseQueryResult<T> {
  const queryClient = useQueryClient();
  const { userInfo } = authStore;

  const createPayload = useCallback((
    job: 'get' | 'upsert' | 'delete',
    idOrFilter: string | object,
    data?: any
  ): MongoPayload => {
    const payload: MongoPayload = {
      job,
      database,
      collection,
      filter: idOrFilter,
      data,
    };

    if (typeof idOrFilter === 'string') {
      if (idOrFilter && idOrFilter.trim().length > 0) {
        payload.filter = { id: idOrFilter };
      } else {
        payload.filter = {};
      }
    }

    return payload;
  }, [database, collection]);

  const buildMongoPayload = useCallback((job: 'get' | 'upsert' | 'delete', params: MongoGetParams): MongoPayload => {
    return {
      job,
      database: params.db || database,
      collection: params.col,
      filter: params.filter || {},
      projection: params.project,
      limit: params.limit,
      skip: params.skip,
      sort: params.sort,
      withTotalCount: params.withTotalCount,
    };
  }, [database]);

  // API Functions
  const fetchList = useCallback(async (params: Partial<MongoGetParams> = {}): Promise<T[]> => {
    if (RN_CONFIG.ENABLE_LOGS) {
      console.log(`🔍 useBaseQuery.fetchList çağrıldı: ${database}.${collection}`, { params });
    }

    const fetchParams: MongoGetParams = {
      col: collection,
      db: database,
      filter: {},
      sort: {},
      project: {},
      ...params,
    };

    try {
      const payload = buildMongoPayload('get', fetchParams);
      // HttpClient otomatik olarak x-user-token ve x-api-key header'larını MongoDB çağrıları için ekliyor
      const result = await httpClient.post<T[]>(MONGO_API.BASE_URL, payload);
      
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log(`✅ useBaseQuery.fetchList başarılı: ${database}.${collection}, ${result.length} item`);
      }
      
      return result;
    } catch (error) {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.error(`❌ useBaseQuery.fetchList hata: ${database}.${collection}`, error);
      }
      throw error;
    }
  }, [database, collection, buildMongoPayload, httpClient]);

  const fetchOne = useCallback(async (id: string): Promise<T | null> => {
    if (!id) return null;
    
    if (RN_CONFIG.ENABLE_LOGS) {
      console.log(`🔍 useBaseQuery.fetchOne çağrıldı: ${database}.${collection}`, { id });
    }
    
    try {
      const items = await fetchList({ filter: { id } });
      const result = items.length > 0 ? items[0] : null;
      
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log(`✅ useBaseQuery.fetchOne ${result ? 'bulundu' : 'bulunamadı'}: ${database}.${collection}`, { id });
      }
      
      return result;
    } catch (error) {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.error(`❌ useBaseQuery.fetchOne hata: ${database}.${collection}`, { id, error });
      }
      throw error;
    }
  }, [fetchList, database, collection]);

  const createItem = useCallback(async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'creatorId' | 'updaterId'>): Promise<T> => {
    const targetId = generateMaxiId();
    
    if (RN_CONFIG.ENABLE_LOGS) {
      console.log(`🔍 useBaseQuery.createItem çağrıldı: ${database}.${collection}`, { targetId, data });
    }
    
    const itemData = {
      ...data,
      id: targetId,
      createdAt: new Date(),
      updatedAt: new Date(),
      creatorId: userInfo?.id,
    } as any;

    try {
      const payload = createPayload('upsert', targetId, itemData);
      // HttpClient otomatik olarak x-user-token ve x-api-key header'larını MongoDB çağrıları için ekliyor
      const result = await httpClient.post<T>(MONGO_API.BASE_URL, payload);
      
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log(`✅ useBaseQuery.createItem başarılı: ${database}.${collection}`, { targetId });
      }
      
      return result;
    } catch (error) {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.error(`❌ useBaseQuery.createItem hata: ${database}.${collection}`, { targetId, error });
      }
      throw error;
    }
  }, [createPayload, userInfo, database, collection, httpClient]);

  const updateItem = useCallback(async (id: string, data: Partial<T>): Promise<T> => {
    if (RN_CONFIG.ENABLE_LOGS) {
      console.log(`🔍 useBaseQuery.updateItem çağrıldı: ${database}.${collection}`, { id, data });
    }
    
    const updateData = {
      ...data,
      updatedAt: new Date(),
      updaterId: userInfo?.id,
    };

    try {
      const payload = createPayload('upsert', id, updateData);
      // HttpClient otomatik olarak x-user-token ve x-api-key header'larını MongoDB çağrıları için ekliyor
      const result = await httpClient.post<T>(MONGO_API.BASE_URL, payload);
      
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log(`✅ useBaseQuery.updateItem başarılı: ${database}.${collection}`, { id });
      }
      
      return result;
    } catch (error) {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.error(`❌ useBaseQuery.updateItem hata: ${database}.${collection}`, { id, error });
      }
      throw error;
    }
  }, [createPayload, userInfo, database, collection, httpClient]);

  const deleteItem = useCallback(async (id: string): Promise<any> => {
    if (RN_CONFIG.ENABLE_LOGS) {
      console.log(`🔍 useBaseQuery.deleteItem çağrıldı: ${database}.${collection}`, { id });
    }
    
    try {
      const payload = createPayload('delete', id);
      // HttpClient otomatik olarak x-user-token ve x-api-key header'larını MongoDB çağrıları için ekliyor
      const result = await httpClient.post(MONGO_API.BASE_URL, payload);
      
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log(`✅ useBaseQuery.deleteItem başarılı: ${database}.${collection}`, { id });
      }
      
      return result;
    } catch (error) {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.error(`❌ useBaseQuery.deleteItem hata: ${database}.${collection}`, { id, error });
      }
      throw error;
    }
  }, [createPayload, database, collection, httpClient]);

  // Query invalidation helpers
  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: baseQueryKey });
  }, [queryClient, baseQueryKey]);

  const invalidateOne = useCallback((id: string) => {
    queryClient.invalidateQueries({ queryKey: [...baseQueryKey, id] });
  }, [queryClient, baseQueryKey]);

  // React Query Hook Factories
  const useList = (
    params: Partial<MongoGetParams> = {},
    options: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'> = {}
  ) => {
    return useQuery({
      queryKey: [...baseQueryKey, 'list', params],
      queryFn: () => fetchList(params),
      // React Native optimizasyonları
      staleTime: 5 * 60 * 1000, // 5 dakika
      gcTime: 10 * 60 * 1000, // 10 dakika (eski adı: cacheTime)
      retry: (failureCount, error) => {
        if (RN_CONFIG.ENABLE_LOGS) {
          console.log(`🔄 useBaseQuery.useList retry: ${failureCount}`, error);
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      ...options,
    });
  };

  const useOne = (
    id: string,
    options: Omit<UseQueryOptions<T | null, Error>, 'queryKey' | 'queryFn'> = {}
  ) => {
    return useQuery({
      queryKey: [...baseQueryKey, id],
      queryFn: () => fetchOne(id),
      enabled: !!id,
      // React Native optimizasyonları
      staleTime: 5 * 60 * 1000, // 5 dakika
      gcTime: 10 * 60 * 1000, // 10 dakika (eski adı: cacheTime)
      retry: (failureCount, error) => {
        if (RN_CONFIG.ENABLE_LOGS) {
          console.log(`🔄 useBaseQuery.useOne retry: ${failureCount}`, { id, error });
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      ...options,
    });
  };

  const useCreate = (
    options: UseMutationOptions<T, Error, Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'creatorId' | 'updaterId'>> = {}
  ) => {
    return useMutation({
      mutationFn: createItem,
      onSuccess: (newItem) => {
        if (RN_CONFIG.ENABLE_LOGS) {
          console.log(`✅ useBaseQuery.useCreate başarılı: ${database}.${collection}`, { newItem });
        }
        // Optimistic update
        queryClient.setQueryData(baseQueryKey, (old: T[] | undefined) => 
          old ? [...old, newItem] : [newItem]
        );
        invalidateList();
      },
      onError: (error) => {
        if (RN_CONFIG.ENABLE_LOGS) {
          console.error(`❌ useBaseQuery.useCreate hata: ${database}.${collection}`, error);
        }
      },
      // React Native optimizasyonları
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      ...options,
    });
  };

  const useUpdate = (
    options: UseMutationOptions<T, Error, { id: string; data: Partial<T> }> = {}
  ) => {
    return useMutation({
      mutationFn: ({ id, data }) => updateItem(id, data),
      onSuccess: (updatedItem, { id }) => {
        if (RN_CONFIG.ENABLE_LOGS) {
          console.log(`✅ useBaseQuery.useUpdate başarılı: ${database}.${collection}`, { id, updatedItem });
        }
        // Optimistic update
        queryClient.setQueryData([...baseQueryKey, id], updatedItem);
        queryClient.setQueryData(baseQueryKey, (old: T[] | undefined) =>
          old ? old.map(item => 
            item.id === id ? updatedItem : item
          ) : []
        );
        invalidateList();
        invalidateOne(id);
      },
      onError: (error, { id }) => {
        if (RN_CONFIG.ENABLE_LOGS) {
          console.error(`❌ useBaseQuery.useUpdate hata: ${database}.${collection}`, { id, error });
        }
      },
      // React Native optimizasyonları
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      ...options,
    });
  };

  const useDelete = (
    options: UseMutationOptions<any, Error, string> = {}
  ) => {
    return useMutation({
      mutationFn: deleteItem,
      onSuccess: (_, id) => {
        if (RN_CONFIG.ENABLE_LOGS) {
          console.log(`✅ useBaseQuery.useDelete başarılı: ${database}.${collection}`, { id });
        }
        // Optimistic update
        queryClient.removeQueries({ queryKey: [...baseQueryKey, id] });
        queryClient.setQueryData(baseQueryKey, (old: T[] | undefined) =>
          old ? old.filter(item => item.id !== id) : []
        );
        invalidateList();
      },
      onError: (error, id) => {
        if (RN_CONFIG.ENABLE_LOGS) {
          console.error(`❌ useBaseQuery.useDelete hata: ${database}.${collection}`, { id, error });
        }
      },
      // React Native optimizasyonları
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      ...options,
    });
  };

  return {
    useList,
    useOne,
    useCreate,
    useUpdate,
    useDelete,
    fetchList,
    fetchOne,
    createItem,
    updateItem,
    deleteItem,
    invalidateList,
    invalidateOne,
  };
}