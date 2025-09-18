# Data Layer Module

Bu modül, MongoDB entegrasyonu, Socket.IO real-time güncellemeleri ve React Query tabanlı veri yönetimi için kapsamlı bir çözüm sunar. Angular TBaseMongoService'den esinlenerek React hook'ları olarak yeniden tasarlanmıştır.

## 📁 Klasör Yapısı

```
src/modules/data-layer/
├── hooks/              # Core React hooks
│   ├── useBaseMongo.ts     # MongoDB CRUD operasyonları
│   ├── useBaseQuery.ts     # React Query entegrasyonu
│   ├── useSocket.ts        # Socket.IO bağlantı yönetimi
│   └── index.ts
├── services/           # Singleton servisler
│   ├── socketService.ts    # Socket.IO servisi
│   └── index.ts
├── types/              # TypeScript tip tanımları
│   ├── mongo.ts           # MongoDB tipleri
│   └── index.ts
├── constants/          # API ve yapılandırma sabitleri
│   └── index.ts
├── utils/              # Yardımcı fonksiyonlar
│   ├── idGenerator.ts     # ID üretim fonksiyonları
│   └── index.ts
├── index.ts            # Ana export dosyası
├── README.md           # Bu döküman
└── SETUP.md           # Hızlı kurulum rehberi
```

## 🚀 Özellikler

### ✨ **Core Features**

- **MongoDB CRUD Operations**: Tüm temel veritabanı işlemleri
- **Real-time Updates**: Socket.IO ile anlık veri güncellemeleri
- **React Query Integration**: Akıllı caching ve state management
- **TypeScript Support**: Tam tip güvenliği
- **Optimistic Updates**: Kullanıcı deneyimi için hızlı güncellemeler
- **Error Handling**: Kapsamlı hata yönetimi
- **Auto-reconnection**: Socket bağlantı yönetimi

### 🔧 **Advanced Features**

- **Change Stream Support**: MongoDB değişiklik izleme
- **Throttling**: API çağrısı optimizasyonu
- **Pagination**: Büyük veri setleri için sayfalama
- **Filtering & Sorting**: Esnek veri filtreleme
- **Loading States**: UI feedback için yükleme durumları
- **Offline Support**: Bağlantı koptuğunda graceful handling

## 🚀 Hızlı Başlangıç

### 1. Modülü Kopyalayın

```bash
# Bu data-layer klasörünü yeni projenizin src/modules/ altına kopyalayın
cp -r src/modules/data-layer /path/to/new/project/src/modules/
```

### 2. Gerekli Bağımlılıkları Yükleyin

```bash
npm install @tanstack/react-query socket.io-client lodash
npm install -D @types/lodash
```

### 3. Environment Variables

`.env` dosyanızda:

```env
REACT_APP_DB_URL=https://your-mongo-api-endpoint.com
VITE_API_TIMEOUT=10000
VITE_API_TIMEOUT_LONG=120000
```

### 4. Ana Uygulama Kurulumu

```tsx
// App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './modules/auth'; // Auth modülünüz
import { httpClient } from './services/httpClient'; // HTTP client'ınız

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app content */}
    </QueryClientProvider>
  );
}

export default App;
```

## 📋 API Referansı

### useBaseMongo Hook

Temel MongoDB operasyonları için ana hook.

```tsx
import { useBaseMongo } from './modules/data-layer';
import { useAuthStore } from './modules/auth';
import { httpClient } from './services/httpClient';

interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: Date;
}

const MyComponent = () => {
  const authStore = useAuthStore();

  const {
    state,
    // Data operations
    fetchItems,
    fetchOne,
    upsertItem,
    deleteItem,

    // Utility functions
    setActiveItem,
    clearError,

    // Socket operations
    subscribeToCollection,
    unsubscribeFromCollection
  } = useBaseMongo<Customer>({
    database: 'my_database',
    collection: 'customers',
    autoFetch: true,
    socketUpdates: true,
    httpClient,
    authStore
  });

  return (
    <div>
      {state.isLoading && <div>Loading...</div>}
      {state.error && <div>Error: {state.error}</div>}
      {state.items.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
};
```

#### State Properties

```tsx
interface BaseMongoState<T> {
  items: T[];                    // Veriler
  activeItem: T | null;          // Seçili item
  isLoading: boolean;           // Yükleme durumu
  isFetching: boolean;          // Fetch durumu
  error: string | null;         // Hata mesajı
  lastFetchParams: any;         // Son fetch parametreleri
}
```

#### Hook Options

```tsx
interface ExtendedBaseMongoOptions {
  database: string;             // Veritabanı adı
  collection: string;           // Koleksiyon adı
  autoFetch?: boolean;         // Otomatik fetch (default: false)
  socketUpdates?: boolean;     // Real-time updates (default: false)
  httpClient: HttpClient;      // HTTP client instance
  authStore: AuthStore;        // Auth store instance
}
```

### useBaseQuery Hook

React Query entegrasyonu için gelişmiş hook.

```tsx
import { useBaseQuery } from './modules/data-layer';

const MyComponent = () => {
  const authStore = useAuthStore();

  const {
    useList,
    useOne,
    useCreate,
    useUpdate,
    useDelete,
    invalidateList,
    invalidateOne
  } = useBaseQuery<Customer>({
    database: 'my_database',
    collection: 'customers',
    httpClient,
    authStore
  }, ['customers']); // Query key prefix

  // Liste sorgulama
  const { data: customers, isLoading } = useList();

  // Tek item sorgulama
  const { data: customer } = useOne('customer-id');

  // Oluşturma mutation
  const createMutation = useCreate({
    onSuccess: () => {
      invalidateList();
    }
  });

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
};
```

### useSocket Hook

Socket.IO bağlantı yönetimi.

```tsx
import { useSocket } from './modules/data-layer';

const MyComponent = () => {
  const {
    socketState,
    connect,
    disconnect,
    subscribe,
    unsubscribe
  } = useSocket();

  useEffect(() => {
    connect();

    // Collection değişikliklerini dinle
    const unsubscribeCustomers = subscribe('customers', 'my_database', (data) => {
      console.log('Customer collection changed:', data);
    });

    return () => {
      unsubscribeCustomers();
      disconnect();
    };
  }, []);

  return (
    <div>
      Status: {socketState.connectionStatus}
      {socketState.isConnected && <span>✅ Connected</span>}
    </div>
  );
};
```

## 🔧 Özelleştirme

### Custom HTTP Client

```tsx
interface HttpClient {
  post<T>(
    url: string,
    body: any,
    headers?: Record<string, string>,
    trackLoading?: boolean
  ): Promise<T>;
}

// Kendi HTTP client'ınızı implement edin
const myHttpClient: HttpClient = {
  post: async (url, body, headers) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    return response.json();
  }
};
```

### Custom Auth Store

```tsx
interface AuthStore {
  userInfo?: {
    accessToken?: string;
    licances?: Array<{
      licanceId: string;
    }>;
  };
}

// Kendi auth store'unuzu implement edin
const myAuthStore: AuthStore = {
  userInfo: {
    accessToken: 'your-token',
    licances: [{ licanceId: 'your-license-id' }]
  }
};
```

### MongoDB Filtreleme

```tsx
// Karmaşık sorgular
const { fetchItems } = useBaseMongo<Customer>({
  database: 'my_db',
  collection: 'customers',
  httpClient,
  authStore
});

// Filtreleme
await fetchItems({
  filter: {
    status: 'active',
    createdAt: { $gte: new Date('2023-01-01') }
  },
  sort: { createdAt: -1 },
  limit: 20,
  skip: 0
});
```

### Real-time Updates

```tsx
const { subscribeToCollection } = useBaseMongo<Customer>({
  database: 'my_db',
  collection: 'customers',
  socketUpdates: true, // Önemli!
  httpClient,
  authStore
});

useEffect(() => {
  // Otomatik subscription
  const unsubscribe = subscribeToCollection();
  return unsubscribe;
}, []);
```

## 🎯 Kullanım Örnekleri

### Basit CRUD Operasyonları

```tsx
const CustomerManager = () => {
  const authStore = useAuthStore();
  const { state, fetchItems, upsertItem, deleteItem } = useBaseMongo<Customer>({
    database: 'restaurant_db',
    collection: 'customers',
    autoFetch: true,
    httpClient,
    authStore
  });

  const handleCreate = async (customerData: Partial<Customer>) => {
    try {
      await upsertItem(customerData);
      toast.success('Customer created!');
    } catch (error) {
      toast.error('Failed to create customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete customer?')) {
      await deleteItem({ id });
    }
  };

  return (
    <div>
      <button onClick={() => handleCreate({ name: 'New Customer', email: 'new@example.com', phone: '123' })}>
        Add Customer
      </button>

      {state.items.map(customer => (
        <div key={customer.id} className="customer-card">
          <h3>{customer.name}</h3>
          <p>{customer.email}</p>
          <button onClick={() => handleDelete(customer.id!)}>Delete</button>
        </div>
      ))}
    </div>
  );
};
```

### React Query ile Optimized Queries

```tsx
const CustomersPage = () => {
  const authStore = useAuthStore();
  const { useList, useCreate, useUpdate, useDelete, invalidateList } = useBaseQuery<Customer>({
    database: 'restaurant_db',
    collection: 'customers',
    httpClient,
    authStore
  }, ['customers']);

  // Otomatik caching, background updates, error retry
  const { data: customers, isLoading, error } = useList({
    filter: { status: 'active' },
    sort: { createdAt: -1 }
  });

  // Optimistic updates
  const createMutation = useCreate({
    onMutate: async (newCustomer) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['customers']);

      // Optimistically update to the new value
      const previousCustomers = queryClient.getQueryData(['customers']);
      queryClient.setQueryData(['customers'], old => [...(old || []), newCustomer]);

      return { previousCustomers };
    },
    onError: (err, newCustomer, context) => {
      // Rollback on error
      queryClient.setQueryData(['customers'], context?.previousCustomers);
    },
    onSuccess: () => {
      invalidateList();
    }
  });

  return (
    <div>
      {isLoading && <div>Loading customers...</div>}
      {error && <div>Error: {error.message}</div>}
      {customers?.map(customer => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
};
```

### Socket.IO Real-time Dashboard

```tsx
const RealtimeDashboard = () => {
  const { socketState, subscribe } = useSocket();
  const [liveStats, setLiveStats] = useState({
    totalCustomers: 0,
    activeReservations: 0,
    lastUpdate: null
  });

  useEffect(() => {
    // Multiple collection subscriptions
    const unsubscribeCustomers = subscribe('customers', 'restaurant_db', (data) => {
      if (data.operationType === 'insert') {
        setLiveStats(prev => ({
          ...prev,
          totalCustomers: prev.totalCustomers + 1,
          lastUpdate: new Date()
        }));
      }
    });

    const unsubscribeReservations = subscribe('reservations', 'restaurant_db', (data) => {
      // Handle reservations changes
      console.log('Reservation changed:', data);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeReservations();
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="connection-status">
        {socketState.isConnected ? '🟢 Live' : '🔴 Offline'}
      </div>

      <div className="stats">
        <div>Total Customers: {liveStats.totalCustomers}</div>
        <div>Active Reservations: {liveStats.activeReservations}</div>
        {liveStats.lastUpdate && (
          <div>Last Update: {liveStats.lastUpdate.toLocaleTimeString()}</div>
        )}
      </div>
    </div>
  );
};
```

## 🔒 Error Handling

```tsx
const SafeComponent = () => {
  const { state, fetchItems } = useBaseMongo<Customer>({
    database: 'my_db',
    collection: 'customers',
    httpClient,
    authStore
  });

  const handleRefetch = async () => {
    try {
      await fetchItems();
    } catch (error) {
      console.error('Fetch failed:', error);
      // Error is also available in state.error
    }
  };

  if (state.error) {
    return (
      <div className="error-state">
        <p>Something went wrong: {state.error}</p>
        <button onClick={handleRefetch}>Try Again</button>
      </div>
    );
  }

  return <div>{/* Normal render */}</div>;
};
```

## 🚀 Performance Tips

### 1. Selective Subscriptions

```tsx
// Sadece gerekli collection'lara subscribe olun
const { subscribeToCollection } = useBaseMongo<Customer>({
  socketUpdates: true, // Sadece gerektiğinde true yapın
  // ...
});
```

### 2. Query Optimizasyonu

```tsx
// Projection kullanarak sadece gerekli alanları getirin
await fetchItems({
  filter: { status: 'active' },
  project: { name: 1, email: 1, phone: 1 }, // Sadece bu alanlar
  limit: 50 // Limit kullanın
});
```

### 3. Debouncing

```tsx
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (searchTerm) => {
  await fetchItems({
    filter: { name: { $regex: searchTerm, $options: 'i' } }
  });
}, 300);
```

## 📦 Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^4.x",
    "socket.io-client": "^4.x",
    "lodash": "^4.x"
  },
  "devDependencies": {
    "@types/lodash": "^4.x"
  }
}
```

## 🐛 Sorun Giderme

### 1. Socket Bağlantı Sorunları

```tsx
// Socket durumunu kontrol edin
const { socketState } = useSocket();
console.log('Socket state:', socketState);

// Manuel reconnection
if (!socketState.isConnected) {
  socketService.reconnect();
}
```

### 2. Authentication Sorunları

```tsx
// Auth bilgilerini kontrol edin
const authStore = useAuthStore();
console.log('User info:', authStore.userInfo);

// Token kontrolü
if (!authStore.userInfo?.accessToken) {
  // Redirect to login
}
```

### 3. API Timeout

```tsx
// Constants'ta timeout değerlerini artırın
export const ENV = {
  API_TIMEOUT: 30000, // 30 saniye
  API_TIMEOUT_LONG: 120000 // 2 dakika
} as const
```

## 🤝 Contributing

Data layer modülünü geliştirmek için:

1. Type safety'yi koruyun
2. Error handling'i ihmal etmeyin
3. Performance impact'ini göz önünde bulundurun
4. Documentation'ı güncelleyin

## 📄 License

Bu modül MIT lisansı altında lisanslanmıştır.