import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { OUR_COMPANIES } from '@/constants/companies';
import { useNetsisCariBorcYas } from '@/modules/data-layer/hooks/useNetsisQuery';
import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

/**
 * Tek bir firma için borç yaşlandırma bilgisini gösteren component
 */
function CompanyBalanceCard({ company, year }: { company: typeof OUR_COMPANIES[number]; year: number }) {
  const { data, isLoading, error } = useNetsisCariBorcYas(year, company.id, {
    enabled: !!company.cloudDb,
  });

  // Veri geldiğinde console'a yazdır
  useEffect(() => {
    if (data && data.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log(`📊 ${company.name} (${company.id})`);
      console.log('-'.repeat(80));
      console.log(`Toplam Kayıt: ${data.length}`);
      console.log('\nVeri Önizlemesi:');
      console.log(JSON.stringify(data.slice(0, 3), null, 2));
      
      // Eğer BAKIYE field'ı varsa toplam hesapla
      if (data[0] && 'BAKIYE' in data[0]) {
        const totalBalance = data.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item.BAKIYE) || 0);
        }, 0);
        console.log(`\n💰 Toplam Bakiye: ${totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`);
      }
      
      console.log('='.repeat(80));
    }
  }, [data, company]);

  if (!company.cloudDb) {
    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.companyName}>{company.name}</ThemedText>
        <ThemedText style={styles.warning}>⚠️ CloudDB bilgisi yok</ThemedText>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.companyName}>{company.name}</ThemedText>
        <ActivityIndicator size="small" />
        <ThemedText style={styles.info}>Yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.companyName}>{company.name}</ThemedText>
        <ThemedText style={styles.error}>❌ Hata: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ThemedView style={styles.card}>
        <ThemedText style={styles.companyName}>{company.name}</ThemedText>
        <ThemedText style={styles.warning}>⚠️ Veri bulunamadı</ThemedText>
      </ThemedView>
    );
  }

  // Toplam bakiye hesapla (eğer BAKIYE field'ı varsa)
  let totalBalance = 0;
  if (data[0] && 'BAKIYE' in data[0]) {
    totalBalance = data.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.BAKIYE) || 0);
    }, 0);
  }

  return (
    <ThemedView style={styles.card}>
      <ThemedText style={styles.companyName}>{company.name}</ThemedText>
      <ThemedText style={styles.companyId}>ID: {company.id} • CloudDB: {company.cloudDb}</ThemedText>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>Toplam Kayıt</ThemedText>
          <ThemedText style={styles.statValue}>{data.length}</ThemedText>
        </View>
        
        {totalBalance !== 0 && (
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Toplam Bakiye</ThemedText>
            <ThemedText style={styles.statValue}>
              {totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </ThemedText>
          </View>
        )}
      </View>

      <ThemedText style={styles.success}>✅ Veriler console&apos;da görüntülendi</ThemedText>
    </ThemedView>
  );
}

/**
 * Tüm firmaların borç yaşlandırma verilerini gösteren ana ekran
 */
export default function CariBorcYasTestScreen() {
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    console.log('\n\n' + '='.repeat(80));
    console.log('🚀 CARİ BORÇ YAŞLANDIRMA TESTİ BAŞLADI');
    console.log(`📅 Yıl: ${currentYear}`);
    console.log(`🏢 Toplam Firma Sayısı: ${OUR_COMPANIES.length}`);
    console.log('='.repeat(80) + '\n');
  }, [currentYear]);

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Cari Borç Yaşlandırma Testi</ThemedText>
        <ThemedText style={styles.subtitle}>
          Tüm firmalarınızın borç yaşlandırma verileri
        </ThemedText>
        <ThemedText style={styles.year}>Yıl: {currentYear}</ThemedText>
        <ThemedText style={styles.info}>
          💡 Veriler console&apos;da detaylı olarak görüntülenmektedir
        </ThemedText>
      </ThemedView>

      {OUR_COMPANIES.map((company) => (
        <CompanyBalanceCard key={company.id} company={company} year={currentYear} />
      ))}

      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          📊 Toplam {OUR_COMPANIES.length} firma listelendi
        </ThemedText>
        <ThemedText style={styles.footerText}>
          ℹ️ Detaylı verileri görmek için console/terminal çıktısını kontrol edin
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 4,
  },
  year: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    opacity: 0.8,
  },
  info: {
    fontSize: 12,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    color: '#1976d2',
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyId: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  success: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 8,
  },
  warning: {
    fontSize: 14,
    color: '#ff9800',
    marginTop: 8,
  },
  error: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
    marginVertical: 4,
    textAlign: 'center',
  },
});

