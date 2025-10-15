import { Platform } from 'react-native';
import type { Socket } from 'socket.io-client';
import { RN_CONFIG, SOCKET_CONFIG } from '../constants';
import { SocketMongo } from '../types/mongo';

// Platform-specific lazy loading
let socketIOModule: any = null;
const loadSocketIO = async () => {
  if (socketIOModule) return socketIOModule;
  
  try {
    if (Platform.OS === 'web') {
      const module = await import('socket.io-client');
      socketIOModule = module;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      socketIOModule = require('socket.io-client');
    }
    return socketIOModule;
  } catch (error) {
    console.error('❌ socket.io-client yüklenemedi:', error);
    throw error;
  }
};

/**
 * Socket bağlantı durumu interface'i
 */
export interface SocketState {
  isConnected: boolean;
  isAuthenticated: boolean;
  lastError?: string;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastConnectionTime?: Date;
  lastDataTime?: Date;
  lastCollection?: string;
  onCollectionChange: boolean;
  lastUpdate?: {
    time: Date;
    collection: string;
  };
}

/**
 * Socket subscription bilgileri
 */
interface SocketSubscription {
  database: string;
  collection: string;
  serviceName: string;
  attempts?: number;
}

/**
 * Collection değişiklik callback tipi
 */
type CollectionChangeCallback = (data: SocketMongo) => void;

/**
 * Socket Service - Tek sorumluluk prensibi ile tasarlanmış
 * Sadece socket bağlantısı ve MongoDB change stream'lerini yönetir
 */
export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isInitialized = false;
  private isAuthenticated = false;
  private heartbeatInterval: number | null = null;
  
  // Subscription yönetimi
  private pendingSubscriptions: SocketSubscription[] = [];
  private collectionObservers = new Map<string, Set<CollectionChangeCallback>>();
  private activeSubscriptions = new Set<string>(); // Aktif subscription'ları takip et
  
  // State yönetimi
  private socketState: SocketState = {
    isConnected: false,
    isAuthenticated: false,
    connectionStatus: 'disconnected',
    onCollectionChange: false
  };
  
  // Event listeners
  private stateChangeListeners = new Set<(state: SocketState) => void>();
  private errorListeners = new Set<(error: string) => void>();

  private constructor() {
    // Singleton pattern
  }

  /**
   * Singleton instance getter
   */
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Socket bağlantısını başlat
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (RN_CONFIG.ENABLE_LOGS) {
      console.log(`🔌 Socket service başlatılıyor... (${Platform.OS})`);
    }
    
    // Socket.io modülünü yükle
    const socketModule = await loadSocketIO();
    const io = socketModule.io;
    
    // React Native için optimize edilmiş socket konfigürasyonu
    const socketOptions = {
      reconnection: SOCKET_CONFIG.RECONNECTION.ENABLED,
      reconnectionDelay: SOCKET_CONFIG.RECONNECTION.DELAY,
      reconnectionDelayMax: SOCKET_CONFIG.RECONNECTION.DELAY_MAX,
      reconnectionAttempts: SOCKET_CONFIG.RECONNECTION.ATTEMPTS,
      autoConnect: false,
      forceNew: RN_CONFIG.SOCKET_OPTIONS.forceNew,
      transports: [...RN_CONFIG.SOCKET_OPTIONS.transports], // Mutable array oluştur
      upgrade: RN_CONFIG.SOCKET_OPTIONS.upgrade,
      rememberUpgrade: RN_CONFIG.SOCKET_OPTIONS.rememberUpgrade,
    };

    this.socket = io(SOCKET_CONFIG.URL, socketOptions);

    this.setupSocketListeners();
    this.setupHeartbeat();
    if (this.socket) {
      this.socket.connect();
    }
    this.isInitialized = true;
  }

  /**
   * Collection değişikliklerini dinle
   */
  public subscribeToCollection(
    database: string, 
    collection: string, 
    serviceName: string,
    callback: CollectionChangeCallback
  ): () => void {
    const subscriptionKey = this.getSubscriptionKey(database, collection, serviceName);
    const collectionKey = `${database}:${collection}`; // Collection bazlı key
    
    // Callback'i kaydet
    if (!this.collectionObservers.has(subscriptionKey)) {
      this.collectionObservers.set(subscriptionKey, new Set());
    }
    this.collectionObservers.get(subscriptionKey)!.add(callback);

    // Bu collection için henüz subscription yoksa socket'e subscribe ol
    if (!this.activeSubscriptions.has(collectionKey)) {
      this.activeSubscriptions.add(collectionKey);
      
      if (this.isAuthenticated) {
        this.subscribeToCollectionSocket({ database, collection, serviceName, attempts: 0 });
      } else {
        // Pending'e eklerken duplicate kontrolü yap
        const existingPending = this.pendingSubscriptions.find(
          sub => sub.database === database && sub.collection === collection
        );
        if (!existingPending) {
          this.pendingSubscriptions.push({ database, collection, serviceName, attempts: 0 });
        }
      }
    } else {
      console.log(`⏭️ Collection zaten aktif: ${collectionKey}, yeni callback eklendi`);
    }

    // Cleanup function döndür
    return () => {
      const observers = this.collectionObservers.get(subscriptionKey);
      if (observers) {
        observers.delete(callback);
        if (observers.size === 0) {
          this.collectionObservers.delete(subscriptionKey);
          
          // Bu collection için başka observer kalmadıysa unsubscribe yap
          const hasOtherObservers = Array.from(this.collectionObservers.keys()).some(key => {
            const [db, coll] = key.split(':');
            return db === database && coll === collection;
          });
          
          if (!hasOtherObservers) {
            this.activeSubscriptions.delete(collectionKey);
            console.log(`🔌 Collection subscription temizlendi: ${collectionKey}`);
          }
        }
      }
    };
  }

  /**
   * Socket state değişikliklerini dinle
   */
  public onStateChange(callback: (state: SocketState) => void): () => void {
    this.stateChangeListeners.add(callback);
    // Mevcut state'i hemen gönder
    callback(this.socketState);
    
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }

  /**
   * Socket hatalarını dinle
   */
  public onError(callback: (error: string) => void): () => void {
    this.errorListeners.add(callback);
    
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  /**
   * Mevcut socket state'ini al
   */
  public getState(): SocketState {
    return { ...this.socketState };
  }

  /**
   * Socket bağlantısını kapat
   */
  public disconnect(): void {
    if (RN_CONFIG.ENABLE_LOGS) {
      console.log('🔌 Socket bağlantısı kapatılıyor...');
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.collectionObservers.clear();
    this.stateChangeListeners.clear();
    this.errorListeners.clear();
    this.activeSubscriptions.clear();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isInitialized = false;
    this.isAuthenticated = false;
  }

  // Private methods

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log('✅ Socket bağlandı');
      }
      this.isAuthenticated = false;
      this.updateSocketState({
        isConnected: true,
        connectionStatus: 'connected',
        lastConnectionTime: new Date(),
        lastError: undefined
      });
      this.resubscribeAll();
    });

    this.socket.on('disconnect', () => {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log('❌ Socket bağlantısı kesildi');
      }
      this.isAuthenticated = false;
      this.updateSocketState({
        isConnected: false,
        isAuthenticated: false,
        connectionStatus: 'disconnected'
      });
    });

    this.socket.on('reconnecting', () => {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log('🔄 Socket yeniden bağlanıyor...');
      }
      this.updateSocketState({
        connectionStatus: 'reconnecting'
      });
    });

    this.socket.on('wellcome', (data: any) => {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log('👋 Hoşgeldin mesajı alındı, login gönderiliyor', data);
      }
      this.socket?.emit('login', JSON.stringify({
        alias: SOCKET_CONFIG.AUTH.ALIAS,
        secretKey: SOCKET_CONFIG.AUTH.SECRET_KEY,
        data: ""
      }));
    });

    this.socket.on('login', () => {
      if (RN_CONFIG.ENABLE_LOGS) {
        console.log('🔐 Login başarılı');
      }
      this.isAuthenticated = true;
      this.updateSocketState({
        isAuthenticated: true
      });
      this.processPendingSubscriptions();
    });

    this.socket.on('changed-collection', (data: SocketMongo) => {
      console.log('📡 Collection değişikliği alındı:', data);
      
      // Rezervasyon güncellemeleri için özel log
      if (data.ns.db === 'restaurant' && data.ns.coll === 'reservations') {
        console.group('🍽️ REZERVASYON SOCKET GÜNCELLEMESİ');
        console.log('⏰ Zaman:', new Date().toLocaleString('tr-TR'));
        console.log('🔄 İşlem Türü:', data.operationType);
        console.log('🆔 Doküman ID:', data.documentKey?.id || 'Bilinmiyor');
        
        if (data.operationType === 'insert' && data.fullDocument) {
          console.log('➕ Yeni Rezervasyon:', {
            müşteri: `${data.fullDocument.customer?.firstName || ''} ${data.fullDocument.customer?.lastName || ''}`.trim(),
            telefon: data.fullDocument.customer?.phone,
            tarih: data.fullDocument.reservationDate,
            saat: data.fullDocument.reservationTime,
            masaId: data.fullDocument.tableId,
            durum: data.fullDocument.status,
            kişiSayısı: data.fullDocument.partySize
          });
        }
        
        if (data.operationType === 'update' && data.updateDescription?.updatedFields) {
          console.log('📝 Güncellenen Alanlar:', data.updateDescription.updatedFields);
          if (data.updateDescription.updatedFields.status) {
            console.log('🔄 Durum Değişikliği:', data.updateDescription.updatedFields.status);
          }
        }
        
        if (data.operationType === 'delete') {
          console.log('🗑️ Rezervasyon Silindi');
        }
        
        console.log('📊 Ham Veri:', data);
        console.groupEnd();
      }
      
      this.updateSocketState({
        lastUpdate: {
          time: new Date(),
          collection: `${data.ns.db}:${data.ns.coll}`
        },
        lastDataTime: new Date(),
        lastCollection: data.ns.coll,
        onCollectionChange: true
      });

      // Callback'leri hemen tetikle (throttle kaldırıldı)
      this.notifyCollectionObservers(data);
      
      // State'i hemen güncelle
      setTimeout(() => {
        this.updateSocketState({ onCollectionChange: false });
      }, 100);
    });

    // Error handling
    const errorEvents = [
      'error',
      'connect_error', 
      'connect_timeout',
      'reconnect_error',
      'reconnect_failed'
    ];

    errorEvents.forEach(event => {
      this.socket?.on(event, (error?: Error) => {
        const errorMessage = `${event}: ${error?.message || 'Bilinmeyen hata'}`;
        console.error('🚨 Socket hatası:', errorMessage);
        this.notifyErrorListeners(errorMessage);
        this.updateSocketState({
          connectionStatus: 'error',
          lastError: errorMessage
        });
      });
    });
  }

  private setupHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected && !this.isAuthenticated) {
        console.log('💓 Heartbeat: Authentication eksik, yeniden bağlanıyor...');
        this.socket.disconnect().connect();
      }
    }, SOCKET_CONFIG.HEARTBEAT_INTERVAL);
  }

  private subscribeToCollectionSocket(subscription: SocketSubscription): void {
    const { database, collection, serviceName } = subscription;

    if (this.socket && this.isAuthenticated) {
      console.log(`📡 Collection'a abone olunuyor: ${database}:${collection} (${serviceName})`);
      
      this.socket.emit('subscribe-collection', {
        dbName: database,
        collection
      }, (response: any) => {
        if (response?.error) {
          console.log('❌ Subscription başarısız, yeniden deneniyor...');
          this.retrySubscription(subscription);
        } else {
          console.log('✅ Subscription başarılı');
        }
      });
    } else {
      console.log('⏳ Subscription kuyruğa alındı - socket hazır değil');
      this.pendingSubscriptions.push(subscription);
    }
  }

  private retrySubscription(subscription: SocketSubscription): void {
    const { database, collection, attempts = 0 } = subscription;

    if (attempts < SOCKET_CONFIG.RETRY.MAX_ATTEMPTS) {
      console.log(`🔄 Subscription retry ${attempts + 1}/${SOCKET_CONFIG.RETRY.MAX_ATTEMPTS}`);
      
      setTimeout(() => {
        if (this.isAuthenticated) {
          this.subscribeToCollectionSocket({ ...subscription, attempts: attempts + 1 });
        } else {
          this.pendingSubscriptions.push({ ...subscription, attempts: attempts + 1 });
        }
      }, SOCKET_CONFIG.RETRY.DELAY * (attempts + 1));
    } else {
      const errorMessage = `Max retry attempts (${SOCKET_CONFIG.RETRY.MAX_ATTEMPTS}) reached for ${database}:${collection}`;
      console.error('❌', errorMessage);
      this.notifyErrorListeners(errorMessage);
    }
  }

  private processPendingSubscriptions(): void {
    console.log(`📋 ${this.pendingSubscriptions.length} bekleyen subscription işleniyor`);
    
    while (this.pendingSubscriptions.length > 0) {
      const subscription = this.pendingSubscriptions.shift();
      if (subscription) {
        this.subscribeToCollectionSocket(subscription);
      }
    }
  }

  private resubscribeAll(): void {
    console.log('🔄 Tüm collectionlara yeniden abone olunuyor');
    
    // Aktif subscription'ları temizle ve yeniden oluştur
    this.activeSubscriptions.clear();
    
    // Unique collection'ları bul
    const uniqueCollections = new Set<string>();
    this.collectionObservers.forEach((_, key) => {
      const [database, collection] = key.split(':');
      uniqueCollections.add(`${database}:${collection}`);
    });
    
    // Her unique collection için bir kez subscription ekle
    uniqueCollections.forEach(collectionKey => {
      const [database, collection] = collectionKey.split(':');
      
      const isPending = this.pendingSubscriptions.some(
        sub => sub.database === database && sub.collection === collection
      );

      if (!isPending) {
        this.pendingSubscriptions.push({
          database,
          collection,
          serviceName: `resubscribe-${collection}`,
          attempts: 0
        });
      }
    });
  }

  private notifyCollectionObservers(data: SocketMongo): void {
    // Aynı collection için sadece bir kez notify et (duplicate önleme)
    const notifiedCollections = new Set<string>();
    
    this.collectionObservers.forEach((_, key) => {
      const [db, coll] = key.split(':');
      const collectionKey = `${db}:${coll}`;
      
      if (db === data.ns.db && coll === data.ns.coll && !notifiedCollections.has(collectionKey)) {
        notifiedCollections.add(collectionKey);
        
        // Bu collection için tüm callback'leri bir kez çalıştır
        const allCallbacks = new Set<CollectionChangeCallback>();
        this.collectionObservers.forEach((cbs, k) => {
          const [kDb, kColl] = k.split(':');
          if (kDb === db && kColl === coll) {
            cbs.forEach(cb => allCallbacks.add(cb));
          }
        });
        
        allCallbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('❌ Collection callback hatası:', error);
          }
        });
      }
    });
  }

  private notifyStateChangeListeners(): void {
    this.stateChangeListeners.forEach(callback => {
      try {
        callback(this.socketState);
      } catch (error) {
        console.error('❌ State change callback hatası:', error);
      }
    });
  }

  private notifyErrorListeners(error: string): void {
    this.errorListeners.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('❌ Error callback hatası:', error);
      }
    });
  }

  private updateSocketState(partialState: Partial<SocketState>): void {
    this.socketState = {
      ...this.socketState,
      ...partialState
    };
    this.notifyStateChangeListeners();
  }

  private getSubscriptionKey(database: string, collection: string, serviceName: string): string {
    return `${database}:${collection}:${serviceName}`;
  }
}

// Singleton instance export
export const socketService = SocketService.getInstance();
