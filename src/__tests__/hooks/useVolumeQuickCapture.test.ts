jest.mock('react-native-volume-manager');
jest.mock('@/stores/settingsStore');

// Make NativeModules.VolumeManager truthy so isVolumeManagerAvailable passes
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.NativeModules.VolumeManager = { getVolume: jest.fn() };
  return rn;
});

import { renderHook, act } from '@testing-library/react-native';
import { addVolumeListener, __simulateVolume, __reset } from 'react-native-volume-manager';
import { useSettingsStore } from '@/stores/settingsStore';
import { useVolumeQuickCapture } from '@/hooks/useVolumeQuickCapture';

const mockUseSettingsStore = useSettingsStore as unknown as jest.Mock;
const mockAddVolumeListener = addVolumeListener as jest.Mock;

function makeStore(overrides = {}) {
  return { volumeQuickCapture: true, ...overrides };
}

describe('useVolumeQuickCapture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __reset();
    jest.useFakeTimers();
    mockUseSettingsStore.mockReturnValue(makeStore());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('registers volume listener when volumeQuickCapture is enabled', () => {
    const onTrigger = jest.fn();
    renderHook(() => useVolumeQuickCapture(onTrigger));
    expect(mockAddVolumeListener).toHaveBeenCalledTimes(1);
  });

  it('does not register listener when volumeQuickCapture is disabled', () => {
    mockUseSettingsStore.mockReturnValue(makeStore({ volumeQuickCapture: false }));
    const onTrigger = jest.fn();
    renderHook(() => useVolumeQuickCapture(onTrigger));
    expect(mockAddVolumeListener).not.toHaveBeenCalled();
  });

  it('triggers onTrigger on two volume decreases within 600ms', () => {
    const onTrigger = jest.fn();
    renderHook(() => useVolumeQuickCapture(onTrigger));

    act(() => {
      __simulateVolume(0.5); // baseline
      __simulateVolume(0.4); // first press
    });
    jest.advanceTimersByTime(300);
    act(() => {
      __simulateVolume(0.3); // second press within 600ms
    });

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('does not trigger when second press is after 600ms', () => {
    const onTrigger = jest.fn();
    renderHook(() => useVolumeQuickCapture(onTrigger));

    act(() => {
      __simulateVolume(0.5);
      __simulateVolume(0.4); // first press
    });
    jest.advanceTimersByTime(700);
    act(() => {
      __simulateVolume(0.3); // too late
    });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('does not trigger when volume increases', () => {
    const onTrigger = jest.fn();
    renderHook(() => useVolumeQuickCapture(onTrigger));

    act(() => {
      __simulateVolume(0.4);
      __simulateVolume(0.5); // increase
    });
    jest.advanceTimersByTime(300);
    act(() => {
      __simulateVolume(0.6); // another increase
    });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('removes listener on unmount', () => {
    const onTrigger = jest.fn();
    const removeMock = jest.fn();
    mockAddVolumeListener.mockReturnValue({ remove: removeMock });
    const { unmount } = renderHook(() => useVolumeQuickCapture(onTrigger));
    unmount();
    expect(removeMock).toHaveBeenCalled();
  });
});
