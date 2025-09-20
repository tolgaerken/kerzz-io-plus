import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { OpportunityScreen } from '../../components/opportunities';

export default function OpportunitiesPage() {
  const params = useLocalSearchParams();
  const searchQuery = params.searchQuery as string;
  return <OpportunityScreen initialSearchQuery={searchQuery} />;
}
