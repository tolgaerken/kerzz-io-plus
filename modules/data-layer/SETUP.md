# Data Layer Module - Hızlı Kurulum Rehberi

Bu rehber, data-layer modülünü yeni bir projeye nasıl kuracağınızı adım adım anlatır.

## 🚀 5 Dakikada Kurulum

### Adım 1: Modülü Kopyalayın

```bash
# Bu data-layer klasörünü yeni projenizin src/modules/ altına kopyalayın
cp -r src/modules/data-layer /path/to/new/project/src/modules/
```

### Adım 2: Gerekli Paketleri Yükleyin

```bash
npm install @tanstack/react-query socket.io-client lodash
npm install -D @types/lodash
```

### Adım 3: Environment Variables

`.env` dosyası oluşturun:

```env
REACT_APP_DB_URL=https://your-mongo-api-endpoint.com
VITE_API_TIMEOUT=10000
VITE_API_TIMEOUT_LONG=120000
```

### Adım 4: HTTP Client Hazırlayın

```tsx
// services/httpClient.ts
interface HttpClient {
  post<T>(url: string, body: any, headers?: Record<string, string>, trackLoading?: boolean): Promise<T>;
}

export const httpClient: HttpClient = {
  post: async (url, body, headers) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};
```

### Adım 5: Auth Store Interface

```tsx
// types/auth.ts
export interface AuthStore {
  userInfo?: {
    accessToken?: string;
    licances?: Array<{
      licanceId: string;
    }>;
  };
}

// Basit auth store örneği
export const authStore: AuthStore = {
  userInfo: {
    accessToken: 'your-access-token',
    licances: [{ licanceId: 'your-license-id' }]
  }
};
```

### Adım 6: App.tsx'i Güncelleyin

```tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBaseMongo, useSocket } from './modules/data-layer';
import { httpClient } from './services/httpClient';
import { authStore } from './types/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      cacheTime: 1000 * 60 * 10, // 10 dakika
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}

function MainApp() {
  // Socket bağlantısını başlat
  const { connect } = useSocket();

  React.useEffect(() => {
    connect();
  }, []);

  return (
    <div>
      <CustomerList />
    </div>
  );
}

// Örnek component
function CustomerList() {
  const { state, fetchItems, upsertItem } = useBaseMongo<{
    id?: string;
    name: string;
    email: string;
  }>({
    database: 'test_db',
    collection: 'customers',
    autoFetch: true,
    socketUpdates: true,
    httpClient,
    authStore
  });

  const handleAddCustomer = async () => {
    await upsertItem({
      name: 'Test Customer',
      email: 'test@example.com'
    });
  };

  return (
    <div>
      <h2>Customers</h2>
      <button onClick={handleAddCustomer}>Add Customer</button>

      {state.isLoading && <p>Loading...</p>}
      {state.error && <p>Error: {state.error}</p>}

      <ul>
        {state.items.map(customer => (
          <li key={customer.id}>{customer.name} - {customer.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

## ✅ Test Edin

```bash
npm start
```

Tarayıcıda `http://localhost:3000` adresine gidin. Customers listesi görüntülenmelidir.

## 🔧 Özelleştirme

### MongoDB API Endpoint'ini Değiştirin

```tsx
// modules/data-layer/constants/index.ts
export const MONGO_API = {
  BASE_URL: 'https://your-custom-endpoint.com/api',
  TIMEOUT: 30000,
} as const
```

### Socket Sunucusunu Değiştirin

```tsx
// modules/data-layer/constants/index.ts
export const SOCKET_CONFIG = {
  URL: 'https://your-socket-server.com',
  AUTH: {
    ALIAS: 'your-alias',
    SECRET_KEY: 'your-secret-key'
  }
  // ...
} as const
```

### HTTP Client'ı Özelleştirin

```tsx
// services/httpClient.ts
import axios from 'axios';

export const httpClient = {
  post: async (url: string, body: any, headers?: Record<string, string>) => {
    const response = await axios.post(url, body, { headers });
    return response.data;
  }
};
```

## 📋 Kullanım Örnekleri

### Basit CRUD

```tsx
import { useBaseMongo } from './modules/data-layer';

const MyComponent = () => {
  const { state, fetchItems, upsertItem, deleteItem } = useBaseMongo({
    database: 'my_db',
    collection: 'items',
    httpClient,
    authStore
  });

  // Create
  const create = () => upsertItem({ name: 'New Item' });

  // Update
  const update = (id: string) => upsertItem({ id, name: 'Updated Item' });

  // Delete
  const remove = (id: string) => deleteItem({ id });

  return <div>{/* Your UI */}</div>;
};
```

### React Query ile

```tsx
import { useBaseQuery } from './modules/data-layer';

const MyComponent = () => {
  const { useList, useCreate, useUpdate, useDelete } = useBaseQuery({
    database: 'my_db',
    collection: 'items',
    httpClient,
    authStore
  }, ['items']);

  const { data: items, isLoading } = useList();
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  return <div>{/* Your UI */}</div>;
};
```

### Real-time Updates

```tsx
import { useSocket } from './modules/data-layer';

const RealtimeComponent = () => {
  const { socketState, subscribe } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe('items', 'my_db', (data) => {
      console.log('Real-time update:', data);
    });

    return unsubscribe;
  }, []);

  return (
    <div>
      Status: {socketState.isConnected ? '🟢 Live' : '🔴 Offline'}
    </div>
  );
};
```

## 🆘 Sorun Giderme

### 1. "Module not found" Hatası

```bash
# Path'leri kontrol edin
ls src/modules/data-layer
```

### 2. MongoDB Bağlantı Hatası

```bash
# API endpoint'ini kontrol edin
curl -X POST https://your-mongo-api-endpoint.com/api/database/dataAction
```

### 3. Socket Bağlantı Sorunu

```bash
# Socket sunucusunun çalıştığını kontrol edin
telnet your-socket-server.com 80
```

### 4. TypeScript Hataları

```bash
# Tip tanımlarını kontrol edin
npx tsc --noEmit
```

## 📞 Destek

Sorun yaşarsanız:

1. **Console log'larını kontrol edin**
2. **Network tab'ını kontrol edin**
3. **Environment variables'ları doğrulayın**
4. **API endpoint'lerinin erişilebilir olduğunu kontrol edin**

## ✅ Kontrol Listesi

- [ ] Modül kopyalandı
- [ ] NPM paketleri yüklendi
- [ ] Environment variables ayarlandı
- [ ] HTTP client hazırlandı
- [ ] Auth store interface'i oluşturuldu
- [ ] App.tsx güncellendi
- [ ] Test component'i çalışıyor
- [ ] MongoDB bağlantısı test edildi
- [ ] Socket bağlantısı test edildi

## 🎉 Tamamlandı!

Data layer modülünüz artık hazır. Artık:

- **MongoDB CRUD operasyonları** yapabilirsiniz
- **Real-time güncellemeleri** alabilirsiniz
- **React Query** ile optimized caching kullanabilirsiniz
- **TypeScript desteği** ile güvenli kod yazabilirsiniz

Projenizin geri kalanını geliştirmeye devam edebilirsiniz!