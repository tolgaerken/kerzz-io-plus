import { Stack } from 'expo-router';
import React from 'react';
import { PushNotificationLogsScreen } from '../../components/push-notification-logs';

export default function PushNotificationLogsPage() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Bildirim Logları',
          headerShown: false,
        }}
      />
      <PushNotificationLogsScreen />
    </>
  );
}
