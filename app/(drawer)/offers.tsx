import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { OfferScreen } from '../../components/offers';

export default function OffersPage() {
  const params = useLocalSearchParams();
  const searchQuery = params.searchQuery as string;
  
  return <OfferScreen initialSearchQuery={searchQuery} />;
}

