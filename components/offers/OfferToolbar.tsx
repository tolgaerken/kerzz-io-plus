import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { TOffer } from '../../types/offer.types';

interface OfferToolbarProps {
  offer: TOffer;
  onViewDetails?: (offer: TOffer) => void;
}

export function OfferToolbar({ 
  offer, 
  onViewDetails,
}: OfferToolbarProps) {
  const { colors, spacing } = useStyles();

  const styles = StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: spacing.medium,
      marginTop: spacing.small,
      marginBottom: spacing.small / 2,
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.medium,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border + '40',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.large,
      paddingVertical: spacing.small,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.primary + '60',
      backgroundColor: 'transparent',
    },
    iconContainer: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.small,
    },
    buttonLabel: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.toolbar}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => onViewDetails?.(offer)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="visibility" size={20} color={colors.primary} />
        </View>
        <Text style={styles.buttonLabel}>Detayları Görüntüle</Text>
      </TouchableOpacity>
    </View>
  );
}

