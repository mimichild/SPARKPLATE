import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsPro } from './useIsPro';

/**
 * 免費使用者點到 Pro 專屬功能時的統一互動：跳出升級提示，按「升級 Pro」導向設定頁
 * 的 PRO 解鎖區塊（顯示方案標題／期間／價格／隱私權政策與服務條款連結）讓使用者
 * 確認方案內容後再購買——不能在這裡直接觸發購買，否則會跳過這些必要資訊直接進入
 * 系統購買框，違反 Apple Guideline 3.1.2(c)。
 * 用法：`if (!requirePro('分享')) return;` 接在功能執行前面。
 */
export function useProGate() {
  const isProUnlocked = useIsPro();
  const triggerSettingsOpen = useSettingsStore(s => s.triggerSettingsOpen);

  function requirePro(featureLabel: string): boolean {
    if (isProUnlocked) return true;
    Alert.alert(
      `${featureLabel}為 Pro 專屬功能`,
      '升級 Pro 即可解鎖，要現在查看方案嗎？',
      [
        { text: '之後再說', style: 'cancel' },
        {
          text: '升級 Pro',
          onPress: () => {
            triggerSettingsOpen();
            router.replace('/');
          },
        },
      ],
    );
    return false;
  }

  return { isProUnlocked, requirePro };
}
