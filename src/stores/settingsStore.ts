import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { DEFAULT_FONT_COLOR } from '@/constants/themeColors';

interface SettingsState {
  fontColor: string;
  volumeQuickCapture: boolean;
  pendingCameraOpen: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setFontColor: (color: string) => Promise<void>;
  setVolumeQuickCapture: (v: boolean) => Promise<void>;
  triggerCameraOpen: () => void;
  clearPendingCameraOpen: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  fontColor: DEFAULT_FONT_COLOR,
  volumeQuickCapture: false,
  pendingCameraOpen: false,
  hydrated: false,

  hydrate: async () => {
    const [fontColor, volumeQuickCapture] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.FONT_COLOR),
      AsyncStorage.getItem(STORAGE_KEYS.VOLUME_QUICK_CAPTURE),
    ]);
    set({
      fontColor: fontColor ?? DEFAULT_FONT_COLOR,
      volumeQuickCapture: volumeQuickCapture === 'true',
      hydrated: true,
    });
  },

  setFontColor: async (color: string) => {
    set({ fontColor: color });
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_COLOR, color);
  },

  setVolumeQuickCapture: async (v: boolean) => {
    set({ volumeQuickCapture: v });
    await AsyncStorage.setItem(STORAGE_KEYS.VOLUME_QUICK_CAPTURE, String(v));
  },

  triggerCameraOpen: () => set({ pendingCameraOpen: true }),

  clearPendingCameraOpen: () => set({ pendingCameraOpen: false }),
}));
