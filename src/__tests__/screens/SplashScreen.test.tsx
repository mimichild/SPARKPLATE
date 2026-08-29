jest.mock('expo-router');

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '@/stores/settingsStore';

import SplashScreen from '../../../app/index';

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ settingsVisible: false });
  });

  it('renders app title', () => {
    const { getByText } = render(<SplashScreen />);
    expect(getByText('SPARK PLATE')).toBeTruthy();
  });

  it('renders tagline', () => {
    const { getByText } = render(<SplashScreen />);
    expect(getByText('找回讓自己心動的自己，我要見證我的蛻變')).toBeTruthy();
  });

  it('renders start button', () => {
    const { getByTestId } = render(<SplashScreen />);
    expect(getByTestId('start-btn')).toBeTruthy();
  });

  it('navigates to gallery on start button press', () => {
    const { getByTestId } = render(<SplashScreen />);
    fireEvent.press(getByTestId('start-btn'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/gallery');
  });

  it('renders settings button', () => {
    const { getByTestId } = render(<SplashScreen />);
    expect(getByTestId('settings-btn')).toBeTruthy();
  });

  it('settings button opens the global Settings modal (settingsVisible) without any router navigation', () => {
    const { getByTestId } = render(<SplashScreen />);
    fireEvent.press(getByTestId('settings-btn'));

    // SettingsModal 固定掛在 app/_layout.tsx 頂層，只靠這個全域旗標控制顯示，
    // 這裡不應該呼叫任何 router 方法（避免又踩回之前 replace/navigate 的堆疊競態問題）。
    expect(useSettingsStore.getState().settingsVisible).toBe(true);
    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
