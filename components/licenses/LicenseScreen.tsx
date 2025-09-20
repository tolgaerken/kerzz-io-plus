import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@modules/auth';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, TextInput, TouchableOpacity, View } from 'react-native';
import { useLicenseQuery } from '../../modules/data-layer/hooks/useLicenseQuery';
import { useStyles } from '../../modules/theme';
import { LicenseSearchParams, TLicense } from '../../types/license.types';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { LicenseCard } from './LicenseCard';
import { LicenseFilter } from './LicenseFilter';
import { LicenseStats } from './LicenseStats';
import { LicenseToolbar } from './LicenseToolbar';

interface LicenseScreenProps {
  initialSearchQuery?: string;
}

export function LicenseScreen({ initialSearchQuery }: LicenseScreenProps = {}) {
  // Initial search query'nin sadece bir kez çalışması için ref
  const hasProcessedInitialQuery = useRef(false);
  
  // Arama state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TLicense[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Filter state'leri
  const [searchParams, setSearchParams] = useState<LicenseSearchParams>({});
  
  // Loading state'leri - hangi lisansın hangi butonu loading
  const [loadingStates, setLoadingStates] = useState<{
    blockToggling: Set<string>;
    activeToggling: Set<string>;
  }>({
    blockToggling: new Set(),
    activeToggling: new Set(),
  });

  const { colors, spacing, fontSize } = useStyles();
  const { user } = useAuthStore();

  const licenseQuery = useLicenseQuery();
  
  // Filtrelenmiş lisansları getir (arama modunda devre dışı)
  const licensesQuery = licenseQuery.useLicenseSearch(searchParams, {
    enabled: !showSearchResults // Arama modunda devre dışı
  });
  
  // İstatistikleri getir (arama modunda devre dışı)
  const statsQuery = licenseQuery.useLicenseStats({
    enabled: !showSearchResults // Arama modunda devre dışı
  });
  
  // Mutation hook'ları
  const toggleBlockMutation = licenseQuery.useToggleBlock();
  const toggleActiveMutation = licenseQuery.useToggleActive();

  // Loading state helper fonksiyonları
  const setBlockToggleLoading = useCallback((licenseId: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      blockToggling: loading 
        ? new Set([...prev.blockToggling, licenseId])
        : new Set([...prev.blockToggling].filter(id => id !== licenseId))
    }));
  }, []);

  const setActiveToggleLoading = useCallback((licenseId: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      activeToggling: loading 
        ? new Set([...prev.activeToggling, licenseId])
        : new Set([...prev.activeToggling].filter(id => id !== licenseId))
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
    listContainer: {
      flex: 1,
    },
    emptyContainer: {
      padding: spacing.xlarge,
      alignItems: 'center' as const,
    },
    emptyText: {
      color: colors.textLight,
      textAlign: 'center' as const,
    },
    loadingContainer: {
      padding: spacing.xlarge,
      alignItems: 'center' as const,
    },
    loadingText: {
      marginTop: spacing.medium,
      color: colors.textLight,
    },
  };

  const handleRefresh = useCallback(() => {
    if (showSearchResults) {
      // Arama sonuçlarını yenile
      handleSearch(searchQuery);
    } else {
      // Normal listeyi yenile
      licensesQuery.refetch();
      statsQuery.refetch();
    }
  }, [showSearchResults, searchQuery, licensesQuery, statsQuery]);

  const handleLicensePress = useCallback((license: TLicense) => {
    Alert.alert(
      'Lisans Detayı',
      `Lisans No: ${license.no || license.licenseId}\nMüşteri: ${license.customerName}\nMarka: ${license.brandName || 'Belirtilmemiş'}`,
      [{ text: 'Tamam' }]
    );
  }, []);

  const handleViewDetails = useCallback((license: TLicense) => {
    router.push({
      pathname: '/(drawer)/license-detail',
      params: {
        licenseId: license.id
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
      // Lisans numarası ile arama yap
      const results = await licenseQuery.searchLicensesByNumber(query.trim());
      setSearchResults(results || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  }, [licenseQuery]);

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
      
      // Direkt arama yap
      const performSearch = async () => {
        setIsSearching(true);
        try {
          const results = await licenseQuery.searchLicensesByNumber(initialSearchQuery.trim());
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
  }, [initialSearchQuery, licenseQuery]);

  const handleToggleBlock = useCallback((license: TLicense) => {
    if (!license.id) {
      console.error('Lisans ID bulunamadı');
      return;
    }

    const newBlockState = !license.block;
    let blockMessage = '';

    if (newBlockState) {
      Alert.prompt(
        'Lisans Blokla',
        'Blok sebebini giriniz:',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Blokla',
            onPress: (message) => {
              blockMessage = message || 'Sebep belirtilmedi';
              performBlockToggle(license.id!, newBlockState, blockMessage);
            }
          }
        ],
        'plain-text'
      );
    } else {
      performBlockToggle(license.id!, newBlockState, blockMessage);
    }
  }, []);

  const performBlockToggle = useCallback((licenseId: string, block: boolean, blockMessage: string) => {
    setBlockToggleLoading(licenseId, true);

    toggleBlockMutation.mutate(
      { id: licenseId, block, blockMessage },
      {
        onSuccess: () => {
          setBlockToggleLoading(licenseId, false);
          console.log('✅ Lisans blok durumu güncellendi:', block ? 'Bloklandı' : 'Blok kaldırıldı');
        },
        onError: (error: any) => {
          setBlockToggleLoading(licenseId, false);
          console.error('❌ Lisans blok durumu güncelleme hatası:', error);
        },
      }
    );
  }, [toggleBlockMutation, setBlockToggleLoading]);

  const handleToggleActive = useCallback((license: TLicense) => {
    if (!license.id) {
      console.error('Lisans ID bulunamadı');
      return;
    }

    const newActiveState = !license.active;

    setActiveToggleLoading(license.id!, true);

    toggleActiveMutation.mutate(
      { id: license.id!, active: newActiveState },
      {
        onSuccess: () => {
          setActiveToggleLoading(license.id!, false);
          console.log('✅ Lisans aktif durumu güncellendi:', newActiveState ? 'Aktifleştirildi' : 'Pasifleştirildi');
        },
        onError: (error: any) => {
          setActiveToggleLoading(license.id!, false);
          console.error('❌ Lisans aktif durumu güncelleme hatası:', error);
        },
      }
    );
  }, [toggleActiveMutation, setActiveToggleLoading]);

  const renderLicenseItem = useCallback(({ item }: { item: TLicense }) => {
    if (!item.id) return null;
    
    return (
      <View style={{ height: 250 }}> {/* Sabit container yüksekliği */}
        <LicenseCard
          license={item}
          onPress={handleLicensePress}
        />
        <LicenseToolbar
          license={item}
          onToggleBlock={handleToggleBlock}
          onToggleActive={handleToggleActive}
          onViewDetails={handleViewDetails}
          isBlockToggleLoading={loadingStates.blockToggling.has(item.id)}
          isActiveToggleLoading={loadingStates.activeToggling.has(item.id)}
        />
      </View>
    );
  }, [handleLicensePress, handleToggleBlock, handleToggleActive, handleViewDetails, loadingStates]);

  const renderEmptyComponent = useCallback(() => {
    if (isSearching || licensesQuery.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>
            {isSearching ? 'Aranıyor...' : 'Lisanslar yükleniyor...'}
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          {showSearchResults ? 'Arama sonucu bulunamadı' : 'Lisans bulunamadı'}
        </ThemedText>
      </View>
    );
  }, [isSearching, licensesQuery.isLoading, showSearchResults, colors.primary, styles]);

  const renderHeader = useCallback(() => {
    return (
      <>
        {/* Arama Sonuçları Başlığı */}
        {showSearchResults && (
          <View style={styles.searchResultsHeader}>
            <ThemedText style={styles.searchResultsTitle}>
              Arama Sonuçları ({searchResults.length} sonuç)
            </ThemedText>
          </View>
        )}

        {/* İstatistikler (sadece normal görünümde) */}
        {!showSearchResults && <LicenseStats stats={statsQuery.stats} />}
      </>
    );
  }, [showSearchResults, searchResults.length, statsQuery.stats, styles]);

  if (licensesQuery.error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Lisanslar</ThemedText>
        </View>
        
        <LicenseFilter
          searchParams={searchParams}
          onSearchParamsChange={setSearchParams}
        />
        
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Lisans verileri yüklenirken bir hata oluştu.
          </ThemedText>
          <ThemedText style={[styles.errorText, { fontSize: 14, marginTop: 8 }]}>
            {licensesQuery.error.message}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const licenses = licensesQuery.data || [];
  const displayLicenses = showSearchResults ? searchResults : licenses;

  return (
    <ThemedView style={styles.container}>
      {/* Arama Kutusu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={colors.text + '60'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Lisans numarası ile ara..."
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

      {/* Filtreler (sadece arama sonuçları gösterilmiyorsa) */}
      {!showSearchResults && (
        <LicenseFilter
          searchParams={searchParams}
          onSearchParamsChange={setSearchParams}
        />
      )}

      {/* Virtual List */}
      <FlatList
        style={styles.listContainer}
        data={displayLicenses}
        renderItem={renderLicenseItem}
        keyExtractor={(item, index) => item.id || item._id?.toString() || `license-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={licensesQuery.isFetching && !licensesQuery.isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // Virtual list optimizasyonu
        maxToRenderPerBatch={8} // Batch başına render edilecek item sayısı (azaltıldı)
        windowSize={5} // Görünür alan çarpanı (azaltıldı)
        initialNumToRender={8} // İlk render'da gösterilecek item sayısı (azaltıldı)
        updateCellsBatchingPeriod={100} // Batch güncelleme periyodu
        legacyImplementation={false} // Yeni FlatList implementasyonu kullan
        getItemLayout={(data, index) => ({
          length: 250, // Sabit item yüksekliği (LicenseCard 160px + LicenseToolbar 80px + marginler)
          offset: 250 * index,
          index,
        })}
      />
    </ThemedView>
  );
}
