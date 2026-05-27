import React, { useCallback, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DBProvider } from '@/providers/DBProvider';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVolumeQuickCapture } from '@/hooks/useVolumeQuickCapture';

function VolumeCaptureTrigger() {
  const { hydrate, triggerCameraOpen } = useSettingsStore();

  useEffect(() => { hydrate(); }, []);

  const handleTrigger = useCallback(() => {
    router.navigate('/(tabs)/today');
    triggerCameraOpen();
  }, [triggerCameraOpen]);

  useVolumeQuickCapture(handleTrigger);
  return null;
}

export default function RootLayout() {
  return (
    <DBProvider>
      <VolumeCaptureTrigger />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </DBProvider>
  );
}
