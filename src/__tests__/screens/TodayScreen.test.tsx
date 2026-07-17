jest.mock('expo-router');
jest.mock('@/hooks/useTodayMeals');
jest.mock('@/hooks/usePhoto');
jest.mock('@/stores/settingsStore');
jest.mock('@/providers/DBProvider', () => ({
  useDBContext: jest.fn(() => ({})),
}));

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { useTodayMeals } from '@/hooks/useTodayMeals';
import { usePhoto } from '@/hooks/usePhoto';
import { useSettingsStore } from '@/stores/settingsStore';

import TodayScreen from '../../../app/(tabs)/today';

const mockUseTodayMeals = useTodayMeals as jest.Mock;
const mockUseSettingsStore = useSettingsStore as unknown as jest.Mock;
const mockUsePhoto = usePhoto as jest.Mock;

function makeStore(overrides = {}) {
  return {
    dayRecord: { date: '2026-05-26', breakfast: undefined, lunch: undefined, dinner: undefined },
    loading: false,
    error: null,
    reload: jest.fn(),
    addMealWithPhoto: jest.fn().mockResolvedValue(undefined),
    updateMeal: jest.fn().mockResolvedValue(undefined),
    deleteMealWithPhoto: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makePhoto(overrides = {}) {
  return {
    takePicture: jest.fn().mockResolvedValue(null),
    pickFromLibrary: jest.fn().mockResolvedValue(null),
    sharePhoto: jest.fn().mockResolvedValue(undefined),
    saveToDevice: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeSettings(overrides = {}) {
  return {
    fontColor: '#4A90E2',
    pendingCameraOpen: false,
    clearPendingCameraOpen: jest.fn(),
    ...overrides,
  };
}

describe('TodayScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTodayMeals.mockReturnValue(makeStore());
    mockUsePhoto.mockReturnValue(makePhoto());
    mockUseSettingsStore.mockReturnValue(makeSettings());
  });

  it('renders 3 meal card placeholders when no meals', () => {
    const { getAllByTestId } = render(<TodayScreen />);
    expect(getAllByTestId('meal-card-placeholder')).toHaveLength(3);
  });

  it('renders FAB button', () => {
    const { getByTestId } = render(<TodayScreen />);
    expect(getByTestId('fab')).toBeTruthy();
  });

  it('shows action sheet when FAB is pressed', () => {
    const { getByTestId } = render(<TodayScreen />);
    fireEvent.press(getByTestId('fab'));
    expect(getByTestId('action-camera')).toBeTruthy();
    expect(getByTestId('action-library')).toBeTruthy();
    expect(getByTestId('action-cancel')).toBeTruthy();
  });

  it('closes action sheet when cancel is pressed', () => {
    const { getByTestId, queryByTestId } = render(<TodayScreen />);
    fireEvent.press(getByTestId('fab'));
    fireEvent.press(getByTestId('action-cancel'));
    expect(queryByTestId('action-camera')).toBeNull();
  });

  it('opens the 1:1 camera modal when camera is selected', async () => {
    // 拍照改為開啟 App 內 CameraLaunchModal，不再直接呼叫 usePhoto().takePicture
    const { getAllByTestId, getByTestId } = render(<TodayScreen />);
    fireEvent.press(getAllByTestId('meal-card-placeholder')[0]);
    await act(async () => {
      fireEvent.press(getByTestId('action-camera'));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(getByTestId('camera-launch-close')).toBeTruthy();
  });

  it('calls pickFromLibrary when library is selected', async () => {
    const pickFromLibrary = jest.fn().mockResolvedValue(null);
    mockUsePhoto.mockReturnValue(makePhoto({ pickFromLibrary }));
    const { getByTestId } = render(<TodayScreen />);
    fireEvent.press(getByTestId('fab'));
    await act(async () => {
      fireEvent.press(getByTestId('action-library'));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(pickFromLibrary).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    mockUseTodayMeals.mockReturnValue(makeStore({ loading: true }));
    const { getByText } = render(<TodayScreen />);
    expect(getByText('載入中…')).toBeTruthy();
  });

  it('opens action sheet when pendingCameraOpen is true', async () => {
    const clearPendingCameraOpen = jest.fn();
    mockUseSettingsStore.mockReturnValue(
      makeSettings({ pendingCameraOpen: true, clearPendingCameraOpen })
    );
    const { getByTestId } = render(<TodayScreen />);
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(getByTestId('action-camera')).toBeTruthy();
    expect(clearPendingCameraOpen).toHaveBeenCalled();
  });
});
