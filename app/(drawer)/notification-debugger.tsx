import NotificationDebugger from '@/components/notifications/NotificationDebugger';
import { useTheme } from '@modules/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function NotificationDebuggerScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <NotificationDebugger />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
