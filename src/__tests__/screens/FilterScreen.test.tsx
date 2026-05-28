jest.mock('expo-router');
jest.mock('@/hooks/useFilter');
jest.mock('@/stores/settingsStore');
jest.mock('@/providers/DBProvider', () => ({
  useDBContext: jest.fn(() => ({})),
}));

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { useFilter } from '@/hooks/useFilter';
import { useSettingsStore } from '@/stores/settingsStore';

import FilterScreen from '../../../app/(tabs)/filter';

const mockUseFilter = useFilter as jest.Mock;
const mockUseSettingsStore = useSettingsStore as unknown as jest.Mock;

const MEAL = {
  id: 'm1',
  date: '2026-05-26',
  mealType: 'breakfast' as const,
  mood: 'happy' as const,
  grade: 'S' as const,
  photoId: 'p1',
  photo: {
    id: 'p1',
    thumbUri: '/thumb.jpg',
    gridUri: '/grid.jpg',
    detailUri: '/detail.jpg',
    backupLiteUri: '/backup.jpg',
    createdAt: '2026-05-26T08:00:00Z',
  },
  createdAt: '2026-05-26T08:00:00Z',
  updatedAt: '2026-05-26T08:00:00Z',
};

function makeFilter(overrides = {}) {
  return {
    criteria: {},
    results: [],
    loading: false,
    totalCount: 0,
    setCriteria: jest.fn(),
    clearCriteria: jest.fn(),
    reload: jest.fn(),
    ...overrides,
  };
}

function makeSettings(overrides = {}) {
  return {
    fontColor: '#4A90E2',
    pendingFilterOpen: false,
    clearPendingFilterOpen: jest.fn(),
    ...overrides,
  };
}

describe('FilterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFilter.mockReturnValue(makeFilter());
    mockUseSettingsStore.mockReturnValue(makeSettings());
  });

  it('shows result count', () => {
    mockUseFilter.mockReturnValue(makeFilter({ totalCount: 5 }));
    const { getByText } = render(<FilterScreen />);
    expect(getByText('共 5 筆')).toBeTruthy();
  });

  it('shows empty state when no results', () => {
    const { getByText } = render(<FilterScreen />);
    expect(getByText('沒有符合的紀錄')).toBeTruthy();
  });

  it('renders gallery cells for results', () => {
    mockUseFilter.mockReturnValue(makeFilter({ results: [MEAL], totalCount: 1 }));
    const { getByTestId } = render(<FilterScreen />);
    expect(getByTestId('gallery-cell-m1')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseFilter.mockReturnValue(makeFilter({ loading: true }));
    const { getByText } = render(<FilterScreen />);
    expect(getByText('載入中…')).toBeTruthy();
  });

  it('opens filter panel when pendingFilterOpen is true', async () => {
    const clearPendingFilterOpen = jest.fn();
    mockUseSettingsStore.mockReturnValue(
      makeSettings({ pendingFilterOpen: true, clearPendingFilterOpen })
    );
    const { getByTestId } = render(<FilterScreen />);
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(getByTestId('filter-mood-happy')).toBeTruthy();
    expect(clearPendingFilterOpen).toHaveBeenCalled();
  });
});
