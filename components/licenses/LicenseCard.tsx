import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useCustomerQuery } from '../../modules/data-layer';
import { useStyles } from '../../modules/theme';
import { TLicense } from '../../types/license.types';
import { ThemedText } from '../themed-text';
import { LicenseToolbar } from './LicenseToolbar';


interface LicenseCardProps {
  license: TLicense;
  onPress?: (license: TLicense) => void;
  onToggleBlock?: (license: TLicense) => void;
  onToggleActive?: (license: TLicense) => void;
  onViewDetails?: (license: TLicense) => void;
  isBlockToggleLoading?: boolean;
  isActiveToggleLoading?: boolean;
}

export const LicenseCard = React.memo(function LicenseCard({ 
  license, 
  onPress,
  onToggleBlock,
  onToggleActive,
  onViewDetails,
  isBlockToggleLoading,
  isActiveToggleLoading,
}: LicenseCardProps) {
  const { colors, spacing, fontSize } = useStyles();

  const { useCustomerDetail } = useCustomerQuery();
  const { data: customer } = useCustomerDetail(license.customerId);
  const displayCustomerName = customer?.name || license.customerName || 'Firma adı yok';
  const displayBrandName = license.brandName || customer?.brand || 'Tabela adı belirtilmemiş';

  const styles = StyleSheet.create({
    licenseCard: {
      backgroundColor: colors.card,
      marginHorizontal: spacing.medium,
      marginTop: spacing.small,
      marginBottom: spacing.small,
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
      minHeight: 200,
      // Sabit yükseklik kaldırıldı; dış kapsayıcı sabit, kart içerik kadar uzar
    },
    licenseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.small,
    },
    licenseHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
    },
    licenseNumber: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.primary,
    },
    licenseDate: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    customerName: {
      fontSize: fontSize.medium,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    brandName: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    addressInfo: {
      fontSize: fontSize.small,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 3,
    },
    contactInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      marginBottom: 4,
    },
    contactText: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    licenseFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.small,
      paddingTop: spacing.small,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    typeChip: {
      paddingHorizontal: spacing.small,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.primary + '20',
    },
    typeText: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.primary,
    },
    statusBadge: {
      paddingHorizontal: spacing.small,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: fontSize.small,
      fontWeight: '600',
    },
    activeBadge: {
      backgroundColor: colors.success + '20',
    },
    activeText: {
      color: colors.success,
    },
    blockedBadge: {
      backgroundColor: colors.error + '20',
    },
    blockedText: {
      color: colors.error,
    },
    inactiveBadge: {
      backgroundColor: colors.warning + '20',
    },
    inactiveText: {
      color: colors.warning,
    },
    companyTypeChip: {
      backgroundColor: colors.secondary + '15',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.secondary + '30',
    },
    companyTypeText: {
      fontSize: 8,
      fontWeight: '600',
      color: colors.secondary,
    },
    lastOnlineText: {
      fontSize: fontSize.small,
      color: colors.textLight,
      fontStyle: 'italic',
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    metaItem: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
  });

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatLastOnline = (date: Date | string) => {
    const lastOnline = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastOnline.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Az önce online';
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return `${diffInDays} gün önce`;
      } else {
        return formatDate(date);
      }
    }
  };

  const getStatusInfo = (license: TLicense) => {
    if (license.block) {
      return {
        text: 'Bloklu',
        badgeStyle: styles.blockedBadge,
        textStyle: styles.blockedText,
      };
    } else if (license.active) {
      return {
        text: 'Aktif',
        badgeStyle: styles.activeBadge,
        textStyle: styles.activeText,
      };
    } else {
      return {
        text: 'Pasif',
        badgeStyle: styles.inactiveBadge,
        textStyle: styles.inactiveText,
      };
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'kerzz-pos':
        return 'Kerzz POS';
      case 'orwi-pos':
        return 'Orwi POS';
      case 'kerzz-cloud':
        return 'Kerzz Cloud';
      default:
        return type;
    }
  };

  const getCompanyTypeDisplayName = (companyType: string) => {
    switch (companyType) {
      case 'chain':
        return 'Zincir';
      case 'single':
        return 'Tekil';
      default:
        return companyType;
    }
  };

  const statusInfo = getStatusInfo(license);

  return (
    <TouchableOpacity
      style={styles.licenseCard}
      onPress={() => onPress?.(license)}
      activeOpacity={0.7}
    >
      <View style={styles.licenseHeader}>
        <View style={styles.licenseHeaderLeft}>
          <ThemedText style={styles.licenseNumber}>
            #{license.no || license.licenseId || 'N/A'}
          </ThemedText>
          {license.companyType && (
            <View style={styles.companyTypeChip}>
              <ThemedText style={styles.companyTypeText}>
                {getCompanyTypeDisplayName(license.companyType)}
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.licenseDate}>
          {license.creation ? formatDate(license.creation) : 'Tarih yok'}
        </ThemedText>
      </View>

      <ThemedText style={styles.customerName} numberOfLines={1} ellipsizeMode="tail">
        {displayCustomerName}
      </ThemedText>

      <ThemedText style={styles.brandName} numberOfLines={1} ellipsizeMode="tail">
        {displayBrandName}
      </ThemedText>

      <ThemedText style={styles.addressInfo} numberOfLines={1} ellipsizeMode="tail">
        {license.address?.city && license.address?.town 
          ? `${license.address.city} / ${license.address.town}` 
          : 'Adres bilgisi yok'}
      </ThemedText>

      {(license.phone || license.email) && (
        <View style={styles.contactInfo}>
          <ThemedText style={styles.contactText} numberOfLines={1} ellipsizeMode="tail">
            {license.phone && `${license.phone}`}
            {license.phone && license.email && ' • '}
            {license.email && `${license.email}`}
          </ThemedText>
        </View>
      )}

      <View style={styles.licenseFooter}>
        <View style={styles.typeChip}>
          <ThemedText style={styles.typeText}>
            {license.type ? getTypeDisplayName(license.type) : 'Tip yok'}
          </ThemedText>
        </View>
        
        <View style={[styles.statusBadge, statusInfo.badgeStyle]}>
          <ThemedText style={[styles.statusText, statusInfo.textStyle]}>
            {statusInfo.text}
          </ThemedText>
        </View>
      </View>

      {/* Meta bilgiler: Son Online / Versiyon */}
      <View style={styles.metaRow}>
        <ThemedText style={styles.metaItem} numberOfLines={1} ellipsizeMode="tail">
          {license.lastOnline ? `Son online: ${formatLastOnline(license.lastOnline)}` : 'Son online: -'}
        </ThemedText>
        <ThemedText style={styles.metaItem} numberOfLines={1} ellipsizeMode="tail">
          {license.lastVersion ? `Sürüm: ${license.lastVersion}` : 'Sürüm: -'}
        </ThemedText>
      </View>

      {/* Toolbar */}
      <LicenseToolbar
        license={license}
        onToggleBlock={onToggleBlock}
        onToggleActive={onToggleActive}
        onViewDetails={onViewDetails}
        isBlockToggleLoading={isBlockToggleLoading}
        isActiveToggleLoading={isActiveToggleLoading}
      />

    </TouchableOpacity>
  );
});
