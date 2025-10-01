# Netsis SQL Integration - TanStack Query

Angular'daki `NetsisSqlSocketService` servisi React Native/TanStack Query'ye uyarlandı.

## 📦 Kurulum

### 1. Environment Variables

`.env` dosyanıza Netsis SQL endpoint'ini ekleyin:

```env
EXPO_PUBLIC_NETSIS_SQL_URL=https://your-netsis-sql-server.com/api/sql
```

### 2. Backend SQL Servisi

Backend'de bir SQL servis endpoint'i oluşturmanız gerekiyor. Bu endpoint POST isteği almalı ve SQL sorgusunu çalıştırmalı:

```typescript
// Backend örneği (Express.js)
app.post('/api/sql', async (req, res) => {
  const { sql } = req.body;
  
  // SQL sorgusunu çalıştır
  const result = await executeSQL(sql);
  
  res.json(result);
});
```

## 🚀 Kullanım

### Basit Sorgular

```tsx
import { useNetsisAccounts, useNetsisTransactions } from '@/modules/data-layer';

function AccountsScreen() {
  // Cari hesapları getir
  const { data: accounts, isLoading, error } = useNetsisAccounts('2024', 'VERI');

  if (isLoading) return <Text>Yükleniyor...</Text>;
  if (error) return <Text>Hata: {error.message}</Text>;

  return (
    <FlatList
      data={accounts}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
          <Text>{item.ID}</Text>
        </View>
      )}
    />
  );
}
```

### Parametre ile Sorgular

```tsx
import { useNetsisTransactions, useNetsisBalance } from '@/modules/data-layer';

function AccountDetailScreen({ accountId }: { accountId: string }) {
  const year = '2024';
  const company = 'VERI';

  // Hesap hareketleri
  const { data: transactions } = useNetsisTransactions(accountId, year, company);
  
  // Hesap bakiyesi
  const { data: balance } = useNetsisBalance(accountId, year, company);

  return (
    <View>
      <Text>Bakiye: {balance} ₺</Text>
      <FlatList
        data={transactions}
        renderItem={({ item }) => (
          <View>
            <Text>{item.ACIKLAMA}</Text>
            <Text>Borç: {item.BORC}</Text>
            <Text>Alacak: {item.ALACAK}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

### Birleştirilmiş Veri (Composite Hook)

```tsx
import { useNetsisAccountDetails } from '@/modules/data-layer';

function CompleteAccountScreen({ accountId }: { accountId: string }) {
  const { account, balance, transactions, isLoading, refetch } = 
    useNetsisAccountDetails(accountId, '2024', 'VERI');

  return (
    <View>
      <Text>{account?.name}</Text>
      <Text>Bakiye: {balance} ₺</Text>
      <Button onPress={refetch} title="Yenile" />
      
      <FlatList data={transactions} ... />
    </View>
  );
}
```

### Faturalar

```tsx
import { useNetsisInvoices } from '@/modules/data-layer';

function InvoicesScreen() {
  const { data: invoices } = useNetsisInvoices('2024', 'VERI');

  return (
    <FlatList
      data={invoices}
      renderItem={({ item }) => (
        <View>
          <Text>Fatura No: {item.FATIRS_NO}</Text>
          <Text>Tarih: {item.TARIH.toLocaleDateString()}</Text>
          <Text>Toplam: {item.GENELTOPLAM} ₺</Text>
          <Text>KDV: {item.KDV} ₺</Text>
        </View>
      )}
    />
  );
}
```

### Raporlar

```tsx
import { useNetsisCariBorcYas, useNetsisMuhPivot } from '@/modules/data-layer';

function ReportsScreen() {
  // Cari borç yaşlandırma
  const { data: ageingReport } = useNetsisCariBorcYas('VERI');
  
  // Muhasebe pivot
  const { data: muhPivot } = useNetsisMuhPivot('VERI');

  return (
    <View>
      <Text>Yaşlandırma Raporu</Text>
      <FlatList
        data={ageingReport}
        renderItem={({ item }) => (
          <View>
            <Text>{item.CARI_ISIM}</Text>
            <Text>0-30 gün: {item.VADE_0_30}</Text>
            <Text>30-60 gün: {item.VADE_30_60}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

### Stok Sorgulama

```tsx
import { useNetsisStocks } from '@/modules/data-layer';

function StocksScreen() {
  const { data: stocks, isLoading } = useNetsisStocks('VERI2024');

  if (isLoading) return <Text>Yükleniyor...</Text>;

  return (
    <FlatList
      data={stocks}
      renderItem={({ item }) => (
        <View>
          <Text>{item.STOK_ADI}</Text>
          <Text>Kod: {item.STOK_KODU}</Text>
          <Text>Miktar: {item.MIKTAR} {item.BIRIM}</Text>
        </View>
      )}
    />
  );
}
```

### Cache Invalidation

```tsx
import { useNetsisInvalidation } from '@/modules/data-layer';

function ControlPanel() {
  const invalidation = useNetsisInvalidation();

  const handleRefreshAll = () => {
    // Tüm Netsis cache'ini temizle
    invalidation.invalidateAll();
  };

  const handleRefreshAccounts = () => {
    // Sadece hesapları yenile
    invalidation.invalidateAccounts('2024', 'VERI');
  };

  return (
    <View>
      <Button onPress={handleRefreshAll} title="Tümünü Yenile" />
      <Button onPress={handleRefreshAccounts} title="Hesapları Yenile" />
    </View>
  );
}
```

## 🎯 Mevcut Hook'lar

| Hook | Açıklama | Parametreler |
|------|----------|--------------|
| `useNetsisInvoices` | Faturaları getirir | year, company |
| `useNetsisAccounts` | Cari hesapları getirir | year, company |
| `useNetsisTransactions` | Cari hareketlerini getirir | accountId, year, company |
| `useNetsisMuhTransactions` | Muhasebe hareketlerini getirir | accountId, year, company |
| `useNetsisBalance` | Hesap bakiyesini getirir | accountId, year, company |
| `useNetsisAllBalances` | Tüm hesap bakiyelerini getirir | year, company |
| `useNetsisDocumentDetail` | Belge detayını getirir | year, documentId, company |
| `useNetsisCariBorcYas` | Borç yaşlandırma raporu | company |
| `useNetsisStocks` | Stok listesini getirir | company |
| `useNetsisMuhPivotOutcome` | Gider hesapları pivotu | company |
| `useNetsisMuhPivot` | Tüm hesaplar pivotu | company |
| `useNetsisAccountDetails` | Birleştirilmiş hesap bilgisi | accountId, year, company |
| `useNetsisInvalidation` | Cache temizleme yardımcıları | - |

## ⚙️ Query Options

Her hook'a TanStack Query seçenekleri geçirebilirsiniz:

```tsx
const { data } = useNetsisAccounts('2024', 'VERI', {
  enabled: isLoggedIn,              // Şartlı yükleme
  refetchInterval: 60000,           // Her 60 saniyede bir yenile
  refetchOnWindowFocus: true,       // Pencere focus olduğunda yenile
  onSuccess: (data) => {            // Başarı callback'i
    console.log('Hesaplar yüklendi:', data.length);
  },
  onError: (error) => {             // Hata callback'i
    console.error('Hata:', error);
  }
});
```

## 📊 Cache Yapılandırması

Varsayılan cache süreleri:

- **Hesaplar**: 10 dakika (sık değişmez)
- **Hareketler**: 3 dakika
- **Bakiyeler**: 2-5 dakika
- **Raporlar**: 15 dakika
- **Stoklar**: 10 dakika

Cache süresini değiştirmek için:

```tsx
const { data } = useNetsisAccounts('2024', 'VERI', {
  staleTime: 30 * 60 * 1000,  // 30 dakika
  gcTime: 60 * 60 * 1000,      // 1 saat
});
```

## 🔒 Güvenlik

- SQL injection'dan korunmak için backend'de parametreli sorgular kullanın
- API token'ları environment variable'larda saklayın
- Backend'de yetkilendirme kontrolü yapın

## 🐛 Debugging

```tsx
import { RN_CONFIG } from '@/modules/data-layer';

// Log'ları açmak için
RN_CONFIG.ENABLE_LOGS = true;
```

## 📝 Type Tanımları

Tüm type tanımları `types/netsis.types.ts` dosyasında:

```typescript
import type {
  TNetsisAccount,
  TNetsisTransaction,
  TNetsisInvoice,
  TErpBalanceList,
  // ... diğerleri
} from '@/types/netsis.types';
```

## 🔄 Migration Guide (Angular'dan)

| Angular | React Native/TanStack Query |
|---------|----------------------------|
| `invoices(year, company).then()` | `useNetsisInvoices(year, company)` |
| `accounts(year, company).then()` | `useNetsisAccounts(year, company)` |
| `transactions(id, y, c).then()` | `useNetsisTransactions(id, y, c)` |
| `balance(id, y, c).then()` | `useNetsisBalance(id, y, c)` |
| `getStocks(c).then()` | `useNetsisStocks(c)` |

## 💡 Best Practices

1. **Enabled kullanın**: Gereksiz sorguları önleyin
```tsx
const { data } = useNetsisTransactions(accountId, year, company, {
  enabled: !!accountId  // accountId varsa çalıştır
});
```

2. **Error handling**: Her zaman error durumunu kontrol edin
```tsx
const { data, error, isError } = useNetsisAccounts(year, company);

if (isError) {
  return <ErrorComponent error={error} />;
}
```

3. **Loading states**: Kullanıcıya geri bildirim verin
```tsx
const { data, isLoading, isFetching } = useNetsisAccounts(year, company);

if (isLoading) return <LoadingSpinner />;
if (isFetching) return <RefreshIndicator />;
```

4. **Memoization**: Hesaplamaları optimize edin
```tsx
const totalBalance = useMemo(() => {
  return balances?.reduce((sum, b) => sum + b.BAKIYE, 0) ?? 0;
}, [balances]);
```

