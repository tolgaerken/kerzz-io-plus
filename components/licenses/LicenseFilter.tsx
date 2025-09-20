import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { LicenseSearchParams } from '../../types/license.types';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

interface LicenseFilterProps {
  searchParams: LicenseSearchParams;
  onSearchParamsChange: (params: LicenseSearchParams) => void;
}

const LICENSE_TYPES = [
  { value: undefined, label: 'Tüm Tipler' },
  { value: 'kerzz-pos', label: 'Kerzz POS' },
  { value: 'orwi-pos', label: 'Orwi POS' },
  { value: 'kerzz-cloud', label: 'Kerzz Cloud' },
];

const COMPANY_TYPES = [
  { value: undefined, label: 'Tüm Şirketler' },
  { value: 'chain', label: 'Zincir' },
  { value: 'single', label: 'Tekil' },
];

const STATUS_FILTERS = [
  { value: undefined, label: 'Tüm Durumlar' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Pasif' },
  { value: 'blocked', label: 'Bloklu' },
];

export function LicenseFilter({ 
  searchParams, 
  onSearchParamsChange 
}: LicenseFilterProps) {
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCompanyTypeModal, setShowCompanyTypeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  const { colors, spacing, fontSize } = useStyles();

  const getTypeLabel = () => {
    const type = LICENSE_TYPES.find(t => t.value === searchParams.type);
    return type?.label || 'Tüm Tipler';
  };

  const getCompanyTypeLabel = () => {
    const companyType = COMPANY_TYPES.find(ct => ct.value === searchParams.companyType);
    return companyType?.label || 'Tüm Şirketler';
  };

  const getStatusLabel = () => {
    if (searchParams.block === true) return 'Bloklu';
    if (searchParams.active === true) return 'Aktif';
    if (searchParams.active === false) return 'Pasif';
    return 'Tüm Durumlar';
  };

  const styles = StyleSheet.create({
    container: {
      padding: spacing.medium,
      gap: spacing.small,
      backgroundColor: colors.background,
    },
    filterRow: {
      flexDirection: 'row',
      gap: spacing.medium,
    },
    filterButton: {
      flex: 1,
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.medium,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    filterButtonText: {
      fontSize: fontSize.small,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },
    modal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.large,
      width: '80%',
      maxHeight: '60%',
    },
    modalTitle: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      marginBottom: spacing.medium,
      textAlign: 'center',
      color: colors.text,
    },
    optionItem: {
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.medium,
      borderRadius: 8,
      marginVertical: 2,
    },
    selectedOption: {
      backgroundColor: colors.primary + '20',
    },
    optionText: {
      fontSize: fontSize.medium,
      textAlign: 'center',
      color: colors.text,
    },
    selectedOptionText: {
      color: colors.primary,
      fontWeight: '600',
    },
    closeButton: {
      marginTop: spacing.medium,
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.large,
      backgroundColor: colors.primary,
      borderRadius: 8,
      alignSelf: 'center',
    },
    closeButtonText: {
      color: 'white',
      fontSize: fontSize.medium,
      fontWeight: '600',
    },
    clearFiltersButton: {
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.error + '60',
      backgroundColor: 'transparent',
      alignItems: 'center',
      marginTop: spacing.small,
    },
    clearFiltersText: {
      fontSize: fontSize.small,
      color: colors.error,
      fontWeight: '500',
    },
  });

  const handleTypeChange = (type: string | undefined) => {
    onSearchParamsChange({
      ...searchParams,
      type: type as any,
    });
    setShowTypeModal(false);
  };

  const handleCompanyTypeChange = (companyType: string | undefined) => {
    onSearchParamsChange({
      ...searchParams,
      companyType: companyType as any,
    });
    setShowCompanyTypeModal(false);
  };

  const handleStatusChange = (status: string | undefined) => {
    let newParams = { ...searchParams };
    
    // Clear existing status filters
    delete newParams.active;
    delete newParams.block;
    
    // Set new status
    if (status === 'active') {
      newParams.active = true;
      newParams.block = false;
    } else if (status === 'inactive') {
      newParams.active = false;
      newParams.block = false;
    } else if (status === 'blocked') {
      newParams.block = true;
    }
    
    onSearchParamsChange(newParams);
    setShowStatusModal(false);
  };

  const clearAllFilters = () => {
    onSearchParamsChange({});
  };

  const hasActiveFilters = () => {
    return Object.keys(searchParams).length > 0;
  };

  const renderTypeItem = ({ item }: { item: { value: string | undefined; label: string } }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        searchParams.type === item.value && styles.selectedOption,
      ]}
      onPress={() => handleTypeChange(item.value)}
    >
      <Text
        style={[
          styles.optionText,
          searchParams.type === item.value && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderCompanyTypeItem = ({ item }: { item: { value: string | undefined; label: string } }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        searchParams.companyType === item.value && styles.selectedOption,
      ]}
      onPress={() => handleCompanyTypeChange(item.value)}
    >
      <Text
        style={[
          styles.optionText,
          searchParams.companyType === item.value && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderStatusItem = ({ item }: { item: { value: string | undefined; label: string } }) => {
    const isSelected = 
      (item.value === 'active' && searchParams.active === true && searchParams.block !== true) ||
      (item.value === 'inactive' && searchParams.active === false && searchParams.block !== true) ||
      (item.value === 'blocked' && searchParams.block === true) ||
      (item.value === undefined && !searchParams.active && !searchParams.block);

    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.selectedOption,
        ]}
        onPress={() => handleStatusChange(item.value)}
      >
        <Text
          style={[
            styles.optionText,
            isSelected && styles.selectedOptionText,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* İlk Satır: Tip ve Şirket Tipi */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowTypeModal(true)}
        >
          <ThemedText style={styles.filterButtonText}>
            {getTypeLabel()}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowCompanyTypeModal(true)}
        >
          <ThemedText style={styles.filterButtonText}>
            {getCompanyTypeLabel()}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* İkinci Satır: Durum */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowStatusModal(true)}
        >
          <ThemedText style={styles.filterButtonText}>
            {getStatusLabel()}
          </ThemedText>
        </TouchableOpacity>

        {/* Filtreleri Temizle Butonu */}
        {hasActiveFilters() && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearAllFilters}
          >
            <ThemedText style={styles.clearFiltersText}>
              Temizle
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Tip Seçim Modal */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lisans Tipi Seçiniz</Text>
            <FlatList
              data={LICENSE_TYPES}
              renderItem={renderTypeItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Şirket Tipi Seçim Modal */}
      <Modal
        visible={showCompanyTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompanyTypeModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Şirket Tipi Seçiniz</Text>
            <FlatList
              data={COMPANY_TYPES}
              renderItem={renderCompanyTypeItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCompanyTypeModal(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Durum Seçim Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Durum Seçiniz</Text>
            <FlatList
              data={STATUS_FILTERS}
              renderItem={renderStatusItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
