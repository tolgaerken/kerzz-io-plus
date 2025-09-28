import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import NotificationService from '../../modules/notifications/services/notificationService';
import { quickSimulatorTest, testIOSSimulatorPushNotifications, testLocalNotificationOnly } from '../../modules/notifications/utils/simulatorTestHelper';

interface NotificationDebugData {
  id: string;
  timestamp: string;
  type: 'foreground' | 'background' | 'initial';
  platform: string;
  rawData: any;
  parsedData?: any;
  module?: string;
  fullDocument?: any;
  notification?: {
    title?: string;
    body?: string;
  };
  data?: any;
  from?: string;
  messageId?: string;
  sentTime?: number;
  ttl?: number;
}

const NotificationDebugger: React.FC = () => {
  const [debugData, setDebugData] = useState<NotificationDebugData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Debug verilerini yükle
  const loadDebugData = async () => {
    try {
      setIsLoading(true);
      const storedData = await AsyncStorage.getItem('notification_debug_data');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setDebugData(parsed.reverse()); // En yeni önce
      }
    } catch (error) {
      console.error('❌ Debug data yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Component mount olduğunda verileri yükle
  useEffect(() => {
    loadDebugData();
    
    // Her 2 saniyede bir yenile (real-time effect için)
    const interval = setInterval(loadDebugData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Tüm debug verilerini temizle
  const clearDebugData = () => {
    Alert.alert(
      'Debug Verilerini Temizle',
      'Tüm notification debug verileri silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('notification_debug_data');
              setDebugData([]);
              Alert.alert('Başarılı', 'Debug verileri temizlendi');
            } catch (error) {
              console.error('❌ Debug verileri temizlenemedi:', error);
              Alert.alert('Hata', 'Debug verileri temizlenemedi');
            }
          }
        }
      ]
    );
  };

  // Test notification gönder
  const sendTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'Hangi tür test notification göndermek istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sale (Foreground)',
          onPress: () => NotificationService.getInstance().testNotificationHandler('12345', true, 'complex-json')
        },
        {
          text: 'Sale (Background)',
          onPress: () => NotificationService.getInstance().testNotificationHandler('12345', false, 'complex-json')
        },
        {
          text: 'Opportunity',
          onPress: () => NotificationService.getInstance().testOpportunityNotificationHandler('67890', true, 'complex-json')
        },
        {
          text: 'Bank Transaction',
          onPress: () => NotificationService.getInstance().testBankTransactionNotificationHandler('tx-12345', true, 'complex-json')
        }
      ]
    );
  };

  // iOS Simulator test çalıştır
  const runSimulatorTest = () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Uyarı', 'Bu test sadece iOS için tasarlanmıştır.');
      return;
    }

    Alert.alert(
      'iOS Simulator Test',
      'Hangi test türünü çalıştırmak istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Hızlı Test',
          onPress: async () => {
            try {
              await quickSimulatorTest();
              Alert.alert('Başarılı', 'Hızlı test tamamlandı. Console\'ı kontrol edin.');
            } catch (error) {
              Alert.alert('Hata', 'Test sırasında hata oluştu: ' + error);
            }
          }
        },
        {
          text: 'Kapsamlı Test',
          onPress: async () => {
            try {
              await testIOSSimulatorPushNotifications();
              Alert.alert('Başarılı', 'Kapsamlı test tamamlandı. Console\'ı kontrol edin.');
            } catch (error) {
              Alert.alert('Hata', 'Test sırasında hata oluştu: ' + error);
            }
          }
        },
        {
          text: 'Sadece Local',
          onPress: async () => {
            try {
              await testLocalNotificationOnly();
              Alert.alert('Başarılı', 'Local notification test tamamlandı.');
            } catch (error) {
              Alert.alert('Hata', 'Test sırasında hata oluştu: ' + error);
            }
          }
        }
      ]
    );
  };

  // Item'ı genişlet/daralt
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // JSON'u güzel formatta göster
  const formatJson = (obj: any, maxDepth: number = 3, currentDepth: number = 0): string => {
    if (currentDepth > maxDepth) {
      return '[Max depth reached]';
    }
    
    try {
      if (obj === null || obj === undefined) {
        return String(obj);
      }
      
      if (typeof obj === 'string') {
        return `"${obj}"`;
      }
      
      if (typeof obj === 'number' || typeof obj === 'boolean') {
        return String(obj);
      }
      
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        const items = obj.slice(0, 5).map(item => formatJson(item, maxDepth, currentDepth + 1));
        const result = `[\n${items.map(item => '  ' + item).join(',\n')}\n]`;
        return obj.length > 5 ? result + `\n... (${obj.length - 5} more items)` : result;
      }
      
      if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        
        const items = keys.slice(0, 10).map(key => {
          const value = formatJson(obj[key], maxDepth, currentDepth + 1);
          return `  "${key}": ${value}`;
        });
        
        const result = `{\n${items.join(',\n')}\n}`;
        return keys.length > 10 ? result + `\n... (${keys.length - 10} more keys)` : result;
      }
      
      return String(obj);
    } catch (error) {
      return `[Format Error: ${error}]`;
    }
  };

  // Notification item render et
  const renderNotificationItem = (item: NotificationDebugData) => {
    const isExpanded = expandedItems.has(item.id);
    const typeColor = item.type === 'foreground' ? '#4CAF50' : item.type === 'background' ? '#FF9800' : '#2196F3';
    
    return (
      <View key={item.id} style={styles.notificationItem}>
        {/* Header */}
        <TouchableOpacity 
          style={styles.notificationHeader}
          onPress={() => toggleExpanded(item.id)}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
            <View style={styles.headerInfo}>
              <Text style={styles.timestampText}>
                {new Date(item.timestamp).toLocaleString('tr-TR')}
              </Text>
              <Text style={styles.typeText}>
                {item.type.toUpperCase()} • {item.platform.toUpperCase()}
                {item.module && ` • ${item.module}`}
              </Text>
              {item.notification?.title && (
                <Text style={styles.titleText} numberOfLines={1}>
                  {item.notification.title}
                </Text>
              )}
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Notification Info */}
            {item.notification && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📱 Notification</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {formatJson(item.notification)}
                  </Text>
                </View>
              </View>
            )}

            {/* Data Info */}
            {item.data && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📦 Data</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {formatJson(item.data)}
                  </Text>
                </View>
              </View>
            )}

            {/* Parsed Data */}
            {item.parsedData && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔍 Parsed Data</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {formatJson(item.parsedData)}
                  </Text>
                </View>
              </View>
            )}

            {/* Full Document */}
            {item.fullDocument && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📄 Full Document</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {formatJson(item.fullDocument)}
                  </Text>
                </View>
              </View>
            )}

            {/* Raw Data */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔧 Raw Data (Complete)</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {formatJson(item.rawData, 4)}
                </Text>
              </View>
            </View>

            {/* Meta Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ℹ️ Meta Info</Text>
              <View style={styles.metaInfo}>
                {item.from && <Text style={styles.metaText}>From: {item.from}</Text>}
                {item.messageId && <Text style={styles.metaText}>Message ID: {item.messageId}</Text>}
                {item.sentTime && <Text style={styles.metaText}>Sent Time: {new Date(item.sentTime).toLocaleString('tr-TR')}</Text>}
                {item.ttl && <Text style={styles.metaText}>TTL: {item.ttl}s</Text>}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Debugger</Text>
        <View style={styles.headerButtons}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.simulatorButton} onPress={runSimulatorTest}>
              <Ionicons name="phone-portrait" size={16} color="#fff" />
              <Text style={styles.buttonTextSmall}>Simulator</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
            <Ionicons name="flask" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearDebugData}>
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.buttonText}>Temizle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          Toplam: {debugData.length} • 
          Foreground: {debugData.filter(d => d.type === 'foreground').length} • 
          Background: {debugData.filter(d => d.type === 'background').length} • 
          Initial: {debugData.filter(d => d.type === 'initial').length}
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadDebugData} />
        }
      >
        {debugData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Henüz notification verisi yok</Text>
            <Text style={styles.emptySubText}>
              Test butonuna basarak test notification gönderebilir veya gerçek notification bekleyebilirsiniz
            </Text>
          </View>
        ) : (
          debugData.map(renderNotificationItem)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  simulatorButton: {
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 2,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  clearButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextSmall: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stats: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  typeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  metaInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});

export default NotificationDebugger;
