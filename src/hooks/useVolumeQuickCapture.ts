import { useEffect, useRef } from 'react';
import { NativeModules } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

const DOUBLE_PRESS_WINDOW_MS = 600;

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
