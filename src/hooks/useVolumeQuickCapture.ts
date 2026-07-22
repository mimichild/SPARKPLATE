import { useEffect, useRef } from 'react';
import { NativeModules } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

// 實機測試發現：兩次獨立按壓（放開再按）之間的間隔常常超過 600ms，
// 太緊的窗口幾乎偵測不到「快速連按兩下」，放寬到 1200ms 讓正常速度的
// 連按都能觸發（長按時的連續音量下降在這個窗口內一樣會觸發，不受影響）。
const DOUBLE_PRESS_WINDOW_MS = 1200;

// react-native-volume-manager requires a linked native module.
// In Expo Go the module is absent, so we guard with NativeModules check
// before ever calling require() — avoiding the NativeEventEmitter init crash.
const isVolumeManagerAvailable = !!NativeModules.VolumeManager;

export function useVolumeQuickCapture(onTrigger: () => void) {
  const { volumeQuickCapture } = useSettingsStore();

  const onTriggerRef = useRef(onTrigger);
  useEffect(() => { onTriggerRef.current = onTrigger; }, [onTrigger]);

  useEffect(() => {
    if (!volumeQuickCapture || !isVolumeManagerAvailable) return;

    let unsub: { remove: () => void } | null = null;
    const lastDecreaseTime = { current: 0 };
    const lastVolume = { current: -1 };

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { addVolumeListener } = require('react-native-volume-manager') as {
        addVolumeListener: (cb: (r: { volume: number }) => void) => { remove: () => void };
      };

      unsub = addVolumeListener((result: { volume: number }) => {
        const { volume } = result;
        if (lastVolume.current !== -1 && volume < lastVolume.current) {
          const now = Date.now();
          const elapsed = now - lastDecreaseTime.current;
          if (elapsed > 0 && elapsed < DOUBLE_PRESS_WINDOW_MS) {
            onTriggerRef.current();
            lastDecreaseTime.current = 0;
          } else {
            lastDecreaseTime.current = now;
          }
        }
        lastVolume.current = volume;
      });
    } catch {
      // Unexpected fallback
    }

    return () => unsub?.remove();
  }, [volumeQuickCapture]);
}
