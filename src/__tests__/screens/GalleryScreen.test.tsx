jest.mock('expo-router');
jest.mock('@/hooks/useGallery');
jest.mock('@/providers/DBProvider', () => ({
  useDBContext: jest.fn(() => ({})),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useGallery } from '@/hooks/useGallery';

import GalleryScreen from '../../../app/(tabs)/gallery';

const mockUseGallery = useGallery as jest.Mock;

const MEAL = {
  id: 'm1',
  date: '2026-05-26',
  mealType: 'breakfast' as const,
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

function makeGallery(overrides = {}) {
  return {
    days: [],
    loading: false,
    hasMore: false,
    loadMore: jest.fn(),
    reload: jest.fn(),
    ...overrides,
  };
}

describe('GalleryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGallery.mockReturnValue(makeGallery());
  });

  it('renders empty state when no meals', () => {
    const { getByText } = render(<GalleryScreen />);
    expect(getByText('尚無紀錄')).toBeTruthy();
  });

  it('renders gallery cells for meals with photos', () => {
    mockUseGallery.mockReturnValue(
      makeGallery({ days: [{ date: '2026-05-26', breakfast: MEAL }] })
    );
    const { getByTestId } = render(<GalleryScreen />);
    expect(getByTestId('gallery-cell-m1')).toBeTruthy();
  });

  it('shows loading indicator when loading', () => {
    mockUseGallery.mockReturnValue(makeGallery({ loading: true }));
    const { getByText } = render(<GalleryScreen />);
    expect(getByText('載入中…')).toBeTruthy();
  });

  it('opens PhotoViewer when a cell is pressed', () => {
    mockUseGallery.mockReturnValue(
      makeGallery({ days: [{ date: '2026-05-26', breakfast: MEAL }] })
    );
    const { getByTestId } = render(<GalleryScreen />);
    fireEvent.press(getByTestId('gallery-cell-m1'));
    expect(getByTestId('photo-viewer-close')).toBeTruthy();
  });

  it('closes PhotoViewer when close is pressed', () => {
    mockUseGallery.mockReturnValue(
      makeGallery({ days: [{ date: '2026-05-26', breakfast: MEAL }] })
    );
    const { getByTestId, queryByTestId } = render(<GalleryScreen />);
    fireEvent.press(getByTestId('gallery-cell-m1'));
    fireEvent.press(getByTestId('photo-viewer-close'));
    expect(queryByTestId('photo-viewer-close')).toBeNull();
  });
});
