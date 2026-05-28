import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { DEFAULT_FONT_COLOR } from '@/constants/themeColors';

interface SettingsState {
  fontColor: string;
  openCameraOnStart: boolean;
  autoSavePhoto: boolean;
  pendingCameraOpen: boolean;
  hydrated: boolean;
  autoOpenFired: boolean; // session-only, not persisted
  pendingExportOpen: boolean; // session-only, not persisted
  pendingFilterOpen: boolean; // session-only, not persisted
  pendingScreenshot: boolean; // session-only, not persisted
  hydrate: () => Promise<void>;
  setFontColor: (color: string) => Promise<void>;
  setOpenCameraOnStart: (v: boolean) => Promise<void>;
  setAutoSavePhoto: (v: boolean) => Promise<void>;
  triggerCameraOpen: () => void;
  clearPendingCameraOpen: () => void;
  markAutoOpenFired: () => void;
  triggerExportOpen: () => void;
  clearPendingExportOpen: () => void;
  triggerFilterOpen: () => void;
  clearPendingFilterOpen: () => void;
  triggerScreenshot: () => void;
  clearPendingScreenshot: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  fontColor: DEFAULT_FONT_COLOR,
  openCameraOnStart: false,
  autoSavePhoto: false,
  pendingCameraOpen: false,
  hydrated: false,
  autoOpenFired: false,
  pendingExportOpen: false,
  pendingFilterOpen: false,
  pendingScreenshot: false,

  hydrate: async () => {
    const [fontColor, openCameraOnStart, autoSavePhoto] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.FONT_COLOR),
      AsyncStorage.getItem(STORAGE_KEYS.OPEN_CAMERA_ON_START),
      AsyncStorage.getItem(STORAGE_KEYS.AUTO_SAVE_PHOTO),
    ]);
    set({
      fontColor: fontColor ?? DEFAULT_FONT_COLOR,
      openCameraOnStart: openCameraOnStart === 'true',
      autoSavePhoto: autoSavePhoto === 'true',
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

  setAutoSavePhoto: async (v: boolean) => {
    set({ autoSavePhoto: v });
    await AsyncStorage.setItem(STORAGE_KEYS.AUTO_SAVE_PHOTO, String(v));
  },

  triggerCameraOpen: () => set({ pendingCameraOpen: true }),

  clearPendingCameraOpen: () => set({ pendingCameraOpen: false }),

  markAutoOpenFired: () => set({ autoOpenFired: true }),
  triggerExportOpen: () => set({ pendingExportOpen: true }),
  clearPendingExportOpen: () => set({ pendingExportOpen: false }),
  triggerFilterOpen: () => set({ pendingFilterOpen: true }),
  clearPendingFilterOpen: () => set({ pendingFilterOpen: false }),
  triggerScreenshot: () => set({ pendingScreenshot: true }),
  clearPendingScreenshot: () => set({ pendingScreenshot: false }),
}));
