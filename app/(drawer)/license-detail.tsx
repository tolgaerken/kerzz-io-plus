import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useLicenseQuery } from '../../modules/data-layer/hooks/useLicenseQuery';
import { useStyles } from '../../modules/theme';
import { TLicenseItem, TPerson } from '../../types/license.types';

export default function LicenseDetailScreen() {
  const { licenseId } = useLocalSearchParams();
  const { colors, spacing, fontSize } = useStyles();
  
  const licenseQuery = useLicenseQuery();
  const licenseDetailQuery = licenseQuery.useLicenseDetail(licenseId as string);

  const license = licenseDetailQuery.data;

  const handleBack = useCallback(() => {
    router.push('/(drawer)/licenses');
  }, []);

  const handleRefresh = useCallback(() => {
    licenseDetailQuery.refetch();
  }, [licenseDetailQuery]);

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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xlarge,
    },
    loadingText: {
      fontSize: fontSize.medium,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: spacing.medium,
    },
    statusBadge: {
      paddingHorizontal: spacing.small,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: spacing.small,
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
    personContainer: {
      backgroundColor: colors.background,
      padding: spacing.small,
      borderRadius: 8,
      marginBottom: spacing.small,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    personName: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    personRole: {
      fontSize: fontSize.small,
      color: colors.primary,
      fontWeight: '500',
      marginBottom: 2,
    },
    personContact: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
  });

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDateOnly = (date: Date | string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
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
        return 'Zincir Şirket';
      case 'single':
        return 'Tekil Şirket';
      default:
        return companyType;
    }
  };

  const getStatusInfo = () => {
    if (!license) return null;
    
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

  const renderLicenseItems = (items: TLicenseItem[], title: string) => {
    if (!items || items.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {items.map((item, index) => (
          <View key={item.id || index} style={styles.itemContainer}>
            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
            <View style={styles.itemDetails}>
              <ThemedText style={styles.itemQuantity}>
                Miktar: {item.qty} adet
              </ThemedText>
              <ThemedText style={styles.itemQuantity}>
                Modül ID: {item.moduleId}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPersons = (persons: TPerson[]) => {
    if (!persons || persons.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>İletişim Kişileri</ThemedText>
        {persons.map((person, index) => (
          <View key={person.id || index} style={styles.personContainer}>
            <ThemedText style={styles.personName}>{person.name}</ThemedText>
            <ThemedText style={styles.personRole}>{person.role}</ThemedText>
            {person.email && (
              <ThemedText style={styles.personContact}>Email: {person.email}</ThemedText>
            )}
            {person.gsm && (
              <ThemedText style={styles.personContact}>GSM: {person.gsm}</ThemedText>
            )}
          </View>
        ))}
      </View>
    );
  };

  if (licenseDetailQuery.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Lisans Detayı</ThemedText>
        </View>
        
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Lisans detayı yükleniyor...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (licenseDetailQuery.error || !license) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Lisans Detayı</ThemedText>
        </View>
        
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {licenseDetailQuery.error?.message || 'Lisans bilgisi bulunamadı'}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>
          Lisans #{license.no || license.licenseId}
        </ThemedText>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={licenseDetailQuery.isFetching && !licenseDetailQuery.isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.headerTitle}>
            Lisans #{license.no || license.licenseId}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {license.customerName}
          </ThemedText>
          {license.brandName && (
            <ThemedText style={styles.headerSubtitle}>
              Marka: {license.brandName}
            </ThemedText>
          )}
          <ThemedText style={[styles.headerSubtitle, { marginTop: spacing.small }]}>
            Oluşturulma: {formatDateOnly(license.creation)}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Tip: {getTypeDisplayName(license.type)}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Şirket Tipi: {getCompanyTypeDisplayName(license.companyType)}
          </ThemedText>
          
          {statusInfo && (
            <View style={[styles.statusBadge, statusInfo.badgeStyle]}>
              <ThemedText style={[styles.statusText, statusInfo.textStyle]}>
                {statusInfo.text}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Address Section */}
        {license.address && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Adres Bilgileri</ThemedText>
            <ThemedText style={styles.itemDescription}>
              {license.address.address}
            </ThemedText>
            <ThemedText style={styles.itemDescription}>
              {license.address.town} / {license.address.city}
            </ThemedText>
            <ThemedText style={styles.itemDescription}>
              {license.address.country}
            </ThemedText>
          </View>
        )}

        {/* Contact Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>İletişim Bilgileri</ThemedText>
          {license.phone && (
            <ThemedText style={styles.itemDescription}>
              Telefon: {license.phone}
            </ThemedText>
          )}
          {license.email && (
            <ThemedText style={styles.itemDescription}>
              Email: {license.email}
            </ThemedText>
          )}
          {license.person && (
            <ThemedText style={styles.itemDescription}>
              Sorumlu Kişi: {license.person}
            </ThemedText>
          )}
        </View>

        {/* Technical Info Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Teknik Bilgiler</ThemedText>
          {license.lastOnline && (
            <ThemedText style={styles.itemDescription}>
              Son Online: {formatDate(license.lastOnline)}
            </ThemedText>
          )}
          {license.lastIp && (
            <ThemedText style={styles.itemDescription}>
              Son IP: {license.lastIp}
            </ThemedText>
          )}
          {license.lastVersion && (
            <ThemedText style={styles.itemDescription}>
              Son Versiyon: {license.lastVersion}
            </ThemedText>
          )}
          {license.currentVersion && (
            <ThemedText style={styles.itemDescription}>
              Mevcut Versiyon: {license.currentVersion}
            </ThemedText>
          )}
          {license.assetCode && (
            <ThemedText style={styles.itemDescription}>
              Asset Kodu: {license.assetCode}
            </ThemedText>
          )}
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Özellikler</ThemedText>
          <ThemedText style={styles.itemDescription}>
            Renty: {license.hasRenty ? 'Var' : 'Yok'}
          </ThemedText>
          <ThemedText style={styles.itemDescription}>
            Lisans: {license.hasLicense ? 'Var' : 'Yok'}
          </ThemedText>
          <ThemedText style={styles.itemDescription}>
            Sözleşme: {license.haveContract ? 'Var' : 'Yok'}
          </ThemedText>
          <ThemedText style={styles.itemDescription}>
            Boss: {license.hasBoss ? 'Var' : 'Yok'}
          </ThemedText>
          {license.kitchenType && (
            <ThemedText style={styles.itemDescription}>
              Mutfak Tipi: {license.kitchenType}
            </ThemedText>
          )}
        </View>

        {/* Block Info Section */}
        {license.block && license.blockMessage && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Blok Bilgisi</ThemedText>
            <ThemedText style={[styles.itemDescription, { color: colors.error }]}>
              {license.blockMessage}
            </ThemedText>
          </View>
        )}

        {/* SAAS Items Section */}
        {renderLicenseItems(license.saasItems || [], 'SAAS Modülleri')}

        {/* License Items Section */}
        {renderLicenseItems(license.licenseItems || [], 'Lisans Modülleri')}

        {/* Persons Section */}
        {renderPersons(license.persons || [])}

        {/* Orwi Store Section */}
        {license.orwiStore && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Orwi Store Bilgileri</ThemedText>
            <ThemedText style={styles.itemDescription}>
              Store Adı: {license.orwiStore.name}
            </ThemedText>
            <ThemedText style={styles.itemDescription}>
              Cloud ID: {license.orwiStore.cloudId}
            </ThemedText>
          </View>
        )}

        {/* Additional Info Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ek Bilgiler</ThemedText>
          {license.customerId && (
            <ThemedText style={styles.itemDescription}>
              Müşteri ID: {license.customerId}
            </ThemedText>
          )}
          {license.chainId && (
            <ThemedText style={styles.itemDescription}>
              Zincir ID: {license.chainId}
            </ThemedText>
          )}
          {license.resellerId && (
            <ThemedText style={styles.itemDescription}>
              Bayi ID: {license.resellerId}
            </ThemedText>
          )}
          <ThemedText style={styles.itemDescription}>
            Açık: {license.isOpen ? 'Evet' : 'Hayır'}
          </ThemedText>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: spacing.large }} />
      </ScrollView>
    </ThemedView>
  );
}
