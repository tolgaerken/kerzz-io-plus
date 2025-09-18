import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';
import { TSale } from '../../types/dto';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getStatusInfo = (sale: TSale) => {
    if (sale.approved) {
      return {
        text: 'Onaylandı',
        badgeStyle: styles.approvedBadge,
        textStyle: styles.approvedText,
      };
    } else {
      return {
        text: 'Beklemede',
        badgeStyle: styles.pendingBadge,
        textStyle: styles.pendingText,
      };
    }
  };

  const renderSaleItem = ({ item }: { item: TSale }) => {
    const statusInfo = getStatusInfo(item);

    return (
      <TouchableOpacity
        style={styles.saleCard}
        onPress={() => onSalePress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.saleHeader}>
          <ThemedText style={styles.saleNumber}>
            #{item.no || item.number}
          </ThemedText>
          <ThemedText style={styles.saleDate}>
            {formatDate(item.saleDate)}
          </ThemedText>
        </View>

        <ThemedText style={styles.companyName}>
          {item.company}
        </ThemedText>

        {item.description && (
          <ThemedText style={styles.saleDescription} numberOfLines={2}>
            {item.description}
          </ThemedText>
        )}

        <View style={styles.sellerInfo}>
          <ThemedText style={styles.sellerText}>
            Satış: {item.sellerName || 'Belirtilmemiş'}
          </ThemedText>
        </View>

        <View style={styles.saleFooter}>
          <ThemedText style={styles.saleAmount}>
            {formatCurrency(item.grandTotal || item.total || 0)}
          </ThemedText>
          
          <View style={[styles.statusBadge, statusInfo.badgeStyle]}>
            <Text style={[styles.statusText, statusInfo.textStyle]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
