import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, TextInput, TouchableOpacity, View } from 'react-native';
import { useCustomerQuery } from '../../modules/data-layer/hooks/useCustomerQuery';
import { useStyles } from '../../modules/theme';
import { CustomerSearchParams, TCustomer } from '../../types/customer.types';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { CustomerCard } from './CustomerCard';

interface CustomersScreenProps {
  initialSearchQuery?: string;
  mode?: 'all' | 'real' | 'potential';
}

export function CustomersScreen({ initialSearchQuery, mode = 'all' }: CustomersScreenProps = {}) {
  const { colors, spacing, fontSize } = useStyles();
  const customerQuery = useCustomerQuery();

  // UI state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [searchParams, setSearchParams] = useState<CustomerSearchParams>({});

  // Veri sorguları: mode'a göre uygun listeyi seç
  const realCustomersQuery = customerQuery.useRealCustomers({ enabled: mode === 'real' });
  const potentialCustomersQuery = customerQuery.usePotentialCustomers({ enabled: mode === 'potential' });
  const allCustomersQuery = customerQuery.useCustomerSearch(searchParams, { enabled: mode === 'all' });

  const activeQuery = useMemo(() => {
    if (mode === 'real') return realCustomersQuery;
    if (mode === 'potential') return potentialCustomersQuery;
    return allCustomersQuery;
  }, [mode, realCustomersQuery, potentialCustomersQuery, allCustomersQuery]);

  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    activeQuery.refetch();
  }, [activeQuery]);

  const handleCustomerPress = useCallback((customer: TCustomer) => {
    // Şimdilik alert göstermiyoruz; detay ekranı daha sonra eklenebilir
    console.log('Customer pressed:', customer.id);
  }, []);

  const handleSearch = useCallback(() => {
    // Basit senaryo: numerik ise no ile, değilse name ile regex araması
    const isNumeric = /^\d+$/.test(searchQuery.trim());
    if (!searchQuery.trim()) {
      setSearchParams((prev) => ({ ...prev, name: undefined, taxNo: undefined }));
      return;
    }
    if (isNumeric) {
      setSearchParams((prev) => ({ ...prev, taxNo: searchQuery.trim(), name: undefined }));
    } else {
      setSearchParams((prev) => ({ ...prev, name: searchQuery.trim(), taxNo: undefined }));
    }
  }, [searchQuery]);

  const handleSearchInputChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchParams((prev) => ({ ...prev, name: undefined, taxNo: undefined }));
    }
  }, []);

  const handleSearchSubmit = useCallback(() => {
    handleSearch();
  }, [handleSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchParams((prev) => ({ ...prev, name: undefined, taxNo: undefined }));
  }, []);

  const renderEmptyComponent = useCallback(() => {
    if (activeQuery.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Müşteriler yükleniyor...</ThemedText>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>Müşteri yok</ThemedText>
      </View>
    );
  }, [activeQuery.isLoading, styles, colors.primary]);

  const data = activeQuery.data || [];

  return (
    <ThemedView style={styles.container}>
      {/* Arama Kutusu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={colors.text + '60'} />
          <TextInput
            style={styles.searchInput}
            placeholder="İsim veya vergi no ile ara..."
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

      {/* Virtual List */}
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id || (item as any)._id?.toString() || `customer-${index}`}
        renderItem={({ item }) => (
          <CustomerCard customer={item} onPress={handleCustomerPress} />
        )}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isFetching && !activeQuery.isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={7}
        initialNumToRender={10}
        updateCellsBatchingPeriod={100}
      />
    </ThemedView>
  );
}


