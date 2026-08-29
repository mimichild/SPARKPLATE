import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import mobileAds from 'react-native-google-mobile-ads';
import { DBProvider } from '@/providers/DBProvider';
import { useSettingsStore } from '@/stores/settingsStore';
import { fetchProStatus } from '@/services/purchases';
import { SettingsModal } from '@/components/SettingsModal';

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

// 固定掛在最頂層（不像以前只在 app/index.tsx 掛載）：不管使用者當下在哪個畫面（含
// 巢狀在 (tabs) 底下的分頁），useProGate 的 openSettings() 都能讓它直接遮上來，完全
// 不需要 router 導航回首頁——避免了 replace/navigate 在有背景畫面或巢狀導覽情境下的
// 堆疊競態問題（曾經導致「按升級 Pro 卻跳回空白首頁」或「完全沒反應」）。
function GlobalSettingsModal() {
  const { settingsVisible, closeSettings } = useSettingsStore();
  return <SettingsModal visible={settingsVisible} onClose={closeSettings} />;
}

export default function RootLayout() {
  return (
    <DBProvider>
      <AppInit />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <GlobalSettingsModal />
      <StatusBar style="auto" />
    </DBProvider>
  );
}
