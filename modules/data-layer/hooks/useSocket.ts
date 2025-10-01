import { useCallback, useEffect, useRef, useState } from 'react';
import { socketService, SocketState } from '../services/socketService';
import { SocketMongo } from '../types/mongo';

/**
 * Socket hook options
 */
interface UseSocketOptions {
  autoConnect?: boolean;
  database?: string;
  collection?: string;
  serviceName?: string;
}

/**
 * Socket hook return type
 */
interface UseSocketReturn {
  // State
  socketState: SocketState;
  isConnected: boolean;
  isAuthenticated: boolean;
  
  // Methods
  connect: () => void;
  disconnect: () => void;
  subscribeToCollection: (
    database: string,
    collection: string,
    serviceName: string,
    callback: (data: SocketMongo) => void
  ) => () => void;
  
  // Events
  onSocketUpdate: (callback: (data: SocketMongo) => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;
}

/**
 * Socket hook - React uygulamaları için socket yönetimi
 * Tek sorumluluk: Socket bağlantısını React lifecycle'ına entegre etmek
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { 
    autoConnect = true, 
    database, 
    collection, 
    serviceName = 'useSocket' 
  } = options;

  const [socketState, setSocketState] = useState<SocketState>(socketService.getState());
  const cleanupFunctionsRef = useRef<Set<() => void>>(new Set());
  const isInitializedRef = useRef(false);

  // Socket state değişikliklerini dinle
  useEffect(() => {
    const unsubscribe = socketService.onStateChange((state) => {
      setSocketState(state);
    });

    cleanupFunctionsRef.current.add(unsubscribe);
    return unsubscribe;
  }, []);

  // Auto connect
  useEffect(() => {
    if (autoConnect && !isInitializedRef.current) {
      socketService.initialize().catch(error => {
        console.error('Socket başlatma hatası:', error);
      });
      isInitializedRef.current = true;
    }
  }, [autoConnect]);

  // Auto subscribe to collection if provided
  useEffect(() => {
    if (database && collection && socketState.isAuthenticated) {
      const unsubscribe = socketService.subscribeToCollection(
        database,
        collection,
        serviceName,
        (data) => {
          console.log(`📡 ${serviceName} socket güncellemesi:`, data);
        }
      );

      cleanupFunctionsRef.current.add(unsubscribe);
      return unsubscribe;
    }
  }, [database, collection, serviceName, socketState.isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current.clear();
    };
  }, []);

  // Methods
  const connect = useCallback(() => {
    socketService.initialize().catch(error => {
      console.error('Socket başlatma hatası:', error);
    });
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  const subscribeToCollection = useCallback((
    database: string,
    collection: string,
    serviceName: string,
    callback: (data: SocketMongo) => void
  ) => {
    const unsubscribe = socketService.subscribeToCollection(
      database,
      collection,
      serviceName,
      callback
    );

    cleanupFunctionsRef.current.add(unsubscribe);
    return unsubscribe;
  }, []);

  const onSocketUpdate = useCallback((callback: (data: SocketMongo) => void) => {
    if (!database || !collection) {
      console.warn('useSocket: database ve collection belirtilmeden onSocketUpdate kullanılamaz');
      return () => {};
    }

    return subscribeToCollection(database, collection, serviceName, callback);
  }, [database, collection, serviceName, subscribeToCollection]);

  const onError = useCallback((callback: (error: string) => void) => {
    const unsubscribe = socketService.onError(callback);
    cleanupFunctionsRef.current.add(unsubscribe);
    return unsubscribe;
  }, []);

  return {
    // State
    socketState,
    isConnected: socketState.isConnected,
    isAuthenticated: socketState.isAuthenticated,
    
    // Methods
    connect,
    disconnect,
    subscribeToCollection,
    
    // Events
    onSocketUpdate,
    onError,
  };
}

/**
 * Specific collection için socket hook
 */
export function useCollectionSocket(
  database: string,
  collection: string,
  serviceName: string = 'useCollectionSocket'
) {
  const [updates, setUpdates] = useState<SocketMongo[]>([]);
  const [lastUpdate, setLastUpdate] = useState<SocketMongo | null>(null);

  const socket = useSocket({
    autoConnect: true,
    database,
    collection,
    serviceName
  });

  useEffect(() => {
    const unsubscribe = socket.onSocketUpdate((data) => {
      console.log(`📡 ${database}.${collection} güncellendi:`, data);
      
      // Rezervasyon collection'ı için özel logging
      if (database === 'restaurant' && collection === 'reservations') {
        console.group(`🍽️ ${serviceName} - REZERVASYON GÜNCELLEMESİ`);
        console.log('⏰ Hook Zamanı:', new Date().toLocaleString('tr-TR'));
        console.log('🔄 İşlem:', data.operationType);
        
        if (data.operationType === 'insert') {
          console.log('✨ Yeni rezervasyon hook\'ta alındı');
        } else if (data.operationType === 'update') {
          console.log('🔄 Rezervasyon güncelleme hook\'ta alındı');
        } else if (data.operationType === 'delete') {
          console.log('🗑️ Rezervasyon silme hook\'ta alındı');
        }
        
        console.log('📋 Hook Veri:', data);
        console.groupEnd();
      }
      
      setLastUpdate(data);
      setUpdates(prev => [...prev.slice(-9), data]); // Son 10 güncellemeyi tut
    });

    return unsubscribe;
  }, [socket, database, collection, serviceName]);

  return {
    ...socket,
    updates,
    lastUpdate,
    clearUpdates: () => setUpdates([])
  };
}

/**
 * Global socket state hook - sadece state'i dinler
 */
export function useSocketState() {
  const [socketState, setSocketState] = useState<SocketState>(socketService.getState());

  useEffect(() => {
    const unsubscribe = socketService.onStateChange(setSocketState);
    return unsubscribe;
  }, []);

  return socketState;
}
