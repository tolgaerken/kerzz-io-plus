import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useStyles } from '../../modules/theme';
import { TOffer, TOfferRow } from '../../types/offer.types';

export default function OfferDetailScreen() {
  const { offerData } = useLocalSearchParams();
  const offer: TOffer = offerData ? JSON.parse(offerData as string) : null;
  const { colors, spacing, fontSize } = useStyles();

  const handleBack = useCallback(() => {
    router.push('/(drawer)/offers');
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    backButton: {
      padding: spacing.small,
      marginRight: spacing.small,
    },
    title: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    scrollContainer: {
      padding: spacing.medium,
    },
    infoSection: {
      backgroundColor: colors.card,
      padding: spacing.medium,
      borderRadius: 12,
      marginBottom: spacing.medium,
      borderWidth: 1,
      borderColor: colors.border + '40',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerTitle: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: spacing.small,
    },
    headerSubtitle: {
      fontSize: fontSize.small,
      color: colors.textLight,
      marginBottom: 3,
    },
    section: {
      backgroundColor: colors.card,
      padding: spacing.medium,
      borderRadius: 12,
      marginBottom: spacing.medium,
      borderWidth: 1,
      borderColor: colors.border + '40',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: fontSize.medium,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: spacing.small,
    },
    itemContainer: {
      backgroundColor: colors.background,
      padding: spacing.small,
      borderRadius: 8,
      marginBottom: spacing.small,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    itemName: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 3,
    },
    itemDescription: {
      fontSize: fontSize.small,
      color: colors.textLight,
      marginBottom: spacing.small,
    },
    itemDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    itemPrice: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.primary,
    },
    itemQuantity: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    emptyText: {
      fontSize: fontSize.small,
      color: colors.textLight,
      fontStyle: 'italic',
      textAlign: 'center',
      padding: spacing.large,
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.medium,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
      marginTop: spacing.small,
    },
    totalLabel: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.text,
    },
    totalAmount: {
      fontSize: fontSize.small,
      fontWeight: 'bold',
      color: colors.primary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xlarge,
    },
    errorText: {
      fontSize: fontSize.medium,
      color: colors.error,
      textAlign: 'center',
      marginTop: spacing.medium,
    },
  });

  const formatCurrency = (amount: number, currency: string = 'tl') => {
    const currencyMap: { [key: string]: string } = {
      'tl': 'TRY',
      'usd': 'USD',
      'eur': 'EUR'
    };
    
    const currencyCode = currencyMap[currency.toLowerCase()] || 'TRY';
    const locale = currencyCode === 'TRY' ? 'tr-TR' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
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

  const renderOfferItems = (items: TOfferRow[], title: string) => {
    if (!items || items.length === 0) {
      return null; // Boş arraylar için hiçbir şey render etme
    }

    // Para birimlerine göre toplamları hesapla
    const currencyTotals = items.reduce((acc, item) => {
      const currency = item.currency || 'tl';
      const amount = item.grandTotal || item.total || 0;
      acc[currency] = (acc[currency] || 0) + amount;
      return acc;
    }, {} as { [key: string]: number });

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {items.map((item, index) => (
          <View key={item.id || index} style={styles.itemContainer}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            {item.description && (
              <ThemedText style={styles.itemDescription}>{item.description}</ThemedText>
            )}
            <View style={styles.itemDetails}>
              <ThemedText style={styles.itemQuantity}>
                Miktar: {item.qty} {item.unit || 'adet'}
              </ThemedText>
              <ThemedText style={styles.itemPrice}>
                {formatCurrency(item.grandTotal || item.total || 0, item.currency || 'tl')}
              </ThemedText>
            </View>
          </View>
        ))}
        
        {/* Para birimlerine göre toplamlar */}
        {Object.entries(currencyTotals).map(([currency, total]) => (
          <View key={currency} style={styles.totalContainer}>
            <ThemedText style={styles.totalLabel}>
              Toplam {title} ({currency.toUpperCase()}):
            </ThemedText>
            <ThemedText style={styles.totalAmount}>
              {formatCurrency(total, currency)}
            </ThemedText>
          </View>
        ))}
      </View>
    );
  };

  if (!offer) {
    return (
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Teklif Detayı</ThemedText>
        </View>
        
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Teklif bilgisi bulunamadı</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>
          Teklif #{offer.no || offer.number}
        </ThemedText>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.headerTitle}>
            Teklif #{offer.no || offer.number}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {offer.company}
          </ThemedText>
          {offer.brand && (
            <ThemedText style={styles.headerSubtitle}>
              {offer.brand}
            </ThemedText>
          )}
          <ThemedText style={[styles.headerSubtitle, { marginTop: spacing.small }]}>
            Tarih: {formatDate(offer.saleDate)}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Satış Temsilcisi: {offer.sellerName || 'Belirtilmemiş'}
          </ThemedText>
        </View>

        {/* Products Section */}
        {renderOfferItems(offer.products || [], 'Ürünler')}

        {/* Licenses Section */}
        {renderOfferItems(offer.licances || [], 'Lisanslar')}

        {/* Rentals Section */}
        {renderOfferItems(offer.rentys || [], 'Kiralamalar')}

        {/* Summary Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Özet</ThemedText>
          
          {/* Para birimlerine göre genel toplam */}
          {(() => {
            // Tüm ürünlerden para birimlerine göre toplam hesapla
            const allItems = [
              ...(offer.products || []),
              ...(offer.licances || []),
              ...(offer.rentys || [])
            ];
            
            const currencyTotals = allItems.reduce((acc, item) => {
              const currency = item.currency || 'tl';
              const amount = item.grandTotal || item.total || 0;
              acc[currency] = (acc[currency] || 0) + amount;
              return acc;
            }, {} as { [key: string]: number });

            return Object.entries(currencyTotals).map(([currency, total]) => (
              <View key={currency} style={styles.totalContainer}>
                <ThemedText style={styles.totalLabel}>
                  Ara Toplam ({currency.toUpperCase()}):
                </ThemedText>
                <ThemedText style={styles.totalAmount}>
                  {formatCurrency(total, currency)}
                </ThemedText>
              </View>
            ));
          })()}

          {offer.discount > 0 && (
            <View style={styles.totalContainer}>
              <ThemedText style={styles.totalLabel}>İndirim:</ThemedText>
              <ThemedText style={[styles.totalAmount, { color: colors.error }]}>
                -{formatCurrency(offer.discount, 'tl')}
              </ThemedText>
            </View>
          )}
          {offer.tax > 0 && (
            <View style={styles.totalContainer}>
              <ThemedText style={styles.totalLabel}>Vergi:</ThemedText>
              <ThemedText style={styles.totalAmount}>{formatCurrency(offer.tax, 'tl')}</ThemedText>
            </View>
          )}
          <View style={[styles.totalContainer, { borderTopWidth: 2, paddingTop: spacing.medium, marginTop: spacing.small }]}>
            <ThemedText style={[styles.totalLabel, { fontSize: fontSize.medium, fontWeight: 'bold' }]}>
              Genel Toplam (TL):
            </ThemedText>
            <ThemedText style={[styles.totalAmount, { fontSize: fontSize.medium, fontWeight: 'bold' }]}>
              {formatCurrency(offer.grandTotal || offer.total || 0, 'tl')}
            </ThemedText>
          </View>
        </View>

        {/* Notes Section */}
        {offer.note && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Notlar</ThemedText>
            <ThemedText style={[styles.itemDescription, { fontSize: fontSize.small }]}>
              {offer.note}
            </ThemedText>
          </View>
        )}

        {/* Offer Note Section */}
        {offer.offerNote && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Teklif Notu</ThemedText>
            <ThemedText style={[styles.itemDescription, { fontSize: fontSize.small }]}>
              {offer.offerNote}
            </ThemedText>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: spacing.large }} />
      </ScrollView>
    </ThemedView>
  );
}

