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
