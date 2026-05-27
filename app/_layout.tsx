import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DBProvider } from '@/providers/DBProvider';
import { useSettingsStore } from '@/stores/settingsStore';

function AppInit() {
  const { hydrate } = useSettingsStore();
  useEffect(() => { hydrate(); }, []);
  return null;
}

export default function RootLayout() {
  return (
    <DBProvider>
      <AppInit />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </DBProvider>
  );
}
