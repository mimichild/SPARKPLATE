import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import mobileAds from 'react-native-google-mobile-ads';
import { DBProvider } from '@/providers/DBProvider';
import { useSettingsStore } from '@/stores/settingsStore';
import { fetchProStatus } from '@/services/purchases';

mobileAds().initialize();

function AppInit() {
  const { hydrate, setProUnlocked } = useSettingsStore();
  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    // RevenueCat 尚未設定（沒有 API Key）時回傳 null，維持本機既有的 Pro 狀態，不要用 null 蓋掉。
    fetchProStatus().then(isPro => {
      if (isPro != null) setProUnlocked(isPro);
    });
  }, []);

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
