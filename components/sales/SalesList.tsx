import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';
import { TSale } from '../../types/dto';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { SalesCard } from './SalesCard';

interface SalesListProps {
  sales: TSale[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onSalePress?: (sale: TSale) => void;
}

export function SalesList({ 
  sales, 
  loading = false, 
  refreshing = false, 
  onRefresh, 
  onSalePress
}: SalesListProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'text');
  const cardBackgroundColor = useThemeColor({ light: '#F9FAFB', dark: '#1F2937' }, 'background');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor,
    },
    emptyText: {
      fontSize: 16,
      color: textColor + '80',
      textAlign: 'center',
      marginTop: 16,
    },
    saleCard: {
      backgroundColor: cardBackgroundColor,
      marginHorizontal: 16,
      marginVertical: 6,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor + '40',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    saleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    saleNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: tintColor,
    },
    saleDate: {
      fontSize: 14,
      color: textColor + '80',
    },
    companyName: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 4,
    },
    saleDescription: {
      fontSize: 14,
      color: textColor + '90',
      marginBottom: 8,
    },
    saleFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: borderColor + '30',
    },
    saleAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textColor,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: tintColor + '20',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: tintColor,
    },
    approvedBadge: {
      backgroundColor: '#10B981' + '20',
    },
    approvedText: {
      color: '#10B981',
    },
    pendingBadge: {
      backgroundColor: '#F59E0B' + '20',
    },
    pendingText: {
      color: '#F59E0B',
    },
    sellerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    sellerText: {
      fontSize: 12,
      color: textColor + '70',
    },
  });

  

  const renderSaleItem = ({ item }: { item: TSale }) => {
    return (
      <SalesCard 
        sale={item} 
        onPress={onSalePress}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>
        Seçilen dönemde satış bulunamadı
      </ThemedText>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={[styles.emptyText, { marginTop: 16 }]}>
          Satışlar yükleniyor...
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={sales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id || item.no?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={sales.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[tintColor]}
              tintColor={tintColor}
            />
          ) : undefined
        }
      />
    </ThemedView>
  );
}
