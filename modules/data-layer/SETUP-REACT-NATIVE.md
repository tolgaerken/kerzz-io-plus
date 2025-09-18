# Data Layer Module - React Native Kurulum Rehberi

Bu rehber, data-layer modülünü React Native (Expo) projesine nasıl kuracağınızı adım adım anlatır.

## 🚀 React Native İçin 5 Dakikada Kurulum

### Adım 1: Gerekli Paketleri Yükleyin

```bash
# Core dependencies
npm install @tanstack/react-query socket.io-client lodash expo-constants

# Development dependencies
npm install -D @types/lodash
```

### Adım 2: Environment Variables (app.config.js)

`app.config.js` dosyanızı güncelleyin:

```javascript
export default {
  expo: {
    name: "Kerzz IO Plus",
    slug: "kerzz-io-plus",
    // ... diğer ayarlar
    extra: {
      // Data Layer Environment Variables
      EXPO_PUBLIC_DB_URL: process.env.EXPO_PUBLIC_DB_URL || "https://public.kerzz.com:50502/api/database/dataAction",
      EXPO_PUBLIC_SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || "https://public.kerzz.com:50503",
      EXPO_PUBLIC_SOCKET_ALIAS: process.env.EXPO_PUBLIC_SOCKET_ALIAS || "ali-yilmaz",
      EXPO_PUBLIC_SOCKET_SECRET: process.env.EXPO_PUBLIC_SOCKET_SECRET || "14531453",
      EXPO_PUBLIC_API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT || "10000",
      EXPO_PUBLIC_API_TIMEOUT_LONG: process.env.EXPO_PUBLIC_API_TIMEOUT_LONG || "120000"
    }
  }
};
```

### Adım 3: .env Dosyası (Opsiyonel)

Proje kök dizininde `.env` dosyası oluşturun:

```env
# MongoDB API Configuration
EXPO_PUBLIC_DB_URL=https://your-mongo-api-endpoint.com/api/database/dataAction
EXPO_PUBLIC_SOCKET_URL=https://your-socket-server.com

# Socket Authentication
EXPO_PUBLIC_SOCKET_ALIAS=your-alias
EXPO_PUBLIC_SOCKET_SECRET=your-secret-key

# API Timeouts
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_API_TIMEOUT_LONG=120000
```

### Adım 4: HTTP Client Hazırlayın

```tsx
// services/httpClient.ts
import { RN_CONFIG } from '../modules/data-layer';

interface HttpClient {
  post<T>(url: string, body: any, headers?: Record<string, string>, trackLoading?: boolean): Promise<T>;
}

export const httpClient: HttpClient = {
  post: async (url, body, headers) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RN_CONFIG.NETWORK_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }
};
```

### Adım 5: Auth Store Interface

```tsx
// stores/authStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RN_CONFIG } from '../modules/data-layer';

export interface AuthStore {
  userInfo?: {
    id?: string;
    accessToken?: string;
    licances?: Array<{
      licanceId: string;
    }>;
  };
}

class AuthStoreImpl implements AuthStore {
  userInfo?: AuthStore['userInfo'];

  async loadFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(RN_CONFIG.STORAGE_KEYS.USER_INFO);
      if (stored) {
        this.userInfo = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Auth store load error:', error);
    }
  }

  async saveToStorage() {
    try {
      await AsyncStorage.setItem(
        RN_CONFIG.STORAGE_KEYS.USER_INFO, 
        JSON.stringify(this.userInfo)
      );
    } catch (error) {
      console.error('Auth store save error:', error);
    }
  }

  setUserInfo(userInfo: AuthStore['userInfo']) {
    this.userInfo = userInfo;
    this.saveToStorage();
  }

  clearUserInfo() {
    this.userInfo = undefined;
    AsyncStorage.removeItem(RN_CONFIG.STORAGE_KEYS.USER_INFO);
  }
}

export const authStore = new AuthStoreImpl();
```

### Adım 6: App.tsx'i Güncelleyin

```tsx
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBaseMongo, useSocket } from './modules/data-layer';
import { httpClient } from './services/httpClient';
import { authStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      cacheTime: 1000 * 60 * 10, // 10 dakika
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
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
  // Auth store'u başlat
  useEffect(() => {
    authStore.loadFromStorage();
  }, []);

  // Socket bağlantısını başlat
  const { connect, socketState } = useSocket({ autoConnect: true });

  useEffect(() => {
    connect();
  }, []);

  return (
    <div>
      <SocketStatus isConnected={socketState.isConnected} />
      <CustomerList />
    </div>
  );
}

// Socket durumu göstergesi
function SocketStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div style={{ 
      padding: 10, 
      backgroundColor: isConnected ? '#4CAF50' : '#F44336',
      color: 'white'
    }}>
      Socket: {isConnected ? '🟢 Bağlı' : '🔴 Bağlantı Yok'}
    </div>
  );
}

// Örnek component
function CustomerList() {
  const { 
    items: customers, 
    isLoading, 
    error, 
    fetchData, 
    upsert, 
    delete: deleteCustomer 
  } = useBaseMongo<{
    id?: string;
    name: string;
    email: string;
    phone: string;
  }>({
    database: 'test_db',
    collection: 'customers',
    autoFetch: true,
    socketUpdates: true,
    httpClient,
    authStore
  });

  const handleAddCustomer = async () => {
    try {
      await upsert('', {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+90 555 123 4567'
      });
    } catch (error) {
      console.error('Customer add error:', error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomer(id);
    } catch (error) {
      console.error('Customer delete error:', error);
    }
  };

  if (isLoading) {
    return <div>Loading customers...</div>;
  }

  if (error) {
    return (
      <div>
        <div>Error: {error}</div>
        <button onClick={() => fetchData()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Customers ({customers.length})</h2>
      <button onClick={handleAddCustomer}>Add Customer</button>

      <ul>
        {customers.map(customer => (
          <li key={customer.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
            <div><strong>{customer.name}</strong></div>
            <div>Email: {customer.email}</div>
            <div>Phone: {customer.phone}</div>
            <button 
              onClick={() => handleDeleteCustomer(customer.id!)}
              style={{ marginTop: '5px', color: 'red' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

## ✅ Test Edin

```bash
# Expo development server'ı başlatın
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

## 🔧 React Native Spesifik Özellikler

### 1. AsyncStorage Entegrasyonu

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RN_CONFIG } from './modules/data-layer';

// Auth token'ı kaydet
await AsyncStorage.setItem(RN_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);

// Auth token'ı oku
const token = await AsyncStorage.getItem(RN_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
```

### 2. Network State Monitoring

```tsx
import NetInfo from '@react-native-netinfo';
import { useSocket } from './modules/data-layer';

function NetworkAwareComponent() {
  const { connect, disconnect } = useSocket();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        connect();
      } else {
        disconnect();
      }
    });

    return unsubscribe;
  }, []);

  return <YourComponent />;
}
```

### 3. Background Task Handling

```tsx
import { AppState } from 'react-native';
import { useSocket } from './modules/data-layer';

function AppStateHandler() {
  const { connect, disconnect } = useSocket();

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        connect();
      } else if (nextAppState === 'background') {
        // Background'da socket'i kapat (battery optimization)
        disconnect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  return null;
}
```

### 4. Error Boundary

```tsx
import React from 'react';
import { Text, View, Button } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class DataLayerErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Data Layer Error:', error, errorInfo);
    // Crash reporting service'e gönder (Sentry, Bugsnag, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Bir hata oluştu
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'Bilinmeyen hata'}
          </Text>
          <Button
            title="Yeniden Dene"
            onPress={() => this.setState({ hasError: false, error: undefined })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

// Kullanım
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataLayerErrorBoundary>
        <MainApp />
      </DataLayerErrorBoundary>
    </QueryClientProvider>
  );
}
```

## 📋 Kullanım Örnekleri

### Basit CRUD (React Native)

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useBaseMongo } from './modules/data-layer';

interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
}

export function CustomerScreen() {
  const { 
    items: customers, 
    isLoading, 
    error, 
    upsert, 
    delete: deleteCustomer 
  } = useBaseMongo<Customer>({
    database: 'restaurant_db',
    collection: 'customers',
    autoFetch: true,
    socketUpdates: true,
    httpClient,
    authStore
  });

  const handleAddCustomer = async () => {
    try {
      await upsert('', {
        name: 'Yeni Müşteri',
        email: 'yeni@example.com',
        phone: '+90 555 123 4567'
      });
    } catch (error) {
      Alert.alert('Hata', 'Müşteri eklenemedi');
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Alert.alert(
      'Müşteriyi Sil',
      `${customer.name} müşterisini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => deleteCustomer(customer.id!)
        }
      ]
    );
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
      <Text style={{ color: '#666' }}>{item.email}</Text>
      <Text style={{ color: '#666' }}>{item.phone}</Text>
      <TouchableOpacity
        onPress={() => handleDeleteCustomer(item)}
        style={{ marginTop: 10, padding: 8, backgroundColor: '#ff4444', borderRadius: 4 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>Sil</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Müşteriler yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', marginBottom: 20 }}>Hata: {error}</Text>
        <TouchableOpacity
          onPress={() => window.location.reload()}
          style={{ padding: 10, backgroundColor: '#007AFF', borderRadius: 5 }}
        >
          <Text style={{ color: 'white' }}>Yeniden Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity
          onPress={handleAddCustomer}
          style={{ padding: 15, backgroundColor: '#007AFF', borderRadius: 8 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Yeni Müşteri Ekle
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={item => item.id!}
        ListEmptyComponent={
          <View style={{ padding: 50, alignItems: 'center' }}>
            <Text style={{ color: '#666' }}>Henüz müşteri yok</Text>
          </View>
        }
      />
    </View>
  );
}
```

### Real-time Updates (React Native)

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useCollectionSocket } from './modules/data-layer';

export function RealtimeStats() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalReservations: 0,
    lastUpdate: null as Date | null
  });

  // Müşteri değişikliklerini dinle
  const customerSocket = useCollectionSocket('restaurant_db', 'customers', 'stats-customers');
  
  // Rezervasyon değişikliklerini dinle
  const reservationSocket = useCollectionSocket('restaurant_db', 'reservations', 'stats-reservations');

  useEffect(() => {
    if (customerSocket.lastUpdate) {
      setStats(prev => ({
        ...prev,
        totalCustomers: prev.totalCustomers + (customerSocket.lastUpdate?.operationType === 'insert' ? 1 : 0),
        lastUpdate: new Date()
      }));
    }
  }, [customerSocket.lastUpdate]);

  useEffect(() => {
    if (reservationSocket.lastUpdate) {
      setStats(prev => ({
        ...prev,
        totalReservations: prev.totalReservations + (reservationSocket.lastUpdate?.operationType === 'insert' ? 1 : 0),
        lastUpdate: new Date()
      }));
    }
  }, [reservationSocket.lastUpdate]);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
        Canlı İstatistikler
      </Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#007AFF' }}>
            {stats.totalCustomers}
          </Text>
          <Text>Toplam Müşteri</Text>
        </View>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF9500' }}>
            {stats.totalReservations}
          </Text>
          <Text>Toplam Rezervasyon</Text>
        </View>
      </View>

      {stats.lastUpdate && (
        <Text style={{ marginTop: 15, color: '#666', textAlign: 'center' }}>
          Son güncelleme: {stats.lastUpdate.toLocaleTimeString('tr-TR')}
        </Text>
      )}

      <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-around' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ 
            width: 12, 
            height: 12, 
            borderRadius: 6, 
            backgroundColor: customerSocket.isConnected ? '#4CAF50' : '#F44336' 
          }} />
          <Text style={{ fontSize: 12, marginTop: 5 }}>Müşteriler</Text>
        </View>
        
        <View style={{ alignItems: 'center' }}>
          <View style={{ 
            width: 12, 
            height: 12, 
            borderRadius: 6, 
            backgroundColor: reservationSocket.isConnected ? '#4CAF50' : '#F44336' 
          }} />
          <Text style={{ fontSize: 12, marginTop: 5 }}>Rezervasyonlar</Text>
        </View>
      </View>
    </View>
  );
}
```

## 🆘 Sorun Giderme

### 1. "expo-constants" Hatası

```bash
# Expo Constants'ı yükleyin
npx expo install expo-constants
```

### 2. Socket Bağlantı Sorunu

```tsx
// Network durumunu kontrol edin
import NetInfo from '@react-native-netinfo';

NetInfo.fetch().then(state => {
  console.log('Connection type', state.type);
  console.log('Is connected?', state.isConnected);
});
```

### 3. AsyncStorage Hatası

```bash
# AsyncStorage'ı yükleyin
npx expo install @react-native-async-storage/async-storage
```

### 4. Metro Bundler Cache Sorunu

```bash
# Cache'i temizleyin
npx expo start --clear
```

### 5. TypeScript Hataları

```bash
# Tip kontrolü yapın
npx tsc --noEmit
```

## 📞 Destek

React Native'de sorun yaşarsanız:

1. **Expo Logs'ları kontrol edin**
2. **Network tab'ını kontrol edin** (Flipper/React Native Debugger)
3. **Environment variables'ları doğrulayın**
4. **Socket server'ının erişilebilir olduğunu kontrol edin**

## ✅ React Native Kontrol Listesi

- [ ] Expo Constants yüklendi
- [ ] AsyncStorage yüklendi  
- [ ] app.config.js güncellendi
- [ ] Environment variables ayarlandı
- [ ] HTTP client hazırlandı
- [ ] Auth store oluşturuldu
- [ ] App.tsx güncellendi
- [ ] Test component'i çalışıyor
- [ ] MongoDB bağlantısı test edildi
- [ ] Socket bağlantısı test edildi
- [ ] Real-time updates test edildi

## 🎉 Tamamlandı!

Data layer modülünüz artık React Native'de hazır. Artık:

- **MongoDB CRUD operasyonları** yapabilirsiniz
- **Real-time güncellemeleri** alabilirsiniz  
- **React Query** ile optimized caching kullanabilirsiniz
- **TypeScript desteği** ile güvenli kod yazabilirsiniz
- **React Native spesifik optimizasyonlar** kullanabilirsiniz

React Native projenizin geri kalanını geliştirmeye devam edebilirsiniz!
