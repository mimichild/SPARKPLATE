import { Alert } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsPro } from './useIsPro';

/**
 * 免費使用者點到 Pro 專屬功能時的統一互動：跳出升級提示，按「升級 Pro」開啟全域
 * SettingsModal（固定掛在 app/_layout.tsx 頂層，只靠 settingsVisible 這個全域旗標控制
 * 顯示，不透過 router 導航）的 PRO 解鎖區塊，顯示方案標題／期間／價格／隱私權政策
 * 與服務條款連結，讓使用者確認方案內容後再購買——不能在這裡直接觸發購買，否則會
 * 跳過這些必要資訊直接進入系統購買框，違反 Apple Guideline 3.1.2(c)。
 *
 * 之所以不用 router 導回首頁再開設定頁：expo-router 的 Stack 對「目前畫面是否留在
 * 堆疊背景」的處理方式，讓 replace/navigate 在巢狀導覽（如 (tabs) 底下的分頁）或同路由
 * 情境下都會有競態問題（背景畫面與新畫面搶著處理同一個旗標、或原地 replace 把自己的
 * local state 重置掉），實測在多個進入點都會導致「按了升級 Pro 卻直接跳回空白首頁」或
 * 「完全沒反應」。改成全域 Modal 後，不管使用者當下在哪個畫面都能直接遮上來，徹底不需要
 * 導航，也就沒有這類堆疊競態問題。
 *
 * 用法：`if (!requirePro('分享')) return;` 接在功能執行前面。
 */
export function useProGate() {
  const isProUnlocked = useIsPro();
  const openSettings = useSettingsStore(s => s.openSettings);

  function requirePro(featureLabel: string): boolean {
    if (isProUnlocked) return true;
    Alert.alert(
      `${featureLabel}為 Pro 專屬功能`,
      '升級 Pro 即可解鎖，要現在查看方案嗎？',
      [
        { text: '之後再說', style: 'cancel' },
        { text: '升級 Pro', onPress: () => openSettings() },
      ],
    );
    return false;
  }

  return { isProUnlocked, requirePro };
}
