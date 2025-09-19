import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCitiesQuery, useCountiesQuery, useSalespeopleQuery } from '../../modules/data-layer';
import { useStyles } from '../../modules/theme';
import { TOpportunity } from '../../types/dto';
import { ThemedText } from '../themed-text';

interface OpportunityCardProps {
  opportunity: TOpportunity;
  onPress?: (opportunity: TOpportunity) => void;
  onAssignSeller?: (opportunity: TOpportunity) => void;
}

export function OpportunityCard({ opportunity, onPress, onAssignSeller }: OpportunityCardProps) {
  const { colors, spacing, fontSize } = useStyles();
  
  // Satışçı verilerini çek
  const { getSalespersonById } = useSalespeopleQuery();
  
  // İl ve ilçe verilerini çek
  const citiesQuery = useCitiesQuery();
  const countiesQuery = useCountiesQuery();
  
  // İl ve ilçe isimlerini al
  const cityName = opportunity.cityId ? citiesQuery.getCityById(opportunity.cityId)?.name || opportunity.city : opportunity.city;
  const countyName = opportunity.townId ? countiesQuery.getCountyById(opportunity.townId)?.name || opportunity.town : opportunity.town;

  const styles = StyleSheet.create({
    opportunityCard: {
      backgroundColor: colors.card,
      marginHorizontal: spacing.medium,
      marginVertical: spacing.small / 2,
      padding: spacing.medium,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border + '40',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    opportunityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.small,
    },
    opportunityHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
      flex: 1,
      flexWrap: 'wrap',
    },
    opportunityNumber: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.primary,
    },
    opportunityDate: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    companyName: {
      fontSize: fontSize.medium,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    opportunityDescription: {
      fontSize: fontSize.small,
      color: colors.textLight,
      marginBottom: spacing.small,
    },
    opportunityFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.small,
      paddingTop: spacing.small,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
      flexWrap: 'wrap',
      gap: spacing.small,
    },
    contactInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    contactText: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    statusBadge: {
      paddingHorizontal: spacing.small,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.primary + '20',
      flexShrink: 0,
      minWidth: 60,
      alignItems: 'center',
    },
    statusText: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.primary,
    },
    heatBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      marginLeft: spacing.small,
    },
    heatText: {
      fontSize: 10,
      fontWeight: '600',
    },
    // Heat level colors
    hotBadge: {
      backgroundColor: colors.error + '20',
      borderColor: colors.error + '30',
    },
    hotText: {
      color: colors.error,
    },
    warmBadge: {
      backgroundColor: colors.warning + '20',
      borderColor: colors.warning + '30',
    },
    warmText: {
      color: colors.warning,
    },
    coldBadge: {
      backgroundColor: colors.textLight + '20',
      borderColor: colors.textLight + '30',
    },
    coldText: {
      color: colors.textLight,
    },
    // Status colors
    newBadge: {
      backgroundColor: colors.info + '20',
    },
    newText: {
      color: colors.info,
    },
    inProgressBadge: {
      backgroundColor: colors.warning + '20',
    },
    inProgressText: {
      color: colors.warning,
    },
    wonBadge: {
      backgroundColor: colors.success + '20',
    },
    wonText: {
      color: colors.success,
    },
    lostBadge: {
      backgroundColor: colors.error + '20',
    },
    lostText: {
      color: colors.error,
    },
    sellerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      flexWrap: 'wrap',
    },
    sellerText: {
      fontSize: fontSize.small,
      color: colors.textLight,
      flex: 1,
      marginRight: spacing.small,
    },
    typeChip: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    typeText: {
      fontSize: 8,
      fontWeight: '600',
      color: colors.primary,
    },
    assignSellerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.primary + '40',
      flexShrink: 0,
    },
    assignSellerButtonText: {
      fontSize: 9,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 3,
    },
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getHeatInfo = (heat: string) => {
    switch (heat?.toLowerCase()) {
      case 'hot':
        return {
          text: 'Sıcak',
          badgeStyle: styles.hotBadge,
          textStyle: styles.hotText,
        };
      case 'warm':
        return {
          text: 'Ilık',
          badgeStyle: styles.warmBadge,
          textStyle: styles.warmText,
        };
      case 'cold':
        return {
          text: 'Soğuk',
          badgeStyle: styles.coldBadge,
          textStyle: styles.coldText,
        };
      default:
        return {
          text: 'Belirsiz',
          badgeStyle: styles.coldBadge,
          textStyle: styles.coldText,
        };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return {
          text: 'Yeni',
          badgeStyle: styles.newBadge,
          textStyle: styles.newText,
        };
      case 'in-progress':
        return {
          text: 'Devam Ediyor',
          badgeStyle: styles.inProgressBadge,
          textStyle: styles.inProgressText,
        };
      case 'won':
        return {
          text: 'Kazanıldı',
          badgeStyle: styles.wonBadge,
          textStyle: styles.wonText,
        };
      case 'lost':
        return {
          text: 'Kaybedildi',
          badgeStyle: styles.lostBadge,
          textStyle: styles.lostText,
        };
      default:
        return {
          text: status || 'Belirsiz',
          badgeStyle: styles.statusBadge,
          textStyle: styles.statusText,
        };
    }
  };

  const statusInfo = getStatusInfo(opportunity.status);
  const heatInfo = getHeatInfo(opportunity.heat);
  const seller = getSalespersonById(opportunity.sellerId);
  
  // Debug için
  console.log('🔍 Seller debug:', {
    opportunityId: opportunity.id,
    sellerId: opportunity.sellerId,
    sellerIdType: typeof opportunity.sellerId,
    foundSeller: seller?.name || 'Bulunamadı'
  });

  return (
    <TouchableOpacity
      style={styles.opportunityCard}
      onPress={() => onPress?.(opportunity)}
      activeOpacity={0.7}
    >
      <View style={styles.opportunityHeader}>
        <View style={styles.opportunityHeaderLeft}>
          <ThemedText style={styles.opportunityNumber}>
            #{opportunity.no}
          </ThemedText>
          {opportunity.type && (
            <View style={styles.typeChip}>
              <ThemedText style={styles.typeText}>
                {opportunity.type}
              </ThemedText>
            </View>
          )}
          <View style={[styles.heatBadge, heatInfo.badgeStyle]}>
            <ThemedText style={[styles.heatText, heatInfo.textStyle]}>
              {heatInfo.text}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.opportunityDate}>
          {formatDate(opportunity.date)}
        </ThemedText>
      </View>

      <ThemedText style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">
        {opportunity.company}
      </ThemedText>

      {opportunity.brand && (
        <ThemedText style={{ fontSize: fontSize.small, color: colors.textLight, marginBottom: 4 }}>
          {opportunity.brand}
        </ThemedText>
      )}

      {opportunity.description && (
        <ThemedText style={styles.opportunityDescription} numberOfLines={2}>
          {opportunity.description}
        </ThemedText>
      )}

      {/* İletişim Bilgileri */}
      <View style={styles.contactInfo}>
        <ThemedText style={styles.contactText}>
          {opportunity.name} • {opportunity.email}
        </ThemedText>
      </View>

      {opportunity.phone && (
        <View style={styles.contactInfo}>
          <MaterialIcons name="phone" size={14} color={colors.textLight} />
          <ThemedText style={[styles.contactText, { marginLeft: 4 }]}>
            {opportunity.phone}
          </ThemedText>
        </View>
      )}

      {/* Satışçı Bilgisi */}
      <View style={styles.sellerInfo}>
        <ThemedText style={styles.sellerText}>
          Satışçı: {seller?.name || 'Atanmamış'}
        </ThemedText>
        {onAssignSeller && (
          <TouchableOpacity
            style={styles.assignSellerButton}
            onPress={(e) => {
              e.stopPropagation();
              onAssignSeller(opportunity);
            }}
          >
            <MaterialIcons name="person-add" size={10} color={colors.primary} />
            <ThemedText style={styles.assignSellerButtonText}>
              {seller ? 'Değiştir' : 'Ata'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Lokasyon Bilgisi */}
      {(cityName || countyName) && (
        <View style={styles.contactInfo}>
          <MaterialIcons name="location-on" size={14} color={colors.textLight} />
          <ThemedText style={[styles.contactText, { marginLeft: 4 }]}>
            {cityName}{countyName && ` / ${countyName}`}
          </ThemedText>
        </View>
      )}

      {/* Request Bilgisi */}
      {opportunity.request && (
        <View style={{ marginTop: spacing.small, paddingTop: spacing.small, borderTopWidth: 1, borderTopColor: colors.border + '30' }}>
          <View style={styles.contactInfo}>
            <MaterialIcons name="description" size={14} color={colors.textLight} />
            <ThemedText style={[styles.contactText, { marginLeft: 4, fontWeight: '600' }]}>
              Talep:
            </ThemedText>
          </View>
          <ThemedText style={[styles.contactText, { marginTop: 4, marginLeft: 18 }]}>
            {opportunity.request}
          </ThemedText>
        </View>
      )}

      {/* Loglar */}
      {opportunity.logs && opportunity.logs.length > 0 && (
        <View style={{ marginTop: spacing.small, paddingTop: spacing.small, borderTopWidth: 1, borderTopColor: colors.border + '30' }}>
          <View style={styles.contactInfo}>
            <MaterialIcons name="history" size={14} color={colors.textLight} />
            <ThemedText style={[styles.contactText, { marginLeft: 4, fontWeight: '600' }]}>
              Loglar ({opportunity.logs.length}):
            </ThemedText>
          </View>
          {opportunity.logs.slice(0, 3).map((log, index) => (
            <View key={log.id || index} style={{ marginTop: 4, marginLeft: 18 }}>
              <ThemedText style={[styles.contactText, { fontSize: 11, color: colors.textLight, fontWeight: '600' }]}>
                {new Date(log.date).toLocaleDateString('tr-TR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} - {log.userName}
              </ThemedText>
              <ThemedText style={[styles.contactText, { marginTop: 2 }]}>
                {log.text}
              </ThemedText>
            </View>
          ))}
          {opportunity.logs.length > 3 && (
            <ThemedText style={[styles.contactText, { marginTop: 4, marginLeft: 18, fontStyle: 'italic' }]}>
              +{opportunity.logs.length - 3} daha fazla log...
            </ThemedText>
          )}
        </View>
      )}

      <View style={styles.opportunityFooter}>
        <View style={{ flex: 1, marginRight: spacing.small }}>
          {opportunity.channel && (
            <ThemedText style={styles.contactText}>
              Kanal: {opportunity.channel}
            </ThemedText>
          )}
        </View>
        
        <View style={[styles.statusBadge, statusInfo.badgeStyle]}>
          <Text style={[styles.statusText, statusInfo.textStyle]} numberOfLines={1}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

    </TouchableOpacity>
  );
}
