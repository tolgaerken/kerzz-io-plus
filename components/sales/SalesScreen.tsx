import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';
import { useSalesQuery } from '../../modules/data-layer/hooks/useSalesQuery';
import { TSale } from '../../types/dto';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { SalesFilter } from './SalesFilter';
import { SalesStats } from './SalesStats';

export function SalesScreen() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackgroundColor = useThemeColor({ light: '#F9FAFB', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'text');

  const salesQuery = useSalesQuery();
  
  // Seçilen ay/yıl için satışları ve istatistikleri getir
  const salesStatsQuery = salesQuery.useSalesStats(selectedYear, selectedMonth);
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'text') + '30',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textColor,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: textColor + '80',
      textAlign: 'center',
      marginTop: 4,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
      marginTop: 16,
    },
  });

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

  const getMonthName = (month: number) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return months[month - 1];
  };

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
        badgeStyle: { backgroundColor: '#10B981' + '20' },
        textStyle: { color: '#10B981' },
      };
    } else {
      return {
        text: 'Beklemede',
        badgeStyle: { backgroundColor: '#F59E0B' + '20' },
        textStyle: { color: '#F59E0B' },
      };
    }
  };

  const renderSaleCard = (sale: TSale) => {
    const statusInfo = getStatusInfo(sale);

    return (
      <TouchableOpacity
        key={sale.id || sale.no?.toString() || Math.random().toString()}
        style={{
          backgroundColor: cardBackgroundColor,
          marginHorizontal: 16,
          marginVertical: 6,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: borderColor + '40',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        onPress={() => handleSalePress(sale)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: tintColor }}>
            #{sale.no || sale.number}
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: textColor + '80' }}>
            {formatDate(sale.saleDate)}
          </ThemedText>
        </View>

        <ThemedText style={{ fontSize: 16, fontWeight: '600', color: textColor, marginBottom: 4 }}>
          {sale.company}
        </ThemedText>

        {sale.description && (
          <ThemedText style={{ fontSize: 14, color: textColor + '90', marginBottom: 8 }} numberOfLines={2}>
            {sale.description}
          </ThemedText>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <ThemedText style={{ fontSize: 12, color: textColor + '70' }}>
            Satış: {sale.sellerName || 'Belirtilmemiş'}
          </ThemedText>
        </View>

        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: 8, 
          paddingTop: 8, 
          borderTopWidth: 1, 
          borderTopColor: borderColor + '30' 
        }}>
          <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color: textColor }}>
            {formatCurrency(sale.grandTotal || sale.total || 0)}
          </ThemedText>
          
          <View style={[
            { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
            statusInfo.badgeStyle
          ]}>
            <Text style={[{ fontSize: 12, fontWeight: '600' }, statusInfo.textStyle]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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

  return (
    <ThemedView style={styles.container}>
      {/* Header - Fixed */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Satışlar</ThemedText>
        <ThemedText style={styles.subtitle}>
          {getMonthName(selectedMonth)} {selectedYear}
        </ThemedText>
      </View>

      {/* Filtreler - Fixed */}
      <SalesFilter
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={salesStatsQuery.isFetching && !salesStatsQuery.isLoading}
            onRefresh={handleRefresh}
            colors={[tintColor]}
            tintColor={tintColor}
          />
        }
      >
        {/* İstatistikler */}
        <SalesStats stats={salesStatsQuery.stats} />

        {/* Loading State */}
        {salesStatsQuery.isLoading && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={{ marginTop: 16, color: textColor + '80' }}>
              Satışlar yükleniyor...
            </ThemedText>
          </View>
        )}

        {/* Empty State */}
        {!salesStatsQuery.isLoading && sales.length === 0 && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ThemedText style={{ color: textColor + '80', textAlign: 'center' }}>
              Seçilen dönemde satış bulunamadı
            </ThemedText>
          </View>
        )}

        {/* Satış Listesi */}
        {sales.map((sale) => renderSaleCard(sale))}

        {/* Bottom Padding */}
        <View style={{ height: 16 }} />
      </ScrollView>
    </ThemedView>
  );
}
