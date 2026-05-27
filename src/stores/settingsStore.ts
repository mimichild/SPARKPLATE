import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { DEFAULT_FONT_COLOR } from '@/constants/themeColors';

interface SettingsState {
  fontColor: string;
  openCameraOnStart: boolean;
  pendingCameraOpen: boolean;
  hydrated: boolean;
  autoOpenFired: boolean; // session-only, not persisted
  hydrate: () => Promise<void>;
  setFontColor: (color: string) => Promise<void>;
  setOpenCameraOnStart: (v: boolean) => Promise<void>;
  triggerCameraOpen: () => void;
  clearPendingCameraOpen: () => void;
  markAutoOpenFired: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  fontColor: DEFAULT_FONT_COLOR,
  openCameraOnStart: false,
  pendingCameraOpen: false,
  hydrated: false,
  autoOpenFired: false,

  hydrate: async () => {
    const [fontColor, openCameraOnStart] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.FONT_COLOR),
      AsyncStorage.getItem(STORAGE_KEYS.OPEN_CAMERA_ON_START),
    ]);
    set({
      fontColor: fontColor ?? DEFAULT_FONT_COLOR,
      openCameraOnStart: openCameraOnStart === 'true',
      hydrated: true,
    });
  },

  setFontColor: async (color: string) => {
    set({ fontColor: color });
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_COLOR, color);
  },

  setOpenCameraOnStart: async (v: boolean) => {
    set({ openCameraOnStart: v });
    await AsyncStorage.setItem(STORAGE_KEYS.OPEN_CAMERA_ON_START, String(v));
  },

  triggerCameraOpen: () => set({ pendingCameraOpen: true }),

  clearPendingCameraOpen: () => set({ pendingCameraOpen: false }),

  markAutoOpenFired: () => set({ autoOpenFired: true }),
}));
