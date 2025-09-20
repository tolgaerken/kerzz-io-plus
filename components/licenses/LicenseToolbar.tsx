import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../modules/theme';
import { TLicense } from '../../types/license.types';
import { ThemedText } from '../themed-text';

interface LicenseToolbarProps {
  license: TLicense;
  onToggleBlock?: (license: TLicense) => void;
  onToggleActive?: (license: TLicense) => void;
  onViewDetails?: (license: TLicense) => void;
  isBlockToggleLoading?: boolean;
  isActiveToggleLoading?: boolean;
}

export const LicenseToolbar = React.memo(function LicenseToolbar({ 
  license, 
  onToggleBlock, 
  onToggleActive, 
  onViewDetails,
  isBlockToggleLoading, 
  isActiveToggleLoading 
}: LicenseToolbarProps) {
  const { colors, spacing } = useStyles();

  const styles = StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.small,
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.medium,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border + '40',
      borderRadius: 12,
      gap: spacing.medium,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      height: 110,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
    },
    toggleButtonActive: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    toggleButtonInactive: {
      backgroundColor: 'transparent',
      borderColor: colors.border + '60',
    },
    toggleButtonBlocked: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
    toggleButtonWarning: {
      backgroundColor: colors.warning,
      borderColor: colors.warning,
    },
    iconContainer: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonLabel: {
      fontSize: 10,
      marginTop: 4,
      textAlign: 'center',
    },
    buttonLabelActive: {
      color: colors.success,
      fontWeight: '600',
    },
    buttonLabelInactive: {
      color: colors.textLight,
      fontWeight: '400',
    },
    buttonLabelBlocked: {
      color: colors.error,
      fontWeight: '600',
    },
    buttonLabelWarning: {
      color: colors.warning,
      fontWeight: '600',
    },
  });

  // Block Icon Component
  const BlockIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
    <MaterialIcons name={license.block ? "block" : "check-circle"} size={size} color={color} />
  );

  // Active Icon Component  
  const ActiveIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
    <MaterialIcons name={license.active ? "power" : "power-off"} size={size} color={color} />
  );

  // Detail Icon Component  
  const DetailIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
    <MaterialIcons name="visibility" size={size} color={color} />
  );

  // Block button styling
  const getBlockButtonStyle = () => {
    if (license.block) {
      return styles.toggleButtonBlocked;
    }
    return styles.toggleButtonInactive;
  };

  const getBlockLabelStyle = () => {
    if (license.block) {
      return styles.buttonLabelBlocked;
    }
    return styles.buttonLabelInactive;
  };

  // Active button styling
  const getActiveButtonStyle = () => {
    if (license.active) {
      return styles.toggleButtonActive;
    }
    return styles.toggleButtonWarning;
  };

  const getActiveLabelStyle = () => {
    if (license.active) {
      return styles.buttonLabelActive;
    }
    return styles.buttonLabelWarning;
  };

  return (
    <View style={styles.toolbar}>
      {/* Block/Unblock Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            getBlockButtonStyle(),
          ]}
          onPress={() => onToggleBlock?.(license)}
          activeOpacity={0.7}
          disabled={isBlockToggleLoading || isActiveToggleLoading}
        >
          <View style={styles.iconContainer}>
            {isBlockToggleLoading ? (
              <ActivityIndicator 
                size="small" 
                color={license.block ? '#FFFFFF' : colors.primary} 
              />
            ) : (
              <BlockIcon 
                color={license.block ? '#FFFFFF' : colors.textLight} 
                size={20}
              />
            )}
          </View>
        </TouchableOpacity>
        <ThemedText style={[
          styles.buttonLabel,
          getBlockLabelStyle()
        ]}>
          {license.block ? 'Bloklu' : 'Bloksuz'}
        </ThemedText>
      </View>

      {/* Active/Inactive Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            getActiveButtonStyle(),
          ]}
          onPress={() => onToggleActive?.(license)}
          activeOpacity={0.7}
          disabled={isBlockToggleLoading || isActiveToggleLoading}
        >
          <View style={styles.iconContainer}>
            {isActiveToggleLoading ? (
              <ActivityIndicator 
                size="small" 
                color={license.active ? '#FFFFFF' : colors.primary} 
              />
            ) : (
              <ActiveIcon 
                color={license.active ? '#FFFFFF' : colors.textLight} 
                size={20}
              />
            )}
          </View>
        </TouchableOpacity>
        <ThemedText style={[
          styles.buttonLabel,
          getActiveLabelStyle()
        ]}>
          {license.active ? 'Aktif' : 'Pasif'}
        </ThemedText>
      </View>

      {/* View Details Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonInactive,
            { borderColor: colors.primary + '60' }
          ]}
          onPress={() => onViewDetails?.(license)}
          activeOpacity={0.7}
          disabled={isBlockToggleLoading || isActiveToggleLoading}
        >
          <View style={styles.iconContainer}>
            <DetailIcon 
              color={colors.primary} 
              size={20}
            />
          </View>
        </TouchableOpacity>
        <ThemedText style={[
          styles.buttonLabel,
          { color: colors.primary, fontWeight: '600' }
        ]}>
          Detay
        </ThemedText>
      </View>
    </View>
  );
});
