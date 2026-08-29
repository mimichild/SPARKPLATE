import { Alert } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsPro } from './useIsPro';

interface RequireProOptions {
  /**
   * 為 true 時，跳出提示的同時會直接導去設定頁的 PRO 解鎖區塊（不需要使用者
   * 額外按按鈕確認）。只給截圖／分享這兩個入口用（使用者明確要求恢復）——這兩個
   * 進入點在分頁頂欄，不像其餘 Pro 專屬功能已經身處設定頁內部，導過去至少能看到
   * 「PRO 解鎖」區塊的說明文字。其餘入口維持純告知、不導航（見下方 requirePro
   * 說明）。提示文字本身兩種情況完全一樣，不因為會不會導航而有不同文案。
   */
  openSettingsOnUpgrade?: boolean;
}

/**
 * 免費使用者點到 Pro 專屬功能時的統一互動：預設跳出提示告知「升級 Pro 即可
 * 解鎖」，純顯示不導航——不主動帶使用者去設定頁的 PRO 解鎖區塊。
 *
 * 原本一律會在跳窗按「升級 Pro」導去設定頁看方案資訊再購買，但目前 Pro 月費／
 * 年費是這個 App 帳號第一次要上架的自動續訂訂閱，卡在 App Store 3.1.2(c) 審查
 * 未通過（見 claude-progress.md 工作階段記錄），RevenueCat 抓不到任何方案，導
 * 去設定頁多半只會看到「暫時無法載入方案資訊」，對大部分入口是死路、只會誤以為
 * 功能壞掉，所以預設改成單純告知，不做任何導航；使用者仍可自行從設定頁的 PRO
 * 解鎖區塊查看方案並訂閱。傳入 `{ openSettingsOnUpgrade: true }` 可保留原本的
 * 導航行為。
 *
 * 用法：`if (!requirePro('分享')) return;` 接在功能執行前面。
 */
export function useProGate() {
  const isProUnlocked = useIsPro();
  const openSettings = useSettingsStore(s => s.openSettings);

  function requirePro(featureLabel: string, options?: RequireProOptions): boolean {
    if (isProUnlocked) return true;
    Alert.alert(`${featureLabel}為 Pro 專屬功能`, '升級 Pro 即可解鎖');
    if (options?.openSettingsOnUpgrade) {
      openSettings();
    }
    return false;
  }

  return { isProUnlocked, requirePro };
}
