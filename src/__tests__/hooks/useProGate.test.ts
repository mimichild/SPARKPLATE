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
    expect(alertSpy).toHaveBeenCalledWith(
      '分享為 Pro 專屬功能',
      expect.any(String),
      expect.any(Array),
    );
  });

  it('the alert "升級 Pro" button opens the global Settings modal instead of purchasing directly', () => {
    let upgradePress: (() => void) | undefined;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const upgradeBtn = buttons?.find(b => b.text === '升級 Pro');
      upgradePress = upgradeBtn?.onPress as (() => void) | undefined;
    });
    const { result } = renderHook(() => useProGate());

    act(() => { result.current.requirePro('匯出備份'); });
    expect(alertSpy).toHaveBeenCalled();

    act(() => { upgradePress?.(); });

    // 必須先看到方案標題／期間／價格／法律連結，不能繞過這些資訊直接購買。SettingsModal
    // 固定掛在 app/_layout.tsx 頂層，只靠這個全域旗標控制顯示——不透過 router 導航，
    // 這樣不管使用者當下在哪個畫面（含巢狀在 (tabs) 底下的分頁），都能直接遮上來，
    // 不會有 router.replace/navigate 在有背景畫面或巢狀導覽情境下的競態問題。
    expect(useSettingsStore.getState().settingsVisible).toBe(true);
  });
});
