declare module 'react-native-volume-manager' {
  export interface VolumeResult {
    volume: number;
    type?: string;
  }
  export function addVolumeListener(
    callback: (result: VolumeResult) => void
  ): { remove: () => void };
  export function getVolume(): Promise<VolumeResult>;
  // Test helpers (only available in __mocks__)
  export function __simulateVolume(volume: number): void;
  export function __reset(): void;
}
