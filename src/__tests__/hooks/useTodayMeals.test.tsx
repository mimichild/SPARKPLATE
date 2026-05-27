jest.mock('expo-sqlite');
jest.mock('expo-file-system/legacy');
jest.mock('expo-image-manipulator');
jest.mock('@/services/mealService');
jest.mock('@/services/photoService');
jest.mock('@/hooks/useDB');

import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { useTodayMeals } from '@/hooks/useTodayMeals';
import { getMealsByDate, createMeal, updateMeal, deleteMeal } from '@/services/mealService';
import { savePhoto, deletePhoto } from '@/services/photoService';
import { useDB } from '@/hooks/useDB';
import { Meal } from '@/types';

const mockUseDB = useDB as jest.Mock;
const mockGetMealsByDate = getMealsByDate as jest.Mock;
const mockCreateMeal = createMeal as jest.Mock;
const mockUpdateMeal = updateMeal as jest.Mock;
const mockDeleteMeal = deleteMeal as jest.Mock;
const mockSavePhoto = savePhoto as jest.Mock;
const mockDeletePhoto = deletePhoto as jest.Mock;

const mockDb = {} as any;

const MOCK_MEAL: Meal = {
  id: 'meal-1',
  date: '2026-05-26',
  mealType: 'lunch',
  createdAt: '2026-05-26T12:00:00.000Z',
  updatedAt: '2026-05-26T12:00:00.000Z',
};

const MOCK_PHOTO = {
  id: 'photo-1',
  thumbUri: '/thumb.jpg',
  gridUri: '/grid.jpg',
  detailUri: '/detail.jpg',
  backupLiteUri: '/backup.jpg',
  createdAt: '2026-05-26T12:00:00.000Z',
};

describe('useTodayMeals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDB.mockReturnValue(mockDb);
    mockGetMealsByDate.mockResolvedValue([MOCK_MEAL]);
    mockCreateMeal.mockResolvedValue({ ...MOCK_MEAL, id: 'new-meal' });
    mockSavePhoto.mockResolvedValue(MOCK_PHOTO);
  });

  it('loads today meals on mount', async () => {
    const { result } = renderHook(() => useTodayMeals());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockGetMealsByDate).toHaveBeenCalledWith(mockDb, expect.any(String));
    expect(result.current.loading).toBe(false);
  });

  it('dayRecord maps meals by mealType', async () => {
    mockGetMealsByDate.mockResolvedValue([
      { ...MOCK_MEAL, mealType: 'breakfast' },
      { ...MOCK_MEAL, id: 'meal-2', mealType: 'dinner' },
    ]);

    const { result } = renderHook(() => useTodayMeals());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    expect(result.current.dayRecord.breakfast).toBeDefined();
    expect(result.current.dayRecord.dinner).toBeDefined();
    expect(result.current.dayRecord.lunch).toBeUndefined();
  });

  it('addMealWithPhoto saves photo then creates meal', async () => {
    const { result } = renderHook(() => useTodayMeals());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    await act(async () => {
      await result.current.addMealWithPhoto('breakfast', '/source.jpg', { mood: 'good' });
    });

    expect(mockSavePhoto).toHaveBeenCalledWith(mockDb, '/source.jpg');
    expect(mockCreateMeal).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ mealType: 'breakfast', photoId: 'photo-1', mood: 'good' })
    );
  });

  it('addMealWithPhoto calls reload after success', async () => {
    const { result } = renderHook(() => useTodayMeals());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    jest.clearAllMocks();
    mockGetMealsByDate.mockResolvedValue([]);

    await act(async () => {
      await result.current.addMealWithPhoto('dinner', '/photo.jpg');
    });

    expect(mockGetMealsByDate).toHaveBeenCalledTimes(1);
  });

  it('deleteMealWithPhoto removes meal and photo', async () => {
    const { result } = renderHook(() => useTodayMeals());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    await act(async () => {
      await result.current.deleteMealWithPhoto('meal-1', 'photo-1');
    });

    expect(mockDeleteMeal).toHaveBeenCalledWith(mockDb, 'meal-1');
    expect(mockDeletePhoto).toHaveBeenCalledWith(mockDb, 'photo-1');
  });

  it('updateMeal calls service and reloads', async () => {
    mockUpdateMeal.mockResolvedValue({ ...MOCK_MEAL, mood: 'great' });
    const { result } = renderHook(() => useTodayMeals());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    jest.clearAllMocks();
    mockGetMealsByDate.mockResolvedValue([]);

    await act(async () => {
      await result.current.updateMeal('meal-1', { mood: 'great' });
    });

    expect(mockUpdateMeal).toHaveBeenCalledWith(mockDb, 'meal-1', { mood: 'great' });
    expect(mockGetMealsByDate).toHaveBeenCalledTimes(1);
  });
});
