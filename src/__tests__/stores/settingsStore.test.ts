jest.mock('@react-native-async-storage/async-storage');

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import { useSettingsStore } from '@/stores/settingsStore';

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('settingsStore', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(null);
    await act(async () => {
      useSettingsStore.setState({
        autoSavePhoto: false,
        pendingCameraOpen: false,
        hydrated: false,
      });
    });
  });

  describe('hydrate', () => {
    it('defaults to false when AsyncStorage has no value', async () => {
      const { result } = renderHook(() => useSettingsStore());
      await act(async () => { await result.current.hydrate(); });
      expect(result.current.autoSavePhoto).toBe(false);
      expect(result.current.hydrated).toBe(true);
    });

    it('loads autoSavePhoto from AsyncStorage', async () => {
      mockStorage.getItem.mockImplementation(async (key) => {
        if (key === 'settings:autoSavePhoto') return 'true';
        return null;
      });
      const { result } = renderHook(() => useSettingsStore());
      await act(async () => { await result.current.hydrate(); });
      expect(result.current.autoSavePhoto).toBe(true);
    });
  });

  describe('setAutoSavePhoto', () => {
    it('updates state and persists to AsyncStorage', async () => {
      const { result } = renderHook(() => useSettingsStore());
      await act(async () => { await result.current.setAutoSavePhoto(true); });
      expect(result.current.autoSavePhoto).toBe(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith('settings:autoSavePhoto', 'true');
    });
  });

  describe('volumeQuickCapture', () => {
    it('defaults to false when AsyncStorage has no value', async () => {
      const { result } = renderHook(() => useSettingsStore());
      await act(async () => { await result.current.hydrate(); });
      expect(result.current.volumeQuickCapture).toBe(false);
    });

    it('loads volumeQuickCapture from AsyncStorage', async () => {
      mockStorage.getItem.mockImplementation(async (key) => {
        if (key === 'settings:volumeQuickCapture') return 'true';
        return null;
      });
      const { result } = renderHook(() => useSettingsStore());
      await act(async () => { await result.current.hydrate(); });
      expect(result.current.volumeQuickCapture).toBe(true);
    });

    it('setVolumeQuickCapture updates state and persists to AsyncStorage', async () => {
      const { result } = renderHook(() => useSettingsStore());
      await act(async () => { await result.current.setVolumeQuickCapture(true); });
      expect(result.current.volumeQuickCapture).toBe(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith('settings:volumeQuickCapture', 'true');
    });
  });

  describe('openSettings / settingsScrollToken', () => {
    it('openSettings sets settingsVisible to true', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => { result.current.openSettings(); });
      expect(result.current.settingsVisible).toBe(true);
    });

    it('openSettings increments settingsScrollToken even when settingsVisible is already true', () => {
      // 使用者在已經打開的設定頁裡面（例如點『開啟時直接用相機打開』）再次觸發升級
      // 提示時，settingsVisible 不會有變化（本來就是 true），但還是要能通知 SettingsModal
      // 捲回頂部看到 Pro 方案資訊，不然使用者會覺得按了「升級 Pro」毫無反應。
      const { result } = renderHook(() => useSettingsStore());
      act(() => { result.current.openSettings(); });
      const tokenAfterFirst = result.current.settingsScrollToken;

      act(() => { result.current.openSettings(); });
      expect(result.current.settingsVisible).toBe(true);
      expect(result.current.settingsScrollToken).toBe(tokenAfterFirst + 1);
    });
  });

  describe('pendingCameraOpen', () => {
    it('triggerCameraOpen sets pendingCameraOpen to true', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => { result.current.triggerCameraOpen(); });
      expect(result.current.pendingCameraOpen).toBe(true);
    });

    it('clearPendingCameraOpen resets to false', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.triggerCameraOpen();
        result.current.clearPendingCameraOpen();
      });
      expect(result.current.pendingCameraOpen).toBe(false);
    });
  });
});
