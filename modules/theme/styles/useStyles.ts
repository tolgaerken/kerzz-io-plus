import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
    BorderRadiusType,
    ButtonStyleType,
    CardStyleType,
    CommonStyleType,
    FormStyleType,
    ShadowType,
    UseStylesReturn
} from '../types';

// Gölge stilleri
const createShadows = (): ShadowType => ({
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 9
  }
});

// Border radius değerleri
const createBorderRadius = (sizeFactor: number): BorderRadiusType => ({
  small: 4 * sizeFactor,
  medium: 8 * sizeFactor,
  large: 12 * sizeFactor,
  xlarge: 16 * sizeFactor,
  full: 9999
});

// Ortak stiller (React Native uyumlu)
const createCommonStyles = (theme: any): CommonStyleType => 
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background
    },
    rowContainer: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    columnContainer: {
      flexDirection: 'column'
    },
    flexCenter: {
      justifyContent: 'center',
      alignItems: 'center'
    },
    flexBetween: {
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    flexStart: {
      justifyContent: 'flex-start',
      alignItems: 'center'
    },
    flexEnd: {
      justifyContent: 'flex-end',
      alignItems: 'center'
    }
  });

// Buton stilleri (React Native uyumlu)
const createButtonStyles = (theme: any, spacing: any, borderRadius: BorderRadiusType): ButtonStyleType => 
  StyleSheet.create({
    primary: {
      backgroundColor: theme.colors.primary,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderRadius: borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44, // Touch target minimum
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderRadius: borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44,
    },
    success: {
      backgroundColor: theme.colors.success,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderRadius: borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44,
    },
    warning: {
      backgroundColor: theme.colors.warning,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderRadius: borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44,
    },
    error: {
      backgroundColor: theme.colors.error,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderRadius: borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44,
    },
    outline: {
      backgroundColor: 'transparent',
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderRadius: borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      minHeight: 44,
    },
    ghost: {
      backgroundColor: 'transparent',
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderRadius: borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44,
    },
    link: {
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.tiny,
      minHeight: 44,
    }
  });

// Kart stilleri (React Native uyumlu)
const createCardStyles = (theme: any, spacing: any, borderRadius: BorderRadiusType, shadows: ShadowType): CardStyleType => 
  StyleSheet.create({
    default: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.medium,
      padding: spacing.medium,
      marginVertical: spacing.small,
      ...shadows.light,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    elevated: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.medium,
      padding: spacing.medium,
      marginVertical: spacing.small,
      ...shadows.medium,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    accent: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.medium,
      padding: spacing.medium,
      marginVertical: spacing.small,
      ...shadows.light,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    bordered: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.medium,
      padding: spacing.medium,
      marginVertical: spacing.small,
      borderWidth: 2,
      borderColor: theme.colors.border
    },
    flat: {
      backgroundColor: theme.colors.cardAlt,
      borderRadius: borderRadius.medium,
      padding: spacing.medium,
      marginVertical: spacing.small,
    }
  });

// Form stilleri (React Native uyumlu)
const createFormStyles = (theme: any, spacing: any, borderRadius: BorderRadiusType): FormStyleType => 
  StyleSheet.create({
    input: {
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.small,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      fontSize: theme.fontSize.medium,
      minHeight: 44,
    },
    textarea: {
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.small,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      fontSize: theme.fontSize.medium,
      minHeight: 80,
      textAlignVertical: 'top', // React Native specific
    },
    select: {
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.small,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      fontSize: theme.fontSize.medium,
      minHeight: 44,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.small,
    },
    radio: {
      width: 18,
      height: 18,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 9, // Circular
    },
    label: {
      color: theme.colors.text,
      fontSize: theme.fontSize.medium,
      fontWeight: '500',
      marginBottom: spacing.tiny
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.fontSize.small,
      marginTop: spacing.tiny
    },
    helperText: {
      color: theme.colors.textLight,
      fontSize: theme.fontSize.small,
      marginTop: spacing.tiny
    }
  });

// Ana stil hook'u
export const useStyles = (): UseStylesReturn => {
  const { theme, deviceInfo, getResponsiveValue } = useTheme();

  const shadows = useMemo(() => createShadows(), []);
  const borderRadius = useMemo(() => createBorderRadius(theme.sizeFactor), [theme.sizeFactor]);

  const commonStyles = useMemo(() => createCommonStyles(theme), [theme]);
  const buttonStyles = useMemo(() => createButtonStyles(theme, theme.spacing, borderRadius), [theme, borderRadius]);
  const cardStyles = useMemo(() => createCardStyles(theme, theme.spacing, borderRadius, shadows), [theme, borderRadius, shadows]);
  const formStyles = useMemo(() => createFormStyles(theme, theme.spacing, borderRadius), [theme, borderRadius]);

  return {
    theme,
    colors: theme.colors,
    fontSize: theme.fontSize,
    headerSize: theme.headerSize,
    spacing: theme.spacing,
    shadows,
    borderRadius,
    deviceInfo,
    getResponsiveValue,
    // Stil bileşenleri
    common: commonStyles,
    button: buttonStyles,
    card: cardStyles,
    form: formStyles
  };
};

export default useStyles;