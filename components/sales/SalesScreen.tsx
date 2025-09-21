import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@modules/auth';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSalesQuery } from '../../modules/data-layer/hooks/useSalesQuery';
import { useStyles } from '../../modules/theme';
import { TSale } from '../../types/dto';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { SalesCard } from './SalesCard';
import { SalesFilter } from './SalesFilter';
import { SalesStats } from './SalesStats';
import { SalesToolbar } from './SalesToolbar';

interface SalesScreenProps {
  initialSearchQuery?: string;
}

export function SalesScreen({ initialSearchQuery }: SalesScreenProps = {}) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  // Initial search query'nin sadece bir kez çalışması için ref
  const hasProcessedInitialQuery = useRef(false);
  
  // Arama state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TSale[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Loading state'leri - hangi satışın hangi butonu loading
  const [loadingStates, setLoadingStates] = useState<{
    approving: Set<string>;
    invoiceApproving: Set<string>;
  }>({
    approving: new Set(),
    invoiceApproving: new Set(),
  });

  const { colors, spacing, fontSize } = useStyles();
  const { user } = useAuthStore();

  const salesQuery = useSalesQuery();
  
  // Seçilen ay/yıl için satışları ve istatistikleri getir (arama modunda devre dışı)
  const salesStatsQuery = salesQuery.useSalesStats(selectedYear, selectedMonth, {
    enabled: !showSearchResults // Arama modunda devre dışı
  });
  
  // Mutation hook'ları
  const approveSaleMutation = salesQuery.useApproveSale();
  const approveInvoiceMutation = salesQuery.useApproveInvoice();

  // Loading state helper fonksiyonları
  const setApproveLoading = useCallback((saleId: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      approving: loading 
        ? new Set([...prev.approving, saleId])
        : new Set([...prev.approving].filter(id => id !== saleId))
    }));
  }, []);

  const setInvoiceApproveLoading = useCallback((saleId: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      invoiceApproving: loading 
        ? new Set([...prev.invoiceApproving, saleId])
        : new Set([...prev.invoiceApproving].filter(id => id !== saleId))
    }));
  }, []);
  
  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    title: {
      fontSize: fontSize.xlarge,
      fontWeight: 'bold' as const,
      color: colors.text,
      textAlign: 'center' as const,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xlarge,
    },
    errorText: {
      fontSize: fontSize.medium,
      color: colors.error,
      textAlign: 'center' as const,
      marginTop: spacing.medium,
    },
    searchContainer: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      backgroundColor: colors.background,
    },
    searchInputContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border + '60',
      borderRadius: 12,
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.small,
    },
    searchInput: {
      flex: 1,
      fontSize: fontSize.medium,
      color: colors.text,
      paddingHorizontal: spacing.small,
      paddingVertical: 0,
    },
    searchButton: {
      padding: spacing.small,
      marginLeft: spacing.small,
    },
    clearButton: {
      padding: spacing.small,
    },
    searchResultsHeader: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    searchResultsTitle: {
      fontSize: fontSize.medium,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
  };

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
  }, []);

  const handleMonthChange = useCallback((month: number) => {
    setSelectedMonth(month);
  }, []);

  const handleRefresh = useCallback(() => {
    salesStatsQuery.refetch();
  }, [salesStatsQuery]);

  const handleSalePress = useCallback((sale: TSale) => {
    Alert.alert(
      'Satış Detayı',
      `Satış No: ${sale.no || sale.number}\nŞirket: ${sale.company}\nTutar: ${new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
      }).format(sale.grandTotal || sale.total || 0)}`,
      [{ text: 'Tamam' }]
    );
  }, []);

  const handleViewDetails = useCallback((sale: TSale) => {
    router.push({
      pathname: '/(drawer)/sale-detail',
      params: {
        saleData: JSON.stringify(sale)
      }
    });
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Satış numarası ile arama yap
      const results = await salesQuery.searchSalesByNumber(query.trim());
      setSearchResults(results || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  }, [salesQuery]);

  const handleSearchInputChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  }, []);

  const handleSearchSubmit = useCallback(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  }, []);

  // Initial search query'yi handle et (notification'dan gelen) - sadece bir kez
  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery.trim() && !hasProcessedInitialQuery.current) {
      console.log('🔍 Notification\'dan gelen arama sorgusu:', initialSearchQuery);
      hasProcessedInitialQuery.current = true;
      
      setSearchQuery(initialSearchQuery.trim());
      
      // Direkt arama yap (handleSearch dependency'sinden kaçınmak için)
      const performSearch = async () => {
        setIsSearching(true);
        try {
          const results = await salesQuery.searchSalesByNumber(initialSearchQuery.trim());
          setSearchResults(results || []);
          setShowSearchResults(true);
          console.log('✅ Initial search tamamlandı:', results?.length || 0, 'sonuç');
        } catch (error) {
          console.error('❌ Initial search hatası:', error);
          setSearchResults([]);
          setShowSearchResults(true);
        } finally {
          setIsSearching(false);
        }
      };
      
      performSearch();
    }
  }, [initialSearchQuery, salesQuery]);

  const handleApprove = useCallback((sale: TSale) => {
    if (!sale.id) {
      console.error('Satış ID bulunamadı');
      return;
    }

    const updateData = {
      approved: !sale.approved, // Toggle approval
      approved_userId: user?.id || 'current-user-id',
      approved_userName: user?.name || 'Current User',
      approve_time: new Date(),
    };

    // Loading başlat
    setApproveLoading(sale.id!, true);

    approveSaleMutation.mutate(
      { id: sale.id!, data: updateData },
      {
        onSuccess: () => {
          setApproveLoading(sale.id!, false);
          // Arama sonuçları gösteriliyorsa yerel listeyi güncelle
          setSearchResults(prev =>
            showSearchResults
              ? prev.map(s => (s.id === sale.id ? { ...s, ...updateData } as TSale : s))
              : prev
          );
          console.log('✅ Satış onayı güncellendi:', sale.approved ? 'Onay kaldırıldı' : 'Onaylandı');
        },
        onError: (error: any) => {
          setApproveLoading(sale.id!, false);
          console.error('❌ Satış onayı hatası:', error);
        },
      }
    );
  }, [user, approveSaleMutation, setApproveLoading]);

  const handleInvoiceApprove = useCallback((sale: TSale) => {
    if (!sale.id) {
      console.error('Satış ID bulunamadı');
      return;
    }

    const updateData = {
      invoiceApproved: !sale.invoiceApproved, // Toggle invoice approval
      invoiceApprovedAt: new Date(),
      invoiceApprovedBy: user?.id || 'current-user-id',
      invoiceApprovedByName: user?.name || 'Current User',
    };

    // Loading başlat
    setInvoiceApproveLoading(sale.id!, true);

    approveInvoiceMutation.mutate(
      { id: sale.id!, data: updateData },
      {
        onSuccess: () => {
          setInvoiceApproveLoading(sale.id!, false);
          // Arama sonuçları gösteriliyorsa yerel listeyi güncelle
          setSearchResults(prev =>
            showSearchResults
              ? prev.map(s => (s.id === sale.id ? { ...s, ...updateData } as TSale : s))
              : prev
          );
          console.log('✅ Fatura onayı güncellendi:', sale.invoiceApproved ? 'Onay kaldırıldı' : 'Onaylandı');
        },
        onError: (error: any) => {
          setInvoiceApproveLoading(sale.id!, false);
          console.error('❌ Fatura onayı hatası:', error);
        },
      }
    );
  }, [user, approveInvoiceMutation, setInvoiceApproveLoading]);


  const renderSaleCard = (sale: TSale) => {
    if (!sale.id) return null;
    
    return (
      <View key={sale.id || sale.no?.toString() || Math.random().toString()}>
        <SalesCard
          sale={sale}
          onPress={handleSalePress}
        />
        <SalesToolbar
          sale={sale}
          onApprove={handleApprove}
          onInvoiceApprove={handleInvoiceApprove}
          onViewDetails={handleViewDetails}
          isApprovingLoading={loadingStates.approving.has(sale.id)}
          isInvoiceApprovingLoading={loadingStates.invoiceApproving.has(sale.id)}
        />
      </View>
    );
  };

  if (salesStatsQuery.error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Satışlar</ThemedText>
        </View>
        
        <SalesFilter
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />
        
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Satış verileri yüklenirken bir hata oluştu.
          </ThemedText>
          <ThemedText style={[styles.errorText, { fontSize: 14, marginTop: 8 }]}>
            {salesStatsQuery.error.message}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const sales = salesStatsQuery.data || [];
  const displaySales = showSearchResults ? searchResults : sales;

  return (
    <ThemedView style={styles.container}>
      {/* Arama Kutusu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={colors.text + '60'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Satış numarası ile ara..."
            placeholderTextColor={colors.text + '60'}
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            onSubmitEditing={handleSearchSubmit}
            keyboardType="numeric"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
              <MaterialIcons name="clear" size={20} color={colors.text + '60'} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
            <MaterialIcons name="search" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtreler - Fixed (sadece arama sonuçları gösterilmiyorsa) */}
      {!showSearchResults && (
        <SalesFilter
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />
      )}

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={salesStatsQuery.isFetching && !salesStatsQuery.isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Arama Sonuçları Başlığı */}
        {showSearchResults && (
          <View style={styles.searchResultsHeader}>
            <ThemedText style={styles.searchResultsTitle}>
              Arama Sonuçları ({searchResults.length} sonuç)
            </ThemedText>
          </View>
        )}

        {/* İstatistikler (sadece normal görünümde) */}
        {!showSearchResults && <SalesStats stats={salesStatsQuery.stats} />}

        {/* Arama Loading State */}
        {isSearching && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: spacing.medium, color: colors.textLight }}>
              Aranıyor...
            </ThemedText>
          </View>
        )}

        {/* Normal Loading State */}
        {!showSearchResults && salesStatsQuery.isLoading && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: spacing.medium, color: colors.textLight }}>
              Satışlar yükleniyor...
            </ThemedText>
          </View>
        )}

        {/* Empty State */}
        {!isSearching && !salesStatsQuery.isLoading && displaySales.length === 0 && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ThemedText style={{ color: colors.textLight, textAlign: 'center' }}>
              {showSearchResults ? 'Arama sonucu bulunamadı' : 'Seçilen dönemde satış bulunamadı'}
            </ThemedText>
          </View>
        )}

        {/* Satış Listesi */}
        {!isSearching && displaySales.map((sale) => renderSaleCard(sale))}

        {/* Bottom Padding */}
        <View style={{ height: spacing.medium }} />
      </ScrollView>
    </ThemedView>
  );
}
