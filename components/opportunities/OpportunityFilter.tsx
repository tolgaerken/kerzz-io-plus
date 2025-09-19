import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { ThemedText } from '../themed-text';

interface OpportunityFilterProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export function OpportunityFilter({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}: OpportunityFilterProps) {
  const { colors, spacing, fontSize } = useStyles();
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
  const months = [
    { value: 1, label: 'Ocak' },
    { value: 2, label: 'Şubat' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' },
    { value: 5, label: 'Mayıs' },
    { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' },
    { value: 8, label: 'Ağustos' },
    { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' },
    { value: 11, label: 'Kasım' },
    { value: 12, label: 'Aralık' },
  ];

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border + '60',
      borderRadius: 8,
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      minWidth: 120,
      justifyContent: 'center',
    },
    filterButtonText: {
      fontSize: fontSize.medium,
      color: colors.text,
      marginRight: spacing.small,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.large,
      maxHeight: '70%',
      width: '80%',
      maxWidth: 300,
    },
    modalTitle: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.large,
    },
    optionButton: {
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.large,
      borderRadius: 8,
      marginVertical: 2,
    },
    selectedOption: {
      backgroundColor: colors.primary + '20',
    },
    optionText: {
      fontSize: fontSize.medium,
      color: colors.text,
      textAlign: 'center',
    },
    selectedOptionText: {
      color: colors.primary,
      fontWeight: '600',
    },
    closeButton: {
      marginTop: spacing.large,
      paddingVertical: spacing.medium,
      backgroundColor: colors.border + '30',
      borderRadius: 8,
    },
    closeButtonText: {
      fontSize: fontSize.medium,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '600',
    },
  });

  const handleYearSelect = (year: number) => {
    onYearChange(year);
    setShowYearPicker(false);
  };

  const handleMonthSelect = (month: number) => {
    onMonthChange(month);
    setShowMonthPicker(false);
  };

  const getSelectedMonthLabel = () => {
    const month = months.find(m => m.value === selectedMonth);
    return month?.label || 'Ay Seçin';
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {/* Year Picker */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowYearPicker(true)}
        >
          <ThemedText style={styles.filterButtonText}>
            {selectedYear}
          </ThemedText>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Month Picker */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowMonthPicker(true)}
        >
          <ThemedText style={styles.filterButtonText}>
            {getSelectedMonthLabel()}
          </ThemedText>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Yıl Seçin</ThemedText>
            <ScrollView showsVerticalScrollIndicator={false}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.optionButton,
                    selectedYear === year && styles.selectedOption,
                  ]}
                  onPress={() => handleYearSelect(year)}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      selectedYear === year && styles.selectedOptionText,
                    ]}
                  >
                    {year}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowYearPicker(false)}
            >
              <ThemedText style={styles.closeButtonText}>Kapat</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Ay Seçin</ThemedText>
            <ScrollView showsVerticalScrollIndicator={false}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={[
                    styles.optionButton,
                    selectedMonth === month.value && styles.selectedOption,
                  ]}
                  onPress={() => handleMonthSelect(month.value)}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      selectedMonth === month.value && styles.selectedOptionText,
                    ]}
                  >
                    {month.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMonthPicker(false)}
            >
              <ThemedText style={styles.closeButtonText}>Kapat</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
