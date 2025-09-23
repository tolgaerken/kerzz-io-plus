import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { BankTransactionFilters, DateRange, TBankAccount, TErpStatus } from '../../types/bank.types';

interface BankFiltersProps {
  filters: BankTransactionFilters;
  bankAccounts: TBankAccount[];
  onFiltersChange: (filters: BankTransactionFilters) => void;
  onRefresh?: () => void;
}

const statusOptions: { value: TErpStatus | '', label: string, color: string, icon: string }[] = [
  { value: '', label: 'Tümü', color: '#6c757d', icon: 'list' },
  { value: 'waiting', label: 'Bekliyor', color: '#ffc107', icon: 'schedule' },
  { value: 'success', label: 'İşlendi', color: '#28a745', icon: 'check-circle' },
  { value: 'error', label: 'Hatalı', color: '#dc3545', icon: 'error' },
  { value: 'manual', label: 'Manuel', color: '#17a2b8', icon: 'touch-app' },
];

const transactionTypeOptions = [
  { value: 'all', label: 'Tümü', color: '#6c757d', icon: 'swap-horiz' },
  { value: 'inflow', label: 'Girenler', color: '#28a745', icon: 'arrow-downward' },
  { value: 'outflow', label: 'Çıkanlar', color: '#dc3545', icon: 'arrow-upward' },
];

const quickDateRanges = [
  { key: 'today', label: 'Bugün', icon: 'today' },
  { key: 'yesterday', label: 'Dün', icon: 'yesterday' },
  { key: 'thisWeek', label: 'Bu Hafta', icon: 'date-range' },
  { key: 'lastWeek', label: 'Geçen Hafta', icon: 'date-range' },
  { key: 'thisMonth', label: 'Bu Ay', icon: 'calendar-month' },
  { key: 'lastMonth', label: 'Geçen Ay', icon: 'calendar-month' },
];

export const BankFilters: React.FC<BankFiltersProps> = ({
  filters,
  bankAccounts,
  onFiltersChange,
  onRefresh
}) => {
  const { colors, spacing, fontSize } = useStyles();
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const getDateRangeForQuickSelect = (key: string): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (key) {
      case 'today':
        return {
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday,
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { startDate: startOfWeek, endDate: endOfWeek };
      case 'lastWeek':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 6);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        return { startDate: lastWeekStart, endDate: lastWeekEnd };
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { startDate: startOfMonth, endDate: endOfMonth };
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        lastMonthEnd.setHours(23, 59, 59, 999);
        return { startDate: lastMonthStart, endDate: lastMonthEnd };
      default:
        return { startDate: null, endDate: null };
    }
  };

  const handleQuickDateSelect = (key: string) => {
    const dateRange = getDateRangeForQuickSelect(key);
    onFiltersChange({
      ...filters,
      dateRange
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate && showDatePicker) {
      const currentDateRange = filters.dateRange || { startDate: null, endDate: null };
      const newDateRange = {
        ...currentDateRange,
        [showDatePicker === 'start' ? 'startDate' : 'endDate']: selectedDate
      };
      
      onFiltersChange({
        ...filters,
        dateRange: newDateRange
      });
    }
    setShowDatePicker(null);
  };

  const clearFilters = () => {
    onFiltersChange({
      status: undefined,
      dateRange: { startDate: null, endDate: null },
      bankAccId: undefined,
      searchText: undefined,
      transactionType: 'all'
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Seç';
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) count++;
    if (filters.bankAccId) count++;
    if (filters.searchText) count++;
    if (filters.transactionType && filters.transactionType !== 'all') count++;
    return count;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    searchContainer: {
      marginBottom: spacing.medium,
    },
    searchInput: {
      backgroundColor: colors.input,
      borderRadius: 12,
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      fontSize: fontSize.medium,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    quickFiltersContainer: {
      marginBottom: spacing.medium,
    },
    sectionTitle: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.textLight,
      marginBottom: spacing.small,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    quickFiltersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.small,
    },
    quickFilterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardAlt,
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.tiny,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    quickFilterButtonActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    quickFilterText: {
      fontSize: fontSize.small,
      color: colors.text,
      marginLeft: spacing.tiny,
    },
    quickFilterTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    filtersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.medium,
    },
    filterChipsContainer: {
      flex: 1,
      marginRight: spacing.small,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.small,
      marginBottom: spacing.small,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardAlt,
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.tiny,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    filterChipActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: fontSize.small,
      color: colors.text,
      marginLeft: spacing.tiny,
    },
    filterChipTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.small,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      borderRadius: 8,
      minHeight: 40,
    },
    refreshButton: {
      backgroundColor: colors.success,
    },
    clearButton: {
      backgroundColor: colors.warning,
    },
    actionButtonText: {
      color: colors.card,
      fontSize: fontSize.small,
      fontWeight: '600',
      marginLeft: spacing.tiny,
    },
    badge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: colors.card,
      fontSize: 12,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.large,
      maxHeight: '80%',
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.medium,
    },
    modalTitle: {
      fontSize: fontSize.large,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.large,
      textAlign: 'center',
    },
    filterSection: {
      marginBottom: spacing.large,
    },
    filterLabel: {
      fontSize: fontSize.medium,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.small,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
    },
    dateButton: {
      flex: 1,
      backgroundColor: colors.input,
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border + '30',
      alignItems: 'center',
    },
    dateButtonText: {
      fontSize: fontSize.small,
      color: colors.text,
    },
    bankAccountsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.small,
    },
    bankAccountChip: {
      backgroundColor: colors.cardAlt,
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.tiny,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    bankAccountChipActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    bankAccountChipText: {
      fontSize: fontSize.small,
      color: colors.text,
    },
    bankAccountChipTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.large,
      gap: spacing.medium,
    },
    modalButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: spacing.medium,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalClearButton: {
      backgroundColor: colors.cardAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalButtonText: {
      color: colors.card,
      fontSize: fontSize.medium,
      fontWeight: '600',
    },
    modalClearButtonText: {
      color: colors.text,
      fontSize: fontSize.medium,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="İsim, açıklama veya banka ara..."
          placeholderTextColor={colors.textLight}
          value={filters.searchText || ''}
          onChangeText={(text) => onFiltersChange({ ...filters, searchText: text })}
        />
      </View>

      {/* Quick Date Filters */}
      <View style={styles.quickFiltersContainer}>
        <Text style={styles.sectionTitle}>Hızlı Tarih Seçimi</Text>
        <View style={styles.quickFiltersRow}>
          {quickDateRanges.map((range) => {
            const isActive = false; // Bu kısım geliştirilebilir
            return (
              <TouchableOpacity
                key={range.key}
                style={[
                  styles.quickFilterButton,
                  isActive && styles.quickFilterButtonActive
                ]}
                onPress={() => handleQuickDateSelect(range.key)}
              >
                <MaterialIcons 
                  name={range.icon as any} 
                  size={16} 
                  color={isActive ? colors.primary : colors.textLight} 
                />
                <Text style={[
                  styles.quickFilterText,
                  isActive && styles.quickFilterTextActive
                ]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipsContainer}>
        {/* Transaction Type Filter */}
        <Text style={styles.sectionTitle}>İşlem Türü</Text>
        <View style={styles.chipRow}>
          {transactionTypeOptions.map((option) => {
            const isActive = (filters.transactionType || 'all') === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive
                ]}
                onPress={() => onFiltersChange({ 
                  ...filters, 
                  transactionType: option.value as any
                })}
              >
                <MaterialIcons 
                  name={option.icon as any} 
                  size={16} 
                  color={isActive ? colors.primary : option.color} 
                />
                <Text style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Status Filter */}
        <Text style={styles.sectionTitle}>Durum</Text>
        <View style={styles.chipRow}>
          {statusOptions.map((option) => {
            const isActive = (filters.status || '') === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive
                ]}
                onPress={() => onFiltersChange({ 
                  ...filters, 
                  status: option.value === '' ? undefined : option.value as TErpStatus
                })}
              >
                <MaterialIcons 
                  name={option.icon as any} 
                  size={16} 
                  color={isActive ? colors.primary : option.color} 
                />
                <Text style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.filtersRow}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={clearFilters}
          >
            <MaterialIcons name="clear-all" size={20} color={colors.card} />
            <Text style={styles.actionButtonText}>Temizle</Text>
          </TouchableOpacity>

          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowFiltersModal(true)}
            >
              <MaterialIcons name="tune" size={20} color={colors.card} />
              <Text style={styles.actionButtonText}>Gelişmiş</Text>
            </TouchableOpacity>
            {getActiveFiltersCount() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </View>

          {onRefresh && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.refreshButton]} 
              onPress={onRefresh}
            >
              <MaterialIcons name="refresh" size={20} color={colors.card} />
              <Text style={styles.actionButtonText}>Yenile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Advanced Filters Modal */}
      <Modal
        visible={showFiltersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Gelişmiş Filtreler</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Tarih Aralığı</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('start')}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(filters.dateRange?.startDate || null)}
                    </Text>
                  </TouchableOpacity>
                  <MaterialIcons name="arrow-forward" size={20} color={colors.textLight} />
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker('end')}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(filters.dateRange?.endDate || null)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bank Account Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Banka Hesabı</Text>
                <View style={styles.bankAccountsGrid}>
                  <TouchableOpacity
                    style={[
                      styles.bankAccountChip,
                      !filters.bankAccId && styles.bankAccountChipActive
                    ]}
                    onPress={() => onFiltersChange({ ...filters, bankAccId: undefined })}
                  >
                    <Text style={[
                      styles.bankAccountChipText,
                      !filters.bankAccId && styles.bankAccountChipTextActive
                    ]}>
                      Tüm Bankalar
                    </Text>
                  </TouchableOpacity>
                  {bankAccounts.map((account) => {
                    const isActive = filters.bankAccId === account.bankAccId;
                    return (
                      <TouchableOpacity
                        key={account.bankAccId}
                        style={[
                          styles.bankAccountChip,
                          isActive && styles.bankAccountChipActive
                        ]}
                        onPress={() => onFiltersChange({ 
                          ...filters, 
                          bankAccId: isActive ? undefined : account.bankAccId 
                        })}
                      >
                        <Text style={[
                          styles.bankAccountChipText,
                          isActive && styles.bankAccountChipTextActive
                        ]}>
                          {account.bankAccName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalClearButton]} 
                onPress={clearFilters}
              >
                <Text style={styles.modalClearButtonText}>Temizle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowFiltersModal(false)}
              >
                <Text style={styles.modalButtonText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={
            showDatePicker === 'start' 
              ? filters.dateRange?.startDate || new Date()
              : filters.dateRange?.endDate || new Date()
          }
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

export default BankFilters;