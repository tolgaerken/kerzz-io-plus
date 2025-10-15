import { OUR_COMPANIES } from '@/constants/companies';
import { useCustomerQuery, useNetsisAccounts, useNetsisCariBorcYas } from '@/modules/data-layer';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CombinedBalance {
  CARI_KOD: string;
  cariName?: string;
  customerName?: string;
  companyBalances: {
    [companyId: string]: number;
  };
  totalBalance: number;
  overdueBalance: number; // Geciken bakiye (ToplamGecikme)
  overdueDetails?: {
    VadesiGelmemis?: number;
    GECIKMEGUN?: number;
    CariVade?: number;
  };
}

export function AllBalancesScreen() {
  const currentYear = new Date().getFullYear();
  
  // Filtre state'leri
  const [searchText, setSearchText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'negative' | 'overdue'>('all');
  
  // Müşteri verilerini çek
  const customerQuery = useCustomerQuery();
  const { data: customers, isLoading: isLoadingCustomers } = customerQuery.useRealCustomers();

  // Tüm şirketler için cari hesap bilgileri
  const veriAccountsQuery = useNetsisAccounts(currentYear, 'VERI', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'VERI')?.cloudDb,
  });
  const cloudAccountsQuery = useNetsisAccounts(currentYear, 'CLOUD', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'CLOUD')?.cloudDb,
  });
  const etyaAccountsQuery = useNetsisAccounts(currentYear, 'ETYA', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'ETYA')?.cloudDb,
  });
  const bttAccountsQuery = useNetsisAccounts(currentYear, 'BTT', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'BTT')?.cloudDb,
  });
  const markamutfagiAccountsQuery = useNetsisAccounts(currentYear, 'MARKAMUTFAGI', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'MARKAMUTFAGI')?.cloudDb,
  });

  // Tüm şirketler için borç yaşlandırma verileri
  const veriBorcYasQuery = useNetsisCariBorcYas(currentYear, 'VERI', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'VERI')?.cloudDb,
  });
  const cloudBorcYasQuery = useNetsisCariBorcYas(currentYear, 'CLOUD', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'CLOUD')?.cloudDb,
  });
  const etyaBorcYasQuery = useNetsisCariBorcYas(currentYear, 'ETYA', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'ETYA')?.cloudDb,
  });
  const bttBorcYasQuery = useNetsisCariBorcYas(currentYear, 'BTT', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'BTT')?.cloudDb,
  });
  const markamutfagiBorcYasQuery = useNetsisCariBorcYas(currentYear, 'MARKAMUTFAGI', {
    enabled: !!OUR_COMPANIES.find((c) => c.id === 'MARKAMUTFAGI')?.cloudDb,
  });

  // Borç yaşlandırma sorgularını birleştir
  const companyQueries = useMemo(() => [
    {
      companyId: 'VERI',
      companyName: 'VERİ YAZILIM A.Ş.',
      borcYasData: veriBorcYasQuery.data || [],
      isLoading: veriBorcYasQuery.isLoading,
      error: veriBorcYasQuery.error,
      refetch: veriBorcYasQuery.refetch,
    },
    {
      companyId: 'CLOUD',
      companyName: 'CLOUD LABS A.Ş.',
      borcYasData: cloudBorcYasQuery.data || [],
      isLoading: cloudBorcYasQuery.isLoading,
      error: cloudBorcYasQuery.error,
      refetch: cloudBorcYasQuery.refetch,
    },
    {
      companyId: 'ETYA',
      companyName: 'ETYA RESEARCH A.Ş.',
      borcYasData: etyaBorcYasQuery.data || [],
      isLoading: etyaBorcYasQuery.isLoading,
      error: etyaBorcYasQuery.error,
      refetch: etyaBorcYasQuery.refetch,
    },
    {
      companyId: 'BTT',
      companyName: 'BTT TEKNOLOJİ A.Ş.',
      borcYasData: bttBorcYasQuery.data || [],
      isLoading: bttBorcYasQuery.isLoading,
      error: bttBorcYasQuery.error,
      refetch: bttBorcYasQuery.refetch,
    },
    {
      companyId: 'MARKAMUTFAGI',
      companyName: 'MARKA MUTFAĞI A.Ş.',
      borcYasData: markamutfagiBorcYasQuery.data || [],
      isLoading: markamutfagiBorcYasQuery.isLoading,
      error: markamutfagiBorcYasQuery.error,
      refetch: markamutfagiBorcYasQuery.refetch,
    },
  ], [
    veriBorcYasQuery.data,
    veriBorcYasQuery.isLoading,
    veriBorcYasQuery.error,
    veriBorcYasQuery.refetch,
    cloudBorcYasQuery.data,
    cloudBorcYasQuery.isLoading,
    cloudBorcYasQuery.error,
    cloudBorcYasQuery.refetch,
    etyaBorcYasQuery.data,
    etyaBorcYasQuery.isLoading,
    etyaBorcYasQuery.error,
    etyaBorcYasQuery.refetch,
    bttBorcYasQuery.data,
    bttBorcYasQuery.isLoading,
    bttBorcYasQuery.error,
    bttBorcYasQuery.refetch,
    markamutfagiBorcYasQuery.data,
    markamutfagiBorcYasQuery.isLoading,
    markamutfagiBorcYasQuery.error,
    markamutfagiBorcYasQuery.refetch,
  ]);

  // Tüm şirketlerden cari hesap bilgilerini birleştir
  const cariNameMap = useMemo(() => {
    const map = new Map<string, string>();
    
    // Her şirketten gelen cari hesapları birleştir
    const allAccounts = [
      ...(veriAccountsQuery.data || []),
      ...(cloudAccountsQuery.data || []),
      ...(etyaAccountsQuery.data || []),
      ...(bttAccountsQuery.data || []),
      ...(markamutfagiAccountsQuery.data || []),
    ];
    
    allAccounts.forEach((account) => {
      if (account.ID && account.name && !map.has(account.ID)) {
        map.set(account.ID, account.name);
      }
    });
    
    return map;
  }, [
    veriAccountsQuery.data,
    cloudAccountsQuery.data,
    etyaAccountsQuery.data,
    bttAccountsQuery.data,
    markamutfagiAccountsQuery.data,
  ]);

  // Müşteri erpId -> name mapping oluştur
  const customerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (customers) {
      customers.forEach((customer) => {
        if (customer.erpId) {
          map.set(customer.erpId, customer.name);
        }
      });
    }
    return map;
  }, [customers]);

  // NetsisCariBorcYas verilerinden bakiyeleri birleştir
  const combinedBalances = useMemo(() => {
    const balanceMap = new Map<string, CombinedBalance>();

    companyQueries.forEach((companyQuery) => {
      if (!companyQuery.borcYasData || companyQuery.isLoading) return;

      companyQuery.borcYasData.forEach((item) => {
        if (!item.CariKodu) return;

        const existing = balanceMap.get(item.CariKodu);
        const cariName = cariNameMap.get(item.CariKodu) || item.CariUnvan;
        const customerName = customerNameMap.get(item.CariKodu);
        const balance = item.CariBakiye || 0;
        const overdueBalance = item.ToplamGecikme || 0;
        
        if (existing) {
          existing.companyBalances[companyQuery.companyId] = balance;
          existing.totalBalance += balance;
          existing.overdueBalance += overdueBalance;
          
          // İsimleri henüz yoksa ve şimdi bulduysak ekle
          if (!existing.cariName && cariName) {
            existing.cariName = cariName;
          }
          if (!existing.customerName && customerName) {
            existing.customerName = customerName;
          }
          
          // Geciken bakiye detaylarını güncelle
          if (existing.overdueDetails) {
            existing.overdueDetails.VadesiGelmemis = (existing.overdueDetails.VadesiGelmemis || 0) + (item.VadesiGelmemis || 0);
            existing.overdueDetails.GECIKMEGUN = Math.max(existing.overdueDetails.GECIKMEGUN || 0, item.GECIKMEGUN || 0);
            existing.overdueDetails.CariVade = Math.max(existing.overdueDetails.CariVade || 0, item.CariVade || 0);
          }
        } else {
          balanceMap.set(item.CariKodu, {
            CARI_KOD: item.CariKodu,
            cariName,
            customerName,
            companyBalances: {
              [companyQuery.companyId]: balance,
            },
            totalBalance: balance,
            overdueBalance: overdueBalance,
            overdueDetails: {
              VadesiGelmemis: item.VadesiGelmemis || 0,
              GECIKMEGUN: item.GECIKMEGUN || 0,
              CariVade: item.CariVade || 0,
            },
          });
        }
      });
    });

    return Array.from(balanceMap.values())
      .sort((a, b) => Math.abs(b.totalBalance) - Math.abs(a.totalBalance));
  }, [companyQueries, cariNameMap, customerNameMap]);

  // Filtrelenmiş bakiyeler
  const filteredBalances = useMemo(() => {
    let filtered = combinedBalances;

    // Arama filtresi
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const cariKodMatch = item.CARI_KOD.toLowerCase().includes(searchLower);
        const cariNameMatch = item.cariName?.toLowerCase().includes(searchLower);
        const customerNameMatch = item.customerName?.toLowerCase().includes(searchLower);
        return cariKodMatch || cariNameMatch || customerNameMatch;
      });
    }

    // Şirket filtresi
    if (selectedCompany) {
      filtered = filtered.filter((item) => {
        const balance = item.companyBalances[selectedCompany];
        return balance && balance !== 0;
      });
    }

    // Bakiye türü filtresi
    if (balanceFilter === 'positive') {
      filtered = filtered.filter((item) => item.totalBalance > 0);
    } else if (balanceFilter === 'negative') {
      filtered = filtered.filter((item) => item.totalBalance < 0);
    } else if (balanceFilter === 'overdue') {
      filtered = filtered.filter((item) => item.overdueBalance > 0);
    }

    return filtered;
  }, [combinedBalances, searchText, selectedCompany, balanceFilter]);

  // Toplam bakiyeler - NetsisCariBorcYas verilerinden
  const totals = useMemo(() => {
    const result: { [companyId: string]: number } = {};
    let grandTotal = 0;

    companyQueries.forEach((companyQuery) => {
      const total = companyQuery.borcYasData.reduce(
        (sum, item) => sum + (item.CariBakiye || 0),
        0
      );
      result[companyQuery.companyId] = total;
      grandTotal += total;
    });

    return { byCompany: result, grandTotal };
  }, [companyQueries]);

  const isLoading = companyQueries.some((q) => q.isLoading) || 
                    isLoadingCustomers ||
                    veriAccountsQuery.isLoading ||
                    cloudAccountsQuery.isLoading ||
                    etyaAccountsQuery.isLoading ||
                    bttAccountsQuery.isLoading ||
                    markamutfagiAccountsQuery.isLoading;
  const hasError = companyQueries.some((q) => q.error);

  const handleRefresh = async () => {
    await Promise.all([
      ...companyQueries.map((q) => q.refetch()),
      veriAccountsQuery.refetch(),
      cloudAccountsQuery.refetch(),
      etyaAccountsQuery.refetch(),
      bttAccountsQuery.refetch(),
      markamutfagiAccountsQuery.refetch(),
    ]);
  };

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  const getBalanceColor = useCallback((balance: number) => {
    if (balance > 0) return '#10b981'; // Yeşil - Borç
    if (balance < 0) return '#ef4444'; // Kırmızı - Alacak
    return '#6b7280'; // Gri - Sıfır
  }, []);

  // Balance Card Component
  const renderBalanceCard = useCallback(({ item }: { item: CombinedBalance }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cariInfo}>
          <Text style={styles.cariCode}>{item.CARI_KOD}</Text>
          {item.cariName && (
            <Text style={styles.cariName}>{item.cariName}</Text>
          )}
        </View>
        <View style={styles.totalBalanceContainer}>
          <Text style={styles.totalLabel}>Toplam</Text>
          <Text
            style={[
              styles.totalBalanceAmount,
              { color: getBalanceColor(item.totalBalance) },
            ]}
          >
            {formatCurrency(item.totalBalance)}
          </Text>
          {item.overdueBalance > 0 && (
            <>
              <Text style={styles.overdueLabel}>Geciken</Text>
              <Text style={styles.overdueAmount}>
                {formatCurrency(item.overdueBalance)}
              </Text>
            </>
          )}
        </View>
      </View>
      
      <View style={styles.cardBody}>
        {OUR_COMPANIES.filter((c) => c.cloudDb).map((company) => {
          const balance = item.companyBalances[company.id];
          if (!balance || balance === 0) return null;
          
          return (
            <View key={company.id} style={styles.companyBalanceRow}>
              <Text style={styles.companyBalanceLabel}>
                {company.id}
              </Text>
              <Text
                style={[
                  styles.companyBalanceAmount,
                  { color: getBalanceColor(balance) },
                ]}
              >
                {formatCurrency(balance)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  ), [formatCurrency, getBalanceColor]);

  // Header Component
  const renderHeader = useCallback(() => (
    <>
      {/* Şirket Toplamları */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Şirket Bazında Toplam Bakiyeler</Text>
        {OUR_COMPANIES.filter((c) => c.cloudDb).map((company) => (
          <View key={company.id} style={styles.summaryRow}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text
              style={[
                styles.summaryAmount,
                { color: getBalanceColor(totals.byCompany[company.id] || 0) },
              ]}
            >
              {formatCurrency(totals.byCompany[company.id] || 0)}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.grandTotalLabel}>GENEL TOPLAM</Text>
          <Text
            style={[
              styles.grandTotalAmount,
              { color: getBalanceColor(totals.grandTotal) },
            ]}
          >
            {formatCurrency(totals.grandTotal)}
          </Text>
        </View>
      </View>

      {/* Hata mesajı */}
      {hasError && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>
            Bazı şirket verileri yüklenemedi. Lütfen tekrar deneyin.
          </Text>
        </View>
      )}

      {/* Filtreler */}
      <View style={styles.filterContainer}>
        {/* Arama */}
        <TextInput
          style={styles.searchInput}
          placeholder="Cari kodu, cari adı veya müşteri adı ara..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9ca3af"
        />

        {/* Şirket Filtreleri */}
        <View style={styles.chipContainer}>
          <TouchableOpacity
            style={[styles.chip, !selectedCompany && styles.chipActive]}
            onPress={() => setSelectedCompany(null)}
          >
            <Text style={[styles.chipText, !selectedCompany && styles.chipTextActive]}>
              Tümü
            </Text>
          </TouchableOpacity>
          {OUR_COMPANIES.filter((c) => c.cloudDb).map((company) => (
            <TouchableOpacity
              key={company.id}
              style={[styles.chip, selectedCompany === company.id && styles.chipActive]}
              onPress={() => setSelectedCompany(selectedCompany === company.id ? null : company.id)}
            >
              <Text style={[styles.chipText, selectedCompany === company.id && styles.chipTextActive]}>
                {company.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bakiye Türü Filtreleri */}
        <View style={styles.chipContainer}>
          <TouchableOpacity
            style={[styles.chip, balanceFilter === 'all' && styles.chipActive]}
            onPress={() => setBalanceFilter('all')}
          >
            <Text style={[styles.chipText, balanceFilter === 'all' && styles.chipTextActive]}>
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, balanceFilter === 'positive' && styles.chipActivePositive]}
            onPress={() => setBalanceFilter('positive')}
          >
            <Text style={[styles.chipText, balanceFilter === 'positive' && styles.chipTextActive]}>
              Borç
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, balanceFilter === 'negative' && styles.chipActiveNegative]}
            onPress={() => setBalanceFilter('negative')}
          >
            <Text style={[styles.chipText, balanceFilter === 'negative' && styles.chipTextActive]}>
              Alacak
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, balanceFilter === 'overdue' && styles.chipActiveOverdue]}
            onPress={() => setBalanceFilter('overdue')}
          >
            <Text style={[styles.chipText, balanceFilter === 'overdue' && styles.chipTextActive]}>
              Geciken
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste Başlığı */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>
          Cari Bazında Detaylı Bakiyeler
        </Text>
        <Text style={styles.listHeaderCount}>
          {filteredBalances.length} / {combinedBalances.length}
        </Text>
      </View>
    </>
  ), [totals, hasError, combinedBalances.length, filteredBalances.length, searchText, selectedCompany, balanceFilter, formatCurrency, getBalanceColor]);

  if (isLoading && combinedBalances.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Bakiyeler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBalances}
        renderItem={renderBalanceCard}
        keyExtractor={(item) => item.CARI_KOD}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 140, // Approximate card height
          offset: 140 * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: '#6b7280',
  },
  listContainer: {
    paddingBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  companyName: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  grandTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 11,
    color: '#dc2626',
    textAlign: 'center',
  },
  listHeader: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  listHeaderCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cariInfo: {
    flex: 1,
    marginRight: 12,
  },
  cariCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cariName: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  totalBalanceContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  totalBalanceAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  overdueLabel: {
    fontSize: 9,
    color: '#dc2626',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  overdueAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  cardBody: {
    gap: 8,
  },
  companyBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  companyBalanceLabel: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '600',
  },
  companyBalanceAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipActivePositive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  chipActiveNegative: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  chipActiveOverdue: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
  },
  chipTextActive: {
    color: '#ffffff',
  },
});

