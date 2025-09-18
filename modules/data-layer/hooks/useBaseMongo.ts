import { isEqual } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MONGO_API, RN_CONFIG } from '../constants';
import { socketService } from '../services/socketService';
import {
  BaseModel,
  BaseMongoHook,
  BaseMongoOptions,
  BaseMongoState,
  MongoGetParams,
  MongoPayload,
  SocketMongo
} from '../types/mongo';
import { generateMaxiId } from '../utils/idGenerator';

// External dependencies interfaces
interface AuthStore {
  userInfo?: any;
}

interface HttpClient {
  post<T>(url: string, body: any, headers?: Record<string, string>, trackLoading?: boolean): Promise<T>;
}

// Extended options with external dependencies
interface ExtendedBaseMongoOptions extends BaseMongoOptions {
  httpClient: HttpClient;
  authStore: AuthStore;
}

/**
 * Base MongoDB Hook - Angular TBaseMongoService'den React'e uyarlandı
 * React hook olarak MongoDB CRUD operasyonları için kullanılır
 */
export function useBaseMongo<T extends BaseModel>(
  options: ExtendedBaseMongoOptions
): BaseMongoHook<T> {
  const { database, collection, autoFetch = false, socketUpdates = false, httpClient, authStore } = options;

  // Auth store'dan kullanıcı bilgilerini al
  const { userInfo } = authStore;
  
  // State management
  const [state, setState] = useState<BaseMongoState<T>>({
    items: [],
    activeItem: null,
    isLoading: false,
    isFetching: false,
    error: null,
    lastFetchParams: null,
  });

  // Static items cache
  const staticItemsRef = useRef<T[]>([]);
  
  // Socket updates callback refs
  const socketCallbacksRef = useRef<Set<(data: SocketMongo) => void>>(new Set());
  const fetchCallbacksRef = useRef<Set<(completed: boolean) => void>>(new Set());
  
  // Backup filter ve projection
  const backupFilterRef = useRef<{ filter: any; sort: any; db: string; col: string }>({ 
    filter: {}, 
    sort: {}, 
    db: '', 
    col: '' 
  });
  const backupProjectionRef = useRef<any>({});

  // MongoDB API URL
  const postMongoUrl = MONGO_API.BASE_URL;


  /**
   * Payload oluştur
   */
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
        // Yeni kayıt: boş id ile filter gönderme
        payload.filter = {};
      }
    }

    return payload;
  }, [database, collection]);

  /**
   * MongoDB payload oluştur
   */
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

  /**
   * Collection getir
   */
  const getCollection = useCallback(async (params: MongoGetParams): Promise<T[]> => {
    const payload = buildMongoPayload('get', params);
    // HttpClient otomatik olarak x-user-token ve x-api-key header'larını MongoDB çağrıları için ekliyor
    const result = await httpClient.post<T[]>(postMongoUrl, payload);
    return result;
  }, [buildMongoPayload, postMongoUrl, httpClient]);

  /**
   * Veri getirilmeli mi kontrol et
   */
  const shouldFetchData = useCallback((
    filter: any,
    sort: any,
    project: any,
    force: boolean
  ): boolean => {
    return (
      state.items.length === 0 ||
      force ||
      !isEqual(filter, backupFilterRef.current.filter) ||
      !isEqual(sort, backupFilterRef.current.sort) ||
      !isEqual(project, backupProjectionRef.current)
    );
  }, [state.items.length]);

  /**
   * Sadece veri getir (state güncellemesi yapmadan)
   */
  const fetchDataOnly = useCallback(async (params: Partial<MongoGetParams> = {}): Promise<T[]> => {
    if (!database || !collection) {
      throw new Error('Database or collection not specified');
    }

    const fetchParams: MongoGetParams = {
      col: collection,
      db: database,
      filter: {},
      sort: {},
      project: {},
      ...params,
    };

    setState(prev => ({ ...prev, isFetching: true, error: null }));

    try {
      const items = await getCollection(fetchParams);
      
      setState(prev => ({ ...prev, isFetching: false }));
      
      // Fetch completed callbacks'leri tetikle
      fetchCallbacksRef.current.forEach(callback => callback(true));
      
      return items;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isFetching: false, 
        error: error instanceof Error ? error.message : 'Fetch error' 
      }));
      
      fetchCallbacksRef.current.forEach(callback => callback(false));
      throw error;
    }
  }, [database, collection, getCollection]);

  /**
   * Veri getir ve state'i güncelle
   */
  const fetchData = useCallback(async (params: Partial<MongoGetParams> = {}): Promise<T[]> => {
    if (RN_CONFIG.ENABLE_LOGS) {
      console.log(`🔍 fetchData çağrıldı: ${database}.${collection}`, { params });
    }
    
    if (!database || !collection) {
      throw new Error('Database or collection not specified');
    }

    const fetchParams: MongoGetParams = {
      col: collection,
      db: database,
      filter: {},
      sort: {},
      project: {},
      ...params,
    };

    if (shouldFetchData(fetchParams.filter, fetchParams.sort, fetchParams.project, false)) {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log(`🚀 Veri çekiliyor: ${database}.${collection}`);
      }
      backupFilterRef.current = { 
        filter: fetchParams.filter!, 
        sort: fetchParams.sort!, 
        db: fetchParams.db!, 
        col: fetchParams.col 
      };
      backupProjectionRef.current = fetchParams.project;

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const items = await getCollection(fetchParams);
        if (RN_CONFIG.ENABLE_LOGS) {
          console.log(`✅ Veri çekildi: ${database}.${collection}, ${items.length} item`);
        }
        
        setState(prev => ({ 
          ...prev, 
          items, 
          isLoading: false,
          lastFetchParams: fetchParams 
        }));
        
        fetchCallbacksRef.current.forEach(callback => callback(true));
        
        return items;
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Fetch error' 
        }));
        
        fetchCallbacksRef.current.forEach(callback => callback(false));
        throw error;
      }
    } else {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log(`⏭️  Fetch atlandı (cache kullanıldı): ${database}.${collection}`);
      }
      return Promise.resolve(state.items);
    }
  }, [database, collection, shouldFetchData, getCollection, state.items]);

  /**
   * Upsert işlemi
   */
  const upsert = useCallback(async (id: string = '', data: Partial<T>): Promise<T> => {
    const targetId = (id && id.trim().length > 0) ? id : ((data as any)?.id || (generateMaxiId() as any));
    (data as any).id = targetId;

    // Zaman damgalarını ekle
    if (!data.createdAt) {
      data.updatedAt = new Date();
      data.creatorId = userInfo?.id;
      data.createdAt = new Date();
    } else {
      data.updatedAt = new Date();
      data.updaterId = userInfo?.id;
    }

    const payload = createPayload('upsert', targetId, data);
    
    try {
      const response = await httpClient.post<T>(postMongoUrl, payload);
      const realId = (response as any)?.id || (data as any)?.id || targetId;
      
      // Local state'i güncelle
      setState(prev => {
        const index = prev.items.findIndex(item => (item as any).id === realId);
        
        if (index !== -1) {
          // Mevcut öğeyi güncelle
          const updatedItem: T = { ...prev.items[index], ...response } as T;
          const newItems = [
            ...prev.items.slice(0, index),
            updatedItem,
            ...prev.items.slice(index + 1),
          ];
          return { ...prev, items: newItems };
        } else {
          // Yeni öğe ekle
          const newItem: T = { id: realId, ...(response as any) } as T;
          return { ...prev, items: [...prev.items, newItem] };
        }
      });
      
      return response;
    } catch (error) {
      console.error('Upsert error:', error);
      throw error;
    }
  }, [createPayload, postMongoUrl, userInfo, httpClient]);

  /**
   * Silme işlemi
   */
  const deleteRecord = useCallback(async (idOrFilter: string | object): Promise<any> => {
    if (!idOrFilter) {
      throw new Error('ID or filter object is required for delete operation');
    }

    const payload = createPayload('delete', idOrFilter, undefined);
    
    try {
      const response = await httpClient.post(postMongoUrl, payload);
      
      if (typeof idOrFilter === 'string') {
        // Local state'ten sil
        setState(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id !== idOrFilter)
        }));
      }
      
      return response;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }, [createPayload, postMongoUrl, httpClient]);

  /**
   * Active item set et
   */
  const setActiveItem = useCallback((item: T | null) => {
    setState(prev => ({ ...prev, activeItem: item }));
  }, []);

  /**
   * Item upsert et (local state)
   */
  const upsertItem = useCallback((id: string, data: Partial<T>) => {
    setState(prev => {
      const index = prev.items.findIndex(item => (item as any).id === id);
      
      if (index !== -1) {
        // Mevcut öğeyi güncelle
        const updatedItem: T = { ...prev.items[index], ...data } as T;
        const newItems = [
          ...prev.items.slice(0, index),
          updatedItem,
          ...prev.items.slice(index + 1),
        ];
        return { ...prev, items: newItems };
      } else {
        // Yeni öğe ekle
        const newItem: T = { id, ...(data as any) } as T;
        return { ...prev, items: [...prev.items, newItem] };
      }
    });
  }, []);

  /**
   * Item güncelle (local state)
   */
  const updateItem = useCallback((id: string, data: Partial<T>): boolean => {
    let updated = false;
    
    setState(prev => {
      const index = prev.items.findIndex(item => (item as any).id === id);
      
      if (index !== -1) {
        const updatedItem: T = { ...prev.items[index], ...data } as T;
        const newItems = [
          ...prev.items.slice(0, index),
          updatedItem,
          ...prev.items.slice(index + 1),
        ];
        updated = true;
        return { ...prev, items: newItems };
      }
      
      return prev;
    });
    
    return updated;
  }, []);

  /**
   * Item sil (local state)
   */
  const deleteItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  }, []);

  /**
   * Servisi sıfırla
   */
  const resetService = useCallback(() => {
    setState({
      items: [],
      activeItem: null,
      isLoading: false,
      isFetching: false,
      error: null,
      lastFetchParams: null,
    });
    
    staticItemsRef.current = [];
    backupFilterRef.current = { filter: {}, sort: {}, db: '', col: '' };
    backupProjectionRef.current = {};
  }, []);

  /**
   * Static items getir
   */
  const getStaticItems = useCallback((): T[] => {
    if (staticItemsRef.current.length === 0) {
      staticItemsRef.current = [...state.items];
    }
    return staticItemsRef.current;
  }, [state.items]);

  /**
   * Static items set et
   */
  const setStaticItems = useCallback(() => {
    staticItemsRef.current = [...state.items];
  }, [state.items]);

  /**
   * Socket updates callback ekle
   */
  const onSocketUpdates = useCallback((callback: (data: SocketMongo) => void) => {
    socketCallbacksRef.current.add(callback);
    
    // Cleanup function döndür
    return () => {
      socketCallbacksRef.current.delete(callback);
    };
  }, []);

  /**
   * Fetch completed callback ekle
   */
  const onFetchCompleted = useCallback((callback: (completed: boolean) => void) => {
    fetchCallbacksRef.current.add(callback);
    
    // Cleanup function döndür
    return () => {
      fetchCallbacksRef.current.delete(callback);
    };
  }, []);

  /**
   * Socket değişikliklerini handle et
   */
  const handleSocketChange = useCallback((socketData: SocketMongo) => {
    if (socketData.ns.db !== database || socketData.ns.coll !== collection) {
      return; // Bu collection'a ait değilse ignore et
    }

    console.group(`🔄 useBaseMongo State Güncellemesi: ${database}.${collection}`);
    console.log('⏰ State Güncelleme Zamanı:', new Date().toLocaleString('tr-TR'));
    console.log('🔄 İşlem:', socketData.operationType);

    switch (socketData.operationType) {
      case 'insert':
        if (socketData.fullDocument) {
          console.log('➕ State\'e yeni kayıt ekleniyor:', {
            id: socketData.fullDocument.id,
            collection: collection
          });
          
          // Rezervasyon için özel log
          if (database === 'restaurant' && collection === 'reservations') {
            console.log('🍽️ State\'e yeni rezervasyon eklendi:', {
              müşteri: `${socketData.fullDocument.customer?.firstName || ''} ${socketData.fullDocument.customer?.lastName || ''}`.trim(),
              durum: socketData.fullDocument.status
            });
          }
          
          upsertItem(socketData.fullDocument.id, socketData.fullDocument);
        }
        break;
        
      case 'update':
        if (socketData.documentKey?.id) {
          console.log('📝 State\'te kayıt güncelleniyor:', {
            id: socketData.documentKey.id,
            updatedFields: socketData.updateDescription?.updatedFields
          });
          
          // Rezervasyon için özel log
          if (database === 'restaurant' && collection === 'reservations' && socketData.updateDescription?.updatedFields?.status) {
            console.log('🔄 State\'te rezervasyon durumu güncellendi:', {
              id: socketData.documentKey.id,
              yeniDurum: socketData.updateDescription.updatedFields.status
            });
          }
          
          if (socketData.updateDescription?.updatedFields) {
            updateItem(socketData.documentKey.id, socketData.updateDescription.updatedFields);
          }
        }
        break;
        
      case 'delete':
        if (socketData.documentKey?.id) {
          console.log('🗑️ State\'ten kayıt siliniyor:', {
            id: socketData.documentKey.id,
            collection: collection
          });
          
          // Rezervasyon için özel log
          if (database === 'restaurant' && collection === 'reservations') {
            console.log('🍽️ State\'ten rezervasyon silindi:', socketData.documentKey.id);
          }
          
          deleteItem(socketData.documentKey.id);
        }
        break;
        
      default:
        console.log('❓ Bilinmeyen socket operasyonu:', socketData.operationType);
    }
    
    console.groupEnd();
  }, [database, collection, upsertItem, updateItem, deleteItem]);

  // Socket integration effect
  useEffect(() => {
    if (socketUpdates && database && collection) {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log(`🔌 Socket dinleyicisi başlatılıyor: ${database}.${collection}`);
      }
      
      // Socket service'i başlat
      socketService.initialize();
      
      // Unique service name oluştur (her hook instance için farklı)
      const serviceName = `useBaseMongo-${collection}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Collection değişikliklerini dinle
      const unsubscribe = socketService.subscribeToCollection(
        database,
        collection,
        serviceName,
        (socketData: SocketMongo) => {
          if (RN_CONFIG.ENABLE_LOGS) {
            console.group(`📡 useBaseMongo Socket Güncellemesi: ${database}.${collection}`);
            console.log('⏰ Zaman:', new Date().toLocaleString('tr-TR'));
            console.log('🔄 İşlem Türü:', socketData.operationType);
            console.log('🆔 Doküman ID:', socketData.documentKey?.id || 'Bilinmiyor');
            
            // Rezervasyon collection'ı için özel logging
            if (database === 'restaurant' && collection === 'reservations') {
              console.log('🍽️ REZERVASYON SOCKET GÜNCELLEMESİ - useBaseMongo');
              
              if (socketData.operationType === 'insert' && socketData.fullDocument) {
                console.log('➕ Yeni Rezervasyon (useBaseMongo):', {
                  müşteri: `${socketData.fullDocument.customer?.firstName || ''} ${socketData.fullDocument.customer?.lastName || ''}`.trim(),
                  telefon: socketData.fullDocument.customer?.phone,
                  tarih: socketData.fullDocument.reservationDate,
                  saat: socketData.fullDocument.reservationTime,
                  masaId: socketData.fullDocument.tableId,
                  durum: socketData.fullDocument.status,
                  kişiSayısı: socketData.fullDocument.partySize
                });
              }
              
              if (socketData.operationType === 'update' && socketData.updateDescription?.updatedFields) {
                console.log('📝 Rezervasyon Güncelleme (useBaseMongo):', {
                  id: socketData.documentKey?.id,
                  güncellenenAlanlar: socketData.updateDescription.updatedFields
                });
                
                if (socketData.updateDescription.updatedFields.status) {
                  console.log('🔄 Durum Değişikliği (useBaseMongo):', socketData.updateDescription.updatedFields.status);
                }
              }
              
              if (socketData.operationType === 'delete') {
                console.log('🗑️ Rezervasyon Silindi (useBaseMongo)');
              }
            }
            
            console.log('📊 Ham Socket Verisi:', socketData);
            console.groupEnd();
          }
          
          // Socket callback'lerini tetikle
          socketCallbacksRef.current.forEach(callback => {
            try {
              callback(socketData);
            } catch (error) {
              if (RN_CONFIG.ENABLE_LOGS) {
                console.error('❌ Socket callback hatası:', error);
              }
            }
          });
          
          // Otomatik state güncellemesi
          handleSocketChange(socketData);
        }
      );
      
      return () => {
        if (RN_CONFIG.ENABLE_LOGS) {
          console.log(`🔌 Socket dinleyicisi kapatılıyor: ${database}.${collection}`);
        }
        unsubscribe();
      };
    }
  }, [socketUpdates, database, collection, handleSocketChange]);

  // Auto fetch effect
  useEffect(() => {
    if (autoFetch && database && collection) {
      fetchData().catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, database, collection]);

  return {
    // State
    ...state,
    
    // Data operations
    fetchData,
    fetchDataOnly,
    upsert,
    delete: deleteRecord,
    
    // Item operations
    setActiveItem,
    upsertItem,
    updateItem,
    deleteItem,
    
    // Utility functions
    resetService,
    getStaticItems,
    setStaticItems,
    
    // Socket events
    onSocketUpdates,
    onFetchCompleted,
  };
}
