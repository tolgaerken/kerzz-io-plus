import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
import { BaseModel, MongoGetParams, MongoPayload } from '../types/mongo';
import { generateMaxiId } from '../utils/idGenerator';
import { MONGO_API } from '../constants';

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
    const fetchParams: MongoGetParams = {
      col: collection,
      db: database,
      filter: {},
      sort: {},
      project: {},
      ...params,
    };

    const payload = buildMongoPayload('get', fetchParams);
    // HttpClient otomatik olarak x-user-token ve x-api-key header'larını MongoDB çağrıları için ekliyor
    return await httpClient.post<T[]>(MONGO_API.BASE_URL, payload);
  }, [database, collection, buildMongoPayload]);

  const fetchOne = useCallback(async (id: string): Promise<T | null> => {
    if (!id) return null;
    
    const items = await fetchList({ filter: { id } });
    return items.length > 0 ? items[0] : null;
  }, [fetchList]);

  const createItem = useCallback(async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'creatorId' | 'updaterId'>): Promise<T> => {
    const targetId = generateMaxiId();
    const itemData = {
      ...data,
      id: targetId,
      createdAt: new Date(),
      updatedAt: new Date(),
      creatorId: userInfo?.id,
    } as any;

    const payload = createPayload('upsert', targetId, itemData);
    // HttpClient otomatik olarak x-user-token ve x-api-key header'larını MongoDB çağrıları için ekliyor
    return await httpClient.post<T>(MONGO_API.BASE_URL, payload);
  }, [createPayload, userInfo]);

  const updateItem = useCallback(async (id: string, data: Partial<T>): Promise<T> => {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      updaterId: userInfo?.id,
    };

    const payload = createPayload('upsert', id, updateData);
    // HttpClient otomatik olarak x-user-token ve x-api-key header'larını MongoDB çağrıları için ekliyor
    return await httpClient.post<T>(MONGO_API.BASE_URL, payload);
  }, [createPayload, userInfo]);

  const deleteItem = useCallback(async (id: string): Promise<any> => {
    const payload = createPayload('delete', id);
    // HttpClient otomatik olarak x-user-token ve x-api-key header'larını MongoDB çağrıları için ekliyor
    return await httpClient.post(MONGO_API.BASE_URL, payload);
  }, [createPayload]);

  // Query invalidation helpers
  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: baseQueryKey });
  }, [queryClient, baseQueryKey]);

  const invalidateOne = useCallback((id: string) => {
    queryClient.invalidateQueries({ queryKey: [...baseQueryKey, id] });
  }, [queryClient, baseQueryKey]);

  // React Query Hooks
  const useList = useCallback((
    params: Partial<MongoGetParams> = {},
    options: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'> = {}
  ) => {
    return useQuery({
      queryKey: [...baseQueryKey, 'list', params],
      queryFn: () => fetchList(params),
      ...options,
    });
  }, [baseQueryKey, fetchList]);

  const useOne = useCallback((
    id: string,
    options: Omit<UseQueryOptions<T | null, Error>, 'queryKey' | 'queryFn'> = {}
  ) => {
    return useQuery({
      queryKey: [...baseQueryKey, id],
      queryFn: () => fetchOne(id),
      enabled: !!id,
      ...options,
    });
  }, [baseQueryKey, fetchOne]);

  const useCreate = useCallback((
    options: UseMutationOptions<T, Error, Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'creatorId' | 'updaterId'>> = {}
  ) => {
    return useMutation({
      mutationFn: createItem,
      onSuccess: (newItem) => {
        // Optimistic update
        queryClient.setQueryData(baseQueryKey, (old: T[] | undefined) => 
          old ? [...old, newItem] : [newItem]
        );
        invalidateList();
      },
      ...options,
    });
  }, [createItem, queryClient, baseQueryKey, invalidateList]);

  const useUpdate = useCallback((
    options: UseMutationOptions<T, Error, { id: string; data: Partial<T> }> = {}
  ) => {
    return useMutation({
      mutationFn: ({ id, data }) => updateItem(id, data),
      onSuccess: (updatedItem, { id }) => {
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
      ...options,
    });
  }, [updateItem, queryClient, baseQueryKey, invalidateList, invalidateOne]);

  const useDelete = useCallback((
    options: UseMutationOptions<any, Error, string> = {}
  ) => {
    return useMutation({
      mutationFn: deleteItem,
      onSuccess: (_, id) => {
        // Optimistic update
        queryClient.removeQueries({ queryKey: [...baseQueryKey, id] });
        queryClient.setQueryData(baseQueryKey, (old: T[] | undefined) =>
          old ? old.filter(item => item.id !== id) : []
        );
        invalidateList();
      },
      ...options,
    });
  }, [deleteItem, queryClient, baseQueryKey, invalidateList]);

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