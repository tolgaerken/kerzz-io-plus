import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ProtectedRoute } from '@modules/auth';

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <ProtectedRoute requireAuth={true}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
        screenOptions={{
          drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          drawerInactiveTintColor: Colors[colorScheme ?? 'light'].text,
          drawerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
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
        </Drawer>
      </GestureHandlerRootView>
    </ProtectedRoute>
  );
}
