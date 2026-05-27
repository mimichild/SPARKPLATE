type VolumeCallback = (result: { volume: number }) => void;

const _listeners: VolumeCallback[] = [];

export const addVolumeListener = jest.fn((cb: VolumeCallback) => {
  _listeners.push(cb);
  return {
    remove: jest.fn(() => {
      const idx = _listeners.indexOf(cb);
      if (idx !== -1) _listeners.splice(idx, 1);
    }),
  };
});

export const getVolume = jest.fn().mockResolvedValue({ volume: 0.5 });

// Test helper: simulate a volume change event
export function __simulateVolume(volume: number) {
  _listeners.forEach((cb) => cb({ volume }));
}

// Test helper: reset listeners
export function __reset() {
  _listeners.length = 0;
  addVolumeListener.mockClear();
  getVolume.mockClear();
}
