import { ThemeProvider, useResponsive, useStyles, useTheme } from '@modules/theme';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Test komponenti
const ThemeTestContent: React.FC = () => {
  const { theme, themeName, themeMode, setTheme, toggleMode } = useTheme();
  const styles = useStyles();
  const { deviceInfo } = useResponsive();

  return (
    <ScrollView style={styles.common.container}>
      <View style={{ padding: theme.spacing.medium }}>
        {/* Başlık */}
        <Text style={{
          fontSize: theme.headerSize.h1,
          color: theme.colors.text,
          fontWeight: 'bold',
          marginBottom: theme.spacing.medium,
          textAlign: 'center'
        }}>
          Theme Sistemi Test
        </Text>

        {/* Cihaz Bilgileri */}
        <View style={styles.card.default}>
          <Text style={{
            fontSize: theme.fontSize.large,
            color: theme.colors.text,
            fontWeight: '600',
            marginBottom: theme.spacing.small
          }}>
            Cihaz Bilgileri
          </Text>
          <Text style={{ color: theme.colors.textLight, fontSize: theme.fontSize.medium }}>
            Genişlik: {deviceInfo.width}px
          </Text>
          <Text style={{ color: theme.colors.textLight, fontSize: theme.fontSize.medium }}>
            Yükseklik: {deviceInfo.height}px
          </Text>
          <Text style={{ color: theme.colors.textLight, fontSize: theme.fontSize.medium }}>
            Telefon: {deviceInfo.isPhone ? 'Evet' : 'Hayır'}
          </Text>
          <Text style={{ color: theme.colors.textLight, fontSize: theme.fontSize.medium }}>
            Tablet: {deviceInfo.isTablet ? 'Evet' : 'Hayır'}
          </Text>
          <Text style={{ color: theme.colors.textLight, fontSize: theme.fontSize.medium }}>
            Web: {deviceInfo.isWeb ? 'Evet' : 'Hayır'}
          </Text>
        </View>

        {/* Tema Bilgileri */}
        <View style={styles.card.accent}>
          <Text style={{
            fontSize: theme.fontSize.large,
            color: theme.colors.text,
            fontWeight: '600',
            marginBottom: theme.spacing.small
          }}>
            Mevcut Tema
          </Text>
          <Text style={{ color: theme.colors.textLight, fontSize: theme.fontSize.medium }}>
            Tema: {themeName}
          </Text>
          <Text style={{ color: theme.colors.textLight, fontSize: theme.fontSize.medium }}>
            Mod: {themeMode}
          </Text>
        </View>

        {/* Tema Değiştirme Butonları */}
        <View style={styles.card.elevated}>
          <Text style={{
            fontSize: theme.fontSize.large,
            color: theme.colors.text,
            fontWeight: '600',
            marginBottom: theme.spacing.medium
          }}>
            Tema Seçenekleri
          </Text>

          {/* Tema Butonları */}
          <View style={styles.common.rowContainer}>
            <Pressable
              style={[styles.button.primary, { marginRight: theme.spacing.small }]}
              onPress={() => setTheme('classic')}
            >
              <Text style={{ color: theme.colors.primaryLight, fontSize: theme.fontSize.medium }}>
                Classic
              </Text>
            </Pressable>

            <Pressable
              style={[styles.button.secondary, { marginRight: theme.spacing.small }]}
              onPress={() => setTheme('modern')}
            >
              <Text style={{ color: 'white', fontSize: theme.fontSize.medium }}>
                Modern
              </Text>
            </Pressable>
          </View>

          <View style={[styles.common.rowContainer, { marginTop: theme.spacing.small }]}>
            <Pressable
              style={[styles.button.success, { marginRight: theme.spacing.small }]}
              onPress={() => setTheme('futuristic')}
            >
              <Text style={{ color: 'white', fontSize: theme.fontSize.medium }}>
                Futuristic
              </Text>
            </Pressable>

            <Pressable
              style={[styles.button.warning, { marginRight: theme.spacing.small }]}
              onPress={() => setTheme('retro')}
            >
              <Text style={{ color: 'white', fontSize: theme.fontSize.medium }}>
                Retro
              </Text>
            </Pressable>
          </View>

          {/* Mode Toggle */}
          <Pressable
            style={[styles.button.outline, { marginTop: theme.spacing.medium }]}
            onPress={toggleMode}
          >
            <Text style={{ color: theme.colors.primary, fontSize: theme.fontSize.medium }}>
              {themeMode === 'light' ? 'Dark' : 'Light'} Mode&apos;a Geç
            </Text>
          </Pressable>
        </View>

        {/* Renk Paleti */}
        <View style={styles.card.bordered}>
          <Text style={{
            fontSize: theme.fontSize.large,
            color: theme.colors.text,
            fontWeight: '600',
            marginBottom: theme.spacing.medium
          }}>
            Renk Paleti
          </Text>

          <View style={styles.common.rowContainer}>
            <View style={{
              width: 40,
              height: 40,
              backgroundColor: theme.colors.primary,
              borderRadius: theme.spacing.small,
              marginRight: theme.spacing.small
            }} />
            <View style={{
              width: 40,
              height: 40,
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.spacing.small,
              marginRight: theme.spacing.small
            }} />
            <View style={{
              width: 40,
              height: 40,
              backgroundColor: theme.colors.success,
              borderRadius: theme.spacing.small,
              marginRight: theme.spacing.small
            }} />
            <View style={{
              width: 40,
              height: 40,
              backgroundColor: theme.colors.error,
              borderRadius: theme.spacing.small,
              marginRight: theme.spacing.small
            }} />
            <View style={{
              width: 40,
              height: 40,
              backgroundColor: theme.colors.warning,
              borderRadius: theme.spacing.small
            }} />
          </View>
        </View>

        {/* Font Boyutları */}
        <View style={styles.card.flat}>
          <Text style={{
            fontSize: theme.fontSize.large,
            color: theme.colors.text,
            fontWeight: '600',
            marginBottom: theme.spacing.medium
          }}>
            Font Boyutları
          </Text>

          <Text style={{ fontSize: theme.fontSize.tiny, color: theme.colors.text }}>
            Tiny Text ({theme.fontSize.tiny}px)
          </Text>
          <Text style={{ fontSize: theme.fontSize.small, color: theme.colors.text }}>
            Small Text ({theme.fontSize.small}px)
          </Text>
          <Text style={{ fontSize: theme.fontSize.medium, color: theme.colors.text }}>
            Medium Text ({theme.fontSize.medium}px)
          </Text>
          <Text style={{ fontSize: theme.fontSize.regular, color: theme.colors.text }}>
            Regular Text ({theme.fontSize.regular}px)
          </Text>
          <Text style={{ fontSize: theme.fontSize.large, color: theme.colors.text }}>
            Large Text ({theme.fontSize.large}px)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Ana test komponenti
const ThemeTest: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="classic" defaultMode="light">
      <ThemeTestContent />
    </ThemeProvider>
  );
};

export default ThemeTest;
