import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';
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
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'text');

  const years = generateYears();
  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || 'Seçiniz';

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
      backgroundColor,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor,
      backgroundColor,
      alignItems: 'center',
    },
    filterButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: textColor,
    },
    modal: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxHeight: '60%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: textColor,
    },
    optionItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginVertical: 2,
    },
    selectedOption: {
      backgroundColor: tintColor + '20',
    },
    optionText: {
      fontSize: 16,
      textAlign: 'center',
      color: textColor,
    },
    selectedOptionText: {
      color: tintColor,
      fontWeight: '600',
    },
    closeButton: {
      marginTop: 16,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: tintColor,
      borderRadius: 8,
      alignSelf: 'center',
    },
    closeButtonText: {
      color: 'white',
      fontSize: 16,
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
