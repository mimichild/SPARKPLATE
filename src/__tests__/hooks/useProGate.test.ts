import { Alert } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProGate } from '@/hooks/useProGate';

jest.mock('expo-router');

describe('useProGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ isProUnlocked: false, pendingSettingsOpen: false });
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

  it('the alert "升級 Pro" button navigates to the Settings screen instead of purchasing directly', () => {
    let upgradePress: (() => void) | undefined;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const upgradeBtn = buttons?.find(b => b.text === '升級 Pro');
      upgradePress = upgradeBtn?.onPress as (() => void) | undefined;
    });
    const { result } = renderHook(() => useProGate());

    act(() => { result.current.requirePro('匯出備份'); });
    expect(alertSpy).toHaveBeenCalled();

    act(() => { upgradePress?.(); });

    // 必須先導向設定頁（顯示方案標題／期間／價格／法律連結），不能繞過這些資訊直接購買。
    expect(useSettingsStore.getState().pendingSettingsOpen).toBe(true);
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
