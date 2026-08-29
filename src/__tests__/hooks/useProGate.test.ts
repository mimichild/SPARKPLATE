import { Alert } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProGate } from '@/hooks/useProGate';

describe('useProGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ isProUnlocked: false, settingsVisible: false });
  });

  it('requirePro returns true and does not alert when already Pro', () => {
    useSettingsStore.setState({ isProUnlocked: true });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { result } = renderHook(() => useProGate());

    let allowed = false;
    act(() => { allowed = result.current.requirePro('分享'); });

    expect(allowed).toBe(true);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('requirePro returns false and shows an upgrade alert when not Pro', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useProGate());

    let allowed = true;
    act(() => { allowed = result.current.requirePro('分享'); });

    expect(allowed).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith('分享為 Pro 專屬功能', '升級 Pro 即可解鎖');
  });

  it('the alert has no button that opens Settings, and does not navigate there', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useProGate());

    act(() => { result.current.requirePro('匯出備份'); });

    expect(alertSpy).toHaveBeenCalledWith('匯出備份為 Pro 專屬功能', '升級 Pro 即可解鎖');
    const buttons = alertSpy.mock.calls[0][2];
    expect(buttons).toBeUndefined();

    // App Store 訂閱審查目前卡住（Pro 月費／年費尚未通過 3.1.2(c) 審查，RevenueCat
    // 抓不到任何方案），跳窗導去設定頁只會看到「暫時無法載入方案資訊」，對使用者
    // 是死路。改成單純告知「升級 Pro 即可解鎖」，不做任何導航；使用者仍可自行從
    // 設定頁的 PRO 解鎖區塊查看方案並訂閱。
    expect(useSettingsStore.getState().settingsVisible).toBe(false);
  });

  it('with openSettingsOnUpgrade, shows the same plain alert and navigates to Settings immediately', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useProGate());

    // 截圖／分享是使用者明確要求恢復導航的兩個入口：這兩個進入點在 App 首頁的分頁
    // 頂欄，不像其餘 Pro 專屬功能已經在設定頁內部，導去設定頁至少能看到「PRO 解鎖」
    // 區塊的說明文字，值得保留這個路徑。文案跟不導航的版本完全一樣（不寫別的字、
    // 不加按鈕），差別只在於這裡會同時自動導去設定頁，不需要使用者額外按按鈕確認。
    act(() => { result.current.requirePro('截圖', { openSettingsOnUpgrade: true }); });

    expect(alertSpy).toHaveBeenCalledWith('截圖為 Pro 專屬功能', '升級 Pro 即可解鎖');
    const buttons = alertSpy.mock.calls[0][2];
    expect(buttons).toBeUndefined();
    expect(useSettingsStore.getState().settingsVisible).toBe(true);
  });
});
