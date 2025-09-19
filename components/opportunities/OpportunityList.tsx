import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';
import { TOpportunity } from '../../types/dto';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { OpportunityCard } from './OpportunityCard';

interface OpportunityListProps {
  opportunities: TOpportunity[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onOpportunityPress?: (opportunity: TOpportunity) => void;
}

export function OpportunityList({ 
  opportunities, 
  loading = false, 
  refreshing = false, 
  onRefresh, 
  onOpportunityPress
}: OpportunityListProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor,
    },
    emptyText: {
      fontSize: 16,
      color: textColor + '80',
      textAlign: 'center',
      marginTop: 16,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
  });

  const renderOpportunityItem = ({ item }: { item: TOpportunity }) => {
    return (
      <OpportunityCard 
        opportunity={item} 
        onPress={onOpportunityPress}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyIcon}>🎯</ThemedText>
      <ThemedText style={styles.emptyText}>
        Seçilen dönemde fırsat bulunamadı
      </ThemedText>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={[styles.emptyText, { marginTop: 16 }]}>
          Fırsatlar yükleniyor...
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={opportunities}
        renderItem={renderOpportunityItem}
        keyExtractor={(item) => item.id || item.no?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={opportunities.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[tintColor]}
              tintColor={tintColor}
            />
          ) : undefined
        }
      />
    </ThemedView>
  );
}
