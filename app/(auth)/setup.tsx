import { useAuthStore } from '@modules/auth';
import { useTheme } from '@modules/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface TableGroup {
  name: string;
  tableCount: string;
}

const SetupWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    tableGroups: [{ name: '', tableCount: '' }] as TableGroup[]
  });

  const { setFirstLogin } = useAuthStore();
  const { theme } = useTheme();

  const handleNext = () => {
    if (step === 1) {
      if (!restaurantData.name.trim()) {
        Alert.alert('Hata', 'Lütfen restoran adını giriniz');
        return;
      }
      setStep(2);
    }
  };

  const addTableGroup = () => {
    setRestaurantData(prev => ({
      ...prev,
      tableGroups: [...prev.tableGroups, { name: '', tableCount: '' }]
    }));
  };

  const updateTableGroup = (index: number, field: 'name' | 'tableCount', value: string) => {
    setRestaurantData(prev => ({
      ...prev,
      tableGroups: prev.tableGroups.map((group, i) => 
        i === index ? { ...group, [field]: value } : group
      )
    }));
  };

  const removeTableGroup = (index: number) => {
    if (restaurantData.tableGroups.length > 1) {
      setRestaurantData(prev => ({
        ...prev,
        tableGroups: prev.tableGroups.filter((_, i) => i !== index)
      }));
    }
  };

  const handleComplete = async () => {
    const validGroups = restaurantData.tableGroups.filter(g => g.name && g.tableCount);
    
    if (validGroups.length === 0) {
      Alert.alert('Hata', 'En az bir masa grubu oluşturmalısınız');
      return;
    }

    setLoading(true);
    try {
      // Mock setup completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFirstLogin(false);
      Alert.alert('Başarılı', 'Kurulum tamamlandı!', [
        {
          text: 'Tamam',
          onPress: () => router.replace('/')
        }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Kurulum sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <Text style={[styles.brandText, { color: theme.colors.text }]}>
              KERZZ REZERVASYON
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: theme.colors.textLight }]}>
              {step} / 2
            </Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              KURULUM SİHİRBAZI
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textLight }]}>
              {step === 1 ? 'İşletme bilgilerinizi giriniz' : 'Masa gruplarınızı oluşturun'}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
                İşletme Adı
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text
                  }
                ]}
                placeholder="Restoran adınızı yazınız"
                placeholderTextColor={theme.colors.textLight}
                value={restaurantData.name}
                onChangeText={(text) => setRestaurantData(prev => ({...prev, name: text}))}
              />
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>DEVAM</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
                Masa Grupları
              </Text>
              
              <ScrollView style={styles.tableGroupsContainer} nestedScrollEnabled>
                {restaurantData.tableGroups.map((group, index) => (
                  <View key={index} style={[styles.tableGroupCard, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.tableGroupHeader}>
                      <Text style={[styles.tableGroupTitle, { color: theme.colors.text }]}>
                        Grup {index + 1}
                      </Text>
                      {restaurantData.tableGroups.length > 1 && (
                        <TouchableOpacity
                          style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                          onPress={() => removeTableGroup(index)}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.card,
                          color: theme.colors.text
                        }
                      ]}
                      placeholder="Masa grubu adı yazınız"
                      placeholderTextColor={theme.colors.textLight}
                      value={group.name}
                      onChangeText={(text) => updateTableGroup(index, 'name', text)}
                    />
                    
                    <TextInput
                      style={[
                        styles.input, 
                        { 
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.card,
                          color: theme.colors.text
                        }
                      ]}
                      placeholder="Masa sayısı seçiniz"
                      placeholderTextColor={theme.colors.textLight}
                      value={group.tableCount}
                      onChangeText={(text) => updateTableGroup(index, 'tableCount', text)}
                      keyboardType="number-pad"
                    />
                  </View>
                ))}
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.colors.secondary }]}
                onPress={addTableGroup}
              >
                <Text style={[styles.addButtonText, { color: theme.colors.text }]}>
                  + Başka Grup Ekle
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  { backgroundColor: theme.colors.success },
                  loading && styles.buttonDisabled
                ]}
                onPress={handleComplete}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'OLUŞTURULUYOR...' : 'KURULUMU TAMAMLA'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tableGroupsContainer: {
    maxHeight: 400,
  },
  tableGroupCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  tableGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SetupWizard;