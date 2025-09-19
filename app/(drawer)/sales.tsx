import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SalesScreen } from '../../components/sales';

export default function SalesPage() {
  const params = useLocalSearchParams();
  const searchQuery = params.searchQuery as string;
  
  return <SalesScreen initialSearchQuery={searchQuery} />;
}
