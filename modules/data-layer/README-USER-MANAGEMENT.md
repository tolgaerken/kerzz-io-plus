# User Management Servisi Kullanım Kılavuzu

Bu servis, SSO-DB ve Kerzz-Contract veritabanlarından kullanıcı verilerini çekip birleştiren ve satışçıları filtreleyip dönen bir sistemdir.

## Özellikler

- **Multi-Database Integration**: SSO-DB ve Kerzz-Contract veritabanlarından veri çekme
- **Data Combination**: Farklı kaynaklardan gelen verileri birleştirme
- **Salesperson Filtering**: Departman ID'sine göre satışçıları filtreleme
- **React Hooks**: Kolay kullanım için hazır hook'lar
- **TypeScript Support**: Tam tip güvenliği

## Kullanım

### 1. Temel Hook Kullanımı

```typescript
import { useSalespeopleQuery } from '../../modules/data-layer';

function MyComponent() {
  const { 
    salespeople, 
    allUsers, 
    loading, 
    error, 
    refetch,
    getSalespersonById,
    isSalesperson 
  } = useSalespeopleQuery();

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Hata: {error}</Text>;

  return (
    <View>
      {salespeople.map(seller => (
        <Text key={seller.id}>{seller.name}</Text>
      ))}
    </View>
  );
}
```

### 2. Sadece Satışçıları Getirme

```typescript
import { useSalespeople } from '../../modules/data-layer';

function SalesTeam() {
  const { salespeople, loading, error, refetch } = useSalespeople();
  
  return (
    <ScrollView>
      {salespeople.map(seller => (
        <View key={seller.id}>
          <Text>{seller.name}</Text>
          <Text>{seller.mail}</Text>
          <Text>Departman: {seller.departmentId}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

### 3. Kullanıcının Satışçı Olup Olmadığını Kontrol Etme

```typescript
import { useIsSalesperson } from '../../modules/data-layer';

function UserProfile({ userId }: { userId: string }) {
  const { isSalesperson, loading } = useIsSalesperson(userId);
  
  if (loading) return <ActivityIndicator />;
  
  return (
    <View>
      <Text>Satışçı: {isSalesperson ? 'Evet' : 'Hayır'}</Text>
    </View>
  );
}
```

### 4. Servis Direkt Kullanımı

```typescript
import { userManagementService } from '../../modules/data-layer';

// Tüm birleştirilmiş kullanıcıları getir
const allUsers = await userManagementService.getAllCombinedUsers();

// Sadece satışçıları getir
const salespeople = await userManagementService.getSalespeople();

// Belirli bir kullanıcının satışçı olup olmadığını kontrol et
const isUserSalesperson = await userManagementService.isSalesperson('user-id');

// Kullanıcı ID'sine göre birleştirilmiş kullanıcı bilgisini getir
const user = await userManagementService.getCombinedUserById('user-id');
```

## Veri Yapısı

### TUserApp (SSO-DB user-apps koleksiyonu)
```typescript
interface TUserApp {
  _id?: { $oid: string }
  id: string
  app_id: string
  editDate: Date
  editUser: string
  user_id: string
  user_name: string
}
```

### TUser (SSO-DB users koleksiyonu)
```typescript
interface TUser {
  _id?: { $oid: string }
  id: string
  name: string
  phone: string
  mail: string
  dateOfBirth?: Date
  gender: 'male' | 'female' | 'none'
  userLanguage?: string
  userRegion?: string
  lastLoginDate?: Date
  lastActionDate?: Date
  // ... diğer alanlar
}
```

### TUserProfile (Kerzz-Contract user-profiles koleksiyonu)
```typescript
interface TUserProfile {
  _id?: { $oid: string }
  id: string
  companyCode: string
  createdAt: Date
  departmentId: string
  editDate: Date
  editUser: string
  startDate: Date
  status: 'active' | 'inactive'
  updatedAt: Date
  userId: string
  creatorId: string
  endDate?: Date
  profilePhotoUrl?: string | null
  biography?: string
}
```

### TCombinedUser (Birleştirilmiş kullanıcı verisi)
```typescript
interface TCombinedUser {
  id: string
  name: string
  phone: string
  mail: string
  departmentId?: string
  status?: 'active' | 'inactive'
  profilePhotoUrl?: string | null
  biography?: string
  userLanguage?: string
  userRegion?: string
  lastLoginDate?: Date
  lastActionDate?: Date
  companyCode?: string
  startDate?: Date
  endDate?: Date
}
```

### TSalesperson (Satışçı - TCombinedUser'dan türetilmiş)
```typescript
interface TSalesperson extends TCombinedUser {
  departmentId: string // Satışçılar için zorunlu
}
```

## Konfigürasyon

### Sabitler
- **SALES_DEPARTMENT_ID**: `'ee08-7077'` - Satış departmanı ID'si
- **APP_ID**: `'1e4c-84b8'` - Uygulama ID'si

### API Endpoint'leri
- **User Apps**: `/sso-db/user-apps?app_id=${appId}`
- **Users**: `/sso-db/users/batch` (POST)
- **User Profiles**: `/kerzz-contract/user-profiles/batch` (POST)

## Hata Yönetimi

Tüm servisler ve hook'lar hata durumlarını yakalar ve uygun şekilde handle eder:

```typescript
try {
  const salespeople = await userManagementService.getSalespeople();
} catch (error) {
  console.error('Satışçı verileri alınırken hata:', error);
  // Hata handling logic
}
```

## Performans

- **Paralel API Çağrıları**: Users ve user-profiles verileri paralel olarak çekilir
- **Caching**: Hook'lar otomatik olarak verileri cache'ler
- **Lazy Loading**: Veriler sadece gerektiğinde yüklenir

## Opportunity Entegrasyonu

Bu servis, opportunity (fırsat) bileşenlerinde satışçı seçimi için kullanılır:

```typescript
// OpportunityCard.tsx
const { getSalespersonById } = useSalespeopleQuery();
const seller = getSalespersonById(opportunity.sellerId);

// OpportunityScreen.tsx
const { salespeople, loading: salespeopleLoading } = useSalespeopleQuery();
// Satışçı seçim modal'ında salespeople listesi kullanılır
```

## Geliştirme Notları

1. **Tip Güvenliği**: Tüm veri tipleri TypeScript ile tanımlanmıştır
2. **Error Handling**: Comprehensive hata yönetimi mevcuttur
3. **Logging**: Debug için detaylı log'lar eklenmiştir
4. **Singleton Pattern**: UserManagementService singleton pattern kullanır
5. **React Hooks**: Modern React pattern'leri kullanılmıştır

## Test

Servisi test etmek için:

```typescript
// Test component
function TestComponent() {
  const { salespeople, loading, error } = useSalespeople();
  
  console.log('Salespeople:', salespeople);
  console.log('Loading:', loading);
  console.log('Error:', error);
  
  return <Text>Test completed - check console</Text>;
}
```
