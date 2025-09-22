import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { OpportunityScreen } from '../../components/opportunities';

export default function OpportunitiesPage() {
  const params = useLocalSearchParams();
  const searchQuery = params.searchQuery as string;
  
  console.log('📱 OpportunitiesPage params:', {
    allParams: params,
    searchQuery,
    type: typeof searchQuery
  });
  
  return <OpportunityScreen initialSearchQuery={searchQuery} />;
}
