jest.mock('expo-router');
jest.mock('@/components/SettingsModal', () => ({
  SettingsModal: () => null,
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import SplashScreen from '../../../app/index';

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('navigates to tabs on start button press', () => {
    const { getByTestId } = render(<SplashScreen />);
    fireEvent.press(getByTestId('start-btn'));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/today');
  });

  it('renders settings button', () => {
    const { getByTestId } = render(<SplashScreen />);
    expect(getByTestId('settings-btn')).toBeTruthy();
  });
});
