import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useOffersQuery } from '../../modules/data-layer/hooks/useOffersQuery';
import { useStyles } from '../../modules/theme';
import { TOffer } from '../../types/offer.types';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { OfferCard } from './OfferCard';
import { OfferFilter } from './OfferFilter';
import { OfferStats } from './OfferStats';
import { OfferToolbar } from './OfferToolbar';

interface OfferScreenProps {
  initialSearchQuery?: string;
}

export function OfferScreen({ initialSearchQuery }: OfferScreenProps = {}) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  // Initial search query'nin tekrar arama yapmaması için ref
  const hasProcessedInitialQuery = useRef<string | null>(null);
  
  // Arama state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TOffer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  

  const { colors, spacing, fontSize } = useStyles();
  const offersQuery = useOffersQuery();
  
  // Seçilen ay/yıl için teklifleri ve istatistikleri getir (arama modunda devre dışı)
  const offersStatsQuery = offersQuery.useOffersStats(selectedYear, selectedMonth, {
    enabled: !showSearchResults // Arama modunda devre dışı
  });
  
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
    offersStatsQuery.refetch();
  }, [offersStatsQuery]);

  const handleOfferPress = useCallback((offer: TOffer) => {
    Alert.alert(
      'Teklif Detayı',
      `Teklif No: ${offer.no || offer.number}\nŞirket: ${offer.company}\nTutar: ${new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
      }).format(offer.grandTotal || offer.total || 0)}`,
      [{ text: 'Tamam' }]
    );
  }, []);

  const handleViewDetails = useCallback((offer: TOffer) => {
    router.push({
      pathname: '/(drawer)/offer-detail',
      params: {
        offerData: JSON.stringify(offer)
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
      // Teklif numarası ile arama yap
      const results = await offersQuery.searchOffersByNumber(query.trim());
      setSearchResults(results || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  }, [offersQuery]);

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

  // Initial search query'yi handle et (notification'dan gelen)
  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery.trim()) {
      console.log('🔍 Notification\'dan gelen arama sorgusu:', initialSearchQuery);
      
      if (hasProcessedInitialQuery.current === initialSearchQuery) {
        console.log('⏭️ Aynı arama sorgusu, tekrar arama yapılmıyor');
        return;
      }
      
      hasProcessedInitialQuery.current = initialSearchQuery;
      
      setSearchQuery(initialSearchQuery.trim());
      
      const performSearch = async () => {
        setIsSearching(true);
        try {
          const results = await offersQuery.searchOffersByNumber(initialSearchQuery.trim());
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
  }, [initialSearchQuery, offersQuery]);

  const renderOfferCard = (offer: TOffer) => {
    if (!offer.id) return null;
    
    return (
      <View key={offer.id || offer.no?.toString() || Math.random().toString()}>
        <OfferCard
          offer={offer}
          onPress={handleOfferPress}
        />
        <OfferToolbar
          offer={offer}
          onViewDetails={handleViewDetails}
        />
      </View>
    );
  };

  if (offersStatsQuery.error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Teklifler</ThemedText>
        </View>
        
        <OfferFilter
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />
        
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Teklif verileri yüklenirken bir hata oluştu.
          </ThemedText>
          <ThemedText style={[styles.errorText, { fontSize: 14, marginTop: 8 }]}>
            {(offersStatsQuery.error as any)?.message}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const offers = offersStatsQuery.data || [];
  const displayOffers = showSearchResults ? searchResults : offers;

  return (
    <ThemedView style={styles.container}>
      {/* Arama Kutusu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={colors.text + '60'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Teklif numarası ile ara..."
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
        <OfferFilter
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
            refreshing={offersStatsQuery.isFetching && !offersStatsQuery.isLoading}
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
        {!showSearchResults && <OfferStats stats={offersStatsQuery.stats} />}

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
        {!showSearchResults && offersStatsQuery.isLoading && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: spacing.medium, color: colors.textLight }}>
              Teklifler yükleniyor...
            </ThemedText>
          </View>
        )}

        {/* Empty State */}
        {!isSearching && !offersStatsQuery.isLoading && displayOffers.length === 0 && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ThemedText style={{ color: colors.textLight, textAlign: 'center' }}>
              {showSearchResults ? 'Arama sonucu bulunamadı' : 'Seçilen dönemde teklif bulunamadı'}
            </ThemedText>
          </View>
        )}

        {/* Teklif Listesi */}
        {!isSearching && displayOffers.map((offer) => renderOfferCard(offer))}

        {/* Bottom Padding */}
        <View style={{ height: spacing.medium }} />
      </ScrollView>
    </ThemedView>
  );
}

