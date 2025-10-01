# 🔌 Netsis ERP Entegrasyonu

Angular'daki `NetsisSqlSocketService` servisi başarıyla React Native/TanStack Query'ye uyarlandı!

## 📁 Oluşturulan Dosyalar

### 1. Type Tanımları
**Dosya:** `types/netsis.types.ts`

Tüm Netsis veri tipleri:
- `TNetsisInvoice` - Faturalar
- `TNetsisAccount` - Cari hesaplar
- `TNetsisTransaction` - Hareketler
- `TNetsisBalance` - Bakiyeler
- `TErpBalanceList` - Yaşlandırma raporu
- `TNetsisStockBalance` - Stoklar
- `TNetsisMuhPivot` - Muhasebe pivot
- ve daha fazlası...

### 2. Servis Katmanı
**Dosya:** `services/netsisSqlService.ts`

Angular servisinden uyarlanan metotlar:
```typescript
class NetsisSqlService {
  getInvoices(year, company)
  getAccounts(year, company)
  getTransactions(accountId, year, company)
  getBalance(accountId, year, company)
  getAllBalances(year, company)
  getDocumentDetail(year, documentId, company)
  getCariBorcYas(company)
  getStocks(company)
  getMuhPivotOutcome(company)
  getMuhPivot(company)
}
```

### 3. TanStack Query Hooks
**Dosya:** `modules/data-layer/hooks/useNetsisQuery.ts`

14 adet custom hook:
- `useNetsisInvoices` - Faturaları getir
- `useNetsisAccounts` - Hesapları getir
- `useNetsisTransactions` - Hareketleri getir
- `useNetsisBalance` - Bakiye getir
- `useNetsisAllBalances` - Tüm bakiyeleri getir
- `useNetsisDocumentDetail` - Belge detayı
- `useNetsisCariBorcYas` - Yaşlandırma raporu
- `useNetsisStocks` - Stoklar
- `useNetsisMuhPivotOutcome` - Gider pivotu
- `useNetsisMuhPivot` - Genel pivot
- `useNetsisMuhTransactions` - Muhasebe hareketleri
- `useNetsisAccountDetails` - Birleştirilmiş hesap detayları
- `useNetsisInvalidation` - Cache yönetimi

### 4. Örnek Ekran
**Dosya:** `app/(drawer)/netsis-example.tsx`

Tam çalışır örnek:
- Hesap listesi
- Seçili hesap detayları
- Bakiye gösterimi
- Hareketler listesi
- Cache yenileme

### 5. Dokümantasyon
**Dosya:** `modules/data-layer/NETSIS-README.md`

Kapsamlı kullanım kılavuzu:
- Kurulum adımları
- Kod örnekleri
- Hook referansları
- Best practices
- Migration guide

## 🚀 Hızlı Başlangıç

### 1. Environment Setup

`.env` dosyanıza ekleyin:
```env
EXPO_PUBLIC_NETSIS_SQL_URL=https://your-sql-server.com/api/sql
```

### 2. Backend Endpoint

Backend'de SQL executor oluşturun:
```typescript
POST /api/sql
Body: { sql: "SELECT * FROM ..." }
Response: [...results]
```

### 3. Kullanım

```tsx
import { useNetsisAccounts } from '@/modules/data-layer';

function MyScreen() {
  const { data, isLoading, error } = useNetsisAccounts('2024', 'VERI');
  
  if (isLoading) return <Text>Yükleniyor...</Text>;
  if (error) return <Text>Hata: {error.message}</Text>;
  
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <Text>{item.name} - {item.ID}</Text>
      )}
    />
  );
}
```

## ✨ Özellikler

### ✅ Orijinal Angular Servisten Taşınanlar
- ✅ Tüm SQL sorgu metodları
- ✅ Fatura, hesap, hareket sorguları
- ✅ Yaşlandırma raporları
- ✅ Stok sorguları
- ✅ Muhasebe pivot raporları
- ✅ Belge detay sorguları

### 🚀 Yeni Eklenenler (React Native)
- ✅ TanStack Query entegrasyonu
- ✅ Otomatik cache yönetimi
- ✅ Real-time data synchronization
- ✅ Optimistic updates
- ✅ Error handling & retry logic
- ✅ TypeScript tip güvenliği
- ✅ Composite hooks (birleştirilmiş veri)
- ✅ Cache invalidation helpers

### 💪 TanStack Query Avantajları
- **Auto Caching**: Veriler otomatik cache'lenir
- **Background Updates**: Arka planda güncellemeler
- **Retry Logic**: Hata durumunda otomatik retry
- **Loading States**: Otomatik loading state yönetimi
- **Optimistic Updates**: Anında UI güncellemeleri
- **Query Invalidation**: Kolay cache temizleme

## 📊 Migration Karşılaştırma

| Angular (Eski) | React Native (Yeni) |
|----------------|---------------------|
| Promise tabanlı | React Hook tabanlı |
| Manuel state yönetimi | Otomatik state yönetimi |
| Manuel cache | TanStack Query cache |
| `.then()` callback | Declarative hooks |
| Manuel loading | `isLoading` prop |
| Manuel error handling | `error` prop |

### Örnek Migration

**Angular (Eski):**
```typescript
// Component
invoices: any[] = [];
loading = false;

ngOnInit() {
  this.loading = true;
  this.netsisService.invoices('2024', 'VERI').then(data => {
    this.invoices = data;
    this.loading = false;
  });
}
```

**React Native (Yeni):**
```tsx
// Component
const { data: invoices, isLoading } = useNetsisInvoices('2024', 'VERI');

// That's it! 🎉
```

## 🎯 Kullanım Senaryoları

### Senaryo 1: Hesap Listesi
```tsx
const { data: accounts } = useNetsisAccounts('2024', 'VERI');
```

### Senaryo 2: Hesap Detayları + Bakiye
```tsx
const { account, balance, transactions } = 
  useNetsisAccountDetails(accountId, '2024', 'VERI');
```

### Senaryo 3: Fatura Listesi
```tsx
const { data: invoices } = useNetsisInvoices('2024', 'VERI');
```

### Senaryo 4: Yaşlandırma Raporu
```tsx
const { data: ageingReport } = useNetsisCariBorcYas('VERI');
```

### Senaryo 5: Stok Sorgulama
```tsx
const { data: stocks } = useNetsisStocks('VERI2024');
```

## 🔧 Gelişmiş Özellikler

### Şartlı Yükleme
```tsx
const { data } = useNetsisTransactions(accountId, year, company, {
  enabled: !!accountId && !!year
});
```

### Otomatik Yenileme
```tsx
const { data } = useNetsisAccounts(year, company, {
  refetchInterval: 60000 // Her 60 saniyede bir
});
```

### Cache Yönetimi
```tsx
const { invalidateAll, invalidateAccounts } = useNetsisInvalidation();

// Tümünü temizle
invalidateAll();

// Sadece hesapları temizle
invalidateAccounts('2024', 'VERI');
```

## 📝 Notlar

1. **Backend Gereksinimi**: SQL sorguları çalıştıracak bir backend endpoint gereklidir
2. **Güvenlik**: SQL injection'dan korunmak için backend'de parametreli sorgular kullanın
3. **Token**: Auth token otomatik olarak header'a eklenir
4. **Cache**: Varsayılan cache süreleri optimize edilmiştir

## 🐛 Troubleshooting

### SQL Endpoint Bulunamıyor
```env
# .env dosyasını kontrol edin
EXPO_PUBLIC_NETSIS_SQL_URL=https://...
```

### Token Hatası
```tsx
// Auth store'da token olduğundan emin olun
const authStore = useAuthStore();
console.log('Token:', authStore.userInfo?.token);
```

### Cache Güncellenmiyor
```tsx
// Manuel invalidate edin
const { invalidateAll } = useNetsisInvalidation();
invalidateAll();
```

## 📚 Daha Fazla Bilgi

- Detaylı kullanım: `modules/data-layer/NETSIS-README.md`
- Type referansları: `types/netsis.types.ts`
- Servis implementasyonu: `services/netsisSqlService.ts`
- Örnek ekran: `app/(drawer)/netsis-example.tsx`

## 🎉 Sonuç

Angular'daki Netsis servisi başarıyla React Native/TanStack Query'ye taşındı!

**Avantajlar:**
- ✅ Daha az kod
- ✅ Otomatik state yönetimi
- ✅ Daha iyi performans
- ✅ Type safety
- ✅ Modern React patterns
- ✅ Kolay kullanım

**Kullanıma Hazır!** 🚀

