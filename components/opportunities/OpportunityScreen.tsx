import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSalespeopleQuery } from '../../modules/data-layer';
import { useOpportunitiesQuery } from '../../modules/data-layer/hooks/useOpportunitiesQuery';
import { useStyles } from '../../modules/theme';
import { TOpportunity, TSalesperson } from '../../types/dto';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityFilter } from './OpportunityFilter';
import { OpportunityStats } from './OpportunityStats';

interface OpportunityScreenProps {
  initialSearchQuery?: string;
}

export function OpportunityScreen({ initialSearchQuery }: OpportunityScreenProps = {}) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  // Initial search query'nin sadece bir kez çalışması için ref
  const hasProcessedInitialQuery = useRef(false);
  
  // Arama state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TOpportunity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Satışçı verilerini çek
  const { salespeople, loading: salespeopleLoading } = useSalespeopleQuery();
  const [showSearchResults, setShowSearchResults] = useState(false);


  // Satışçı atama state'leri
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<TOpportunity | null>(null);

  const { colors, spacing, fontSize } = useStyles();

  const opportunitiesQuery = useOpportunitiesQuery();
  
  // Seçilen ay/yıl için fırsatları ve istatistikleri getir (arama modunda devre dışı)
  const opportunitiesStatsQuery = opportunitiesQuery.useOpportunitiesStats(selectedYear, selectedMonth, {
    enabled: !showSearchResults // Arama modunda devre dışı
  });

  // Mutation hook'ları
  const assignSellerMutation = opportunitiesQuery.useAssignSeller();

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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.large,
      width: '90%' as const,
      maxHeight: '80%' as const,
    },
    modalTitle: {
      fontSize: fontSize.large,
      fontWeight: 'bold' as const,
      color: colors.text,
      textAlign: 'center' as const,
      marginBottom: spacing.large,
    },
    sellerItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.small,
      borderRadius: 8,
      marginVertical: 2,
    },
    selectedSeller: {
      backgroundColor: colors.primary + '20',
    },
    sellerAvatar: {
      fontSize: 24,
      marginRight: spacing.medium,
    },
    sellerInfo: {
      flex: 1,
    },
    sellerName: {
      fontSize: fontSize.medium,
      fontWeight: '600' as const,
      color: colors.text,
    },
    sellerEmail: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    cancelButton: {
      backgroundColor: colors.border + '30',
      paddingVertical: spacing.medium,
      borderRadius: 8,
      marginTop: spacing.medium,
    },
    cancelButtonText: {
      fontSize: fontSize.medium,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
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
    opportunitiesStatsQuery.refetch();
  }, [opportunitiesStatsQuery]);

  const handleOpportunityPress = useCallback((opportunity: TOpportunity) => {
    router.push({
      pathname: '/(drawer)/opportunity-detail',
      params: {
        opportunityData: JSON.stringify(opportunity)
      }
    });
  }, []);

  const handleAssignSellerPress = useCallback((opportunity: TOpportunity) => {
    setSelectedOpportunity(opportunity);
    setShowSellerModal(true);
  }, []);

  const handleAssignSeller = useCallback((seller: TSalesperson) => {
    if (!selectedOpportunity?.id) return;

    console.log('🔄 Satışçı atama başlatılıyor:', {
      opportunityId: selectedOpportunity.id,
      sellerId: seller.id,
      sellerName: seller.name
    });

    assignSellerMutation.mutate(
      {
        id: selectedOpportunity.id,
        data: {
          sellerId: seller.id,
        },
        sellerName: seller.name, // Satışçı adını log için gönder
        sellerToken: 'mock-token', // TODO: Gerçek FCM token'ı al
        opportunityData: {
          no: selectedOpportunity.no,
          company: selectedOpportunity.company,
          request: selectedOpportunity.request
        }
      },
      {
        onSuccess: (updatedOpportunity: TOpportunity) => {
          console.log('✅ Satışçı atama başarılı:', updatedOpportunity);
          setShowSellerModal(false);
          setSelectedOpportunity(null);
          opportunitiesStatsQuery.refetch();
          Alert.alert('Başarılı', `${seller.name} satışçı olarak atandı ve durum 'Atandı' olarak güncellendi. Bildirimler gönderildi.`);
        },
        onError: (error: any) => {
          console.error('❌ Satışçı atama hatası:', error);
          Alert.alert('Hata', 'Satışçı ataması yapılırken bir hata oluştu.');
        },
      }
    );
  }, [selectedOpportunity, assignSellerMutation, opportunitiesStatsQuery]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Fırsat numarası ile arama yap
      let results: TOpportunity[] = [];
      
      // Eğer sayısal bir değer ise numaraya göre ara
      if (!isNaN(parseInt(query.trim()))) {
        results = await opportunitiesQuery.searchOpportunitiesByNumber(query.trim());
      } else {
        // Değilse şirket adına göre ara
        results = await opportunitiesQuery.searchOpportunitiesByCompany(query.trim());
      }
      
      setSearchResults(results || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  }, [opportunitiesQuery]);

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
          let results: TOpportunity[] = [];
          
          // Eğer sayısal bir değer ise numaraya göre ara
          if (!isNaN(parseInt(initialSearchQuery.trim()))) {
            results = await opportunitiesQuery.searchOpportunitiesByNumber(initialSearchQuery.trim());
          } else {
            // Değilse şirket adına göre ara
            results = await opportunitiesQuery.searchOpportunitiesByCompany(initialSearchQuery.trim());
          }
          
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
  }, [initialSearchQuery, opportunitiesQuery]);

  const renderOpportunityCard = (opportunity: TOpportunity) => {
    if (!opportunity.id) return null;
    
    return (
      <View key={opportunity.id || opportunity.no?.toString() || Math.random().toString()}>
        <OpportunityCard
          opportunity={opportunity}
          onPress={handleOpportunityPress}
          onAssignSeller={handleAssignSellerPress}
        />
      </View>
    );
  };

  if (opportunitiesStatsQuery.error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Fırsatlar</ThemedText>
        </View>
        
        <OpportunityFilter
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />
        
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Fırsat verileri yüklenirken bir hata oluştu.
          </ThemedText>
          <ThemedText style={[styles.errorText, { fontSize: 14, marginTop: 8 }]}>
            {opportunitiesStatsQuery.error.message}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const opportunities = opportunitiesStatsQuery.data || [];
  const displayOpportunities = showSearchResults ? searchResults : opportunities;

  return (
    <ThemedView style={styles.container}>
      {/* Arama Kutusu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={colors.text + '60'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Fırsat numarası veya şirket adı ile ara..."
            placeholderTextColor={colors.text + '60'}
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            onSubmitEditing={handleSearchSubmit}
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
        <OpportunityFilter
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
            refreshing={opportunitiesStatsQuery.isFetching && !opportunitiesStatsQuery.isLoading}
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
        {!showSearchResults && <OpportunityStats stats={opportunitiesStatsQuery.stats} />}

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
        {!showSearchResults && opportunitiesStatsQuery.isLoading && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: spacing.medium, color: colors.textLight }}>
              Fırsatlar yükleniyor...
            </ThemedText>
          </View>
        )}

        {/* Empty State */}
        {!isSearching && !opportunitiesStatsQuery.isLoading && displayOpportunities.length === 0 && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ThemedText style={{ color: colors.textLight, textAlign: 'center' }}>
              {showSearchResults ? 'Arama sonucu bulunamadı' : 'Seçilen dönemde fırsat bulunamadı'}
            </ThemedText>
          </View>
        )}

        {/* Fırsat Listesi */}
        {!isSearching && displayOpportunities.map((opportunity) => renderOpportunityCard(opportunity))}

        {/* Bottom Padding */}
        <View style={{ height: spacing.medium }} />
      </ScrollView>

      {/* Satışçı Seçim Modal */}
      <Modal
        visible={showSellerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSellerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSellerModal(false)}
        >
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Satışçı Seç</ThemedText>
            <ScrollView showsVerticalScrollIndicator={false}>
              {salespeopleLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
              ) : (
                salespeople.map((seller) => (
                  <TouchableOpacity
                    key={seller.id}
                    style={[
                      styles.sellerItem,
                      selectedOpportunity?.sellerId === seller.id && styles.selectedSeller,
                    ]}
                    onPress={() => handleAssignSeller(seller)}
                  >
                    <Text style={styles.sellerAvatar}>👤</Text>
                    <View style={styles.sellerInfo}>
                      <ThemedText style={styles.sellerName}>{seller.name}</ThemedText>
                      <ThemedText style={styles.sellerEmail}>{seller.mail}</ThemedText>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSellerModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>
                İptal
              </ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}
