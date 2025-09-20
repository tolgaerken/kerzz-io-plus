import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProtectedRoute } from '@modules/auth';
import { useTheme } from '@modules/theme';

export default function DrawerLayout() {
  const { theme } = useTheme();

  return (
    <ProtectedRoute requireAuth={true}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
        screenOptions={{
          drawerActiveTintColor: theme.colors.primary,
          drawerInactiveTintColor: theme.colors.text,
          drawerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }}>
        <Drawer.Screen
          name="index"
          options={{
            title: 'Ana Sayfa',
            drawerIcon: ({ color, size }) => (
              <IconSymbol size={size} name="house.fill" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="explore"
          options={{
            title: 'Keşfet',
            drawerIcon: ({ color, size }) => (
              <IconSymbol size={size} name="paperplane.fill" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="sales"
          options={{
            title: 'Satışlar',
            drawerIcon: ({ color, size }) => (
              <IconSymbol size={size} name="chart.bar.fill" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="opportunities"
          options={{
            title: 'Fırsatlar',
            drawerIcon: ({ color, size }) => (
              <IconSymbol size={size} name="target" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="licenses"
          options={{
            title: 'Lisanslar',
            drawerIcon: ({ color, size }) => (
              <IconSymbol size={size} name="key.fill" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="customers"
          options={{
            title: 'Müşteriler',
            drawerIcon: ({ color, size }) => (
              <IconSymbol size={size} name="person.2.fill" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            title: 'Profil',
            drawerIcon: ({ color, size }) => (
              <IconSymbol size={size} name="person.fill" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Ayarlar',
            drawerIcon: ({ color, size }) => (
              <IconSymbol size={size} name="gear" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="sale-detail"
          options={{
            title: 'Satış Detayı',
            drawerItemStyle: { display: 'none' }, // Hide from drawer menu
          }}
        />
        <Drawer.Screen
          name="opportunity-detail"
          options={{
            title: 'Fırsat Detayı',
            drawerItemStyle: { display: 'none' }, // Hide from drawer menu
          }}
        />
        <Drawer.Screen
          name="license-detail"
          options={{
            title: 'Lisans Detayı',
            drawerItemStyle: { display: 'none' }, // Hide from drawer menu
          }}
        />
        <Drawer.Screen
          name="bank-transaction-detail"
          options={{
            title: 'Banka Hareketi',
            drawerItemStyle: { display: 'none' }, // Hide from drawer menu
          }}
        />
        </Drawer>
      </GestureHandlerRootView>
    </ProtectedRoute>
  );
}
