import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

interface SalesFilterProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const MONTHS = [
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

// Son 5 yılı oluştur
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 4; i--) {
    years.push({ value: i, label: i.toString() });
  }
  return years;
};

export function SalesFilter({ 
  selectedYear, 
  selectedMonth, 
  onYearChange, 
  onMonthChange 
}: SalesFilterProps) {
  const [showYearModal, setShowYearModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  
  const { colors, spacing, fontSize } = useStyles();

  const years = generateYears();
  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || 'Seçiniz';

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: spacing.medium,
      gap: spacing.medium,
      backgroundColor: colors.background,
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
      fontSize: fontSize.medium,
      fontWeight: '500',
      color: colors.text,
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
  });

  const renderYearItem = ({ item }: { item: { value: number; label: string } }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedYear === item.value && styles.selectedOption,
      ]}
      onPress={() => {
        onYearChange(item.value);
        setShowYearModal(false);
      }}
    >
      <Text
        style={[
          styles.optionText,
          selectedYear === item.value && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderMonthItem = ({ item }: { item: { value: number; label: string } }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedMonth === item.value && styles.selectedOption,
      ]}
      onPress={() => {
        onMonthChange(item.value);
        setShowMonthModal(false);
      }}
    >
      <Text
        style={[
          styles.optionText,
          selectedMonth === item.value && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Yıl Seçici */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowYearModal(true)}
      >
        <ThemedText style={styles.filterButtonText}>
          {selectedYear}
        </ThemedText>
      </TouchableOpacity>

      {/* Ay Seçici */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowMonthModal(true)}
      >
        <ThemedText style={styles.filterButtonText}>
          {selectedMonthLabel}
        </ThemedText>
      </TouchableOpacity>

      {/* Yıl Seçim Modal */}
      <Modal
        visible={showYearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yıl Seçiniz</Text>
            <FlatList
              data={years}
              renderItem={renderYearItem}
              keyExtractor={(item) => item.value.toString()}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowYearModal(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ay Seçim Modal */}
      <Modal
        visible={showMonthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ay Seçiniz</Text>
            <FlatList
              data={MONTHS}
              renderItem={renderMonthItem}
              keyExtractor={(item) => item.value.toString()}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMonthModal(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
