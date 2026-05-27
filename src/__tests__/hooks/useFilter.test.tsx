jest.mock('@/services/mealService');
jest.mock('@/hooks/useDB');

import { act, renderHook } from '@testing-library/react-native';
import { useFilter } from '@/hooks/useFilter';
import { filterMeals } from '@/services/mealService';
import { useDB } from '@/hooks/useDB';
import { Meal } from '@/types';

const mockUseDB = useDB as jest.Mock;
const mockFilterMeals = filterMeals as jest.Mock;
const mockDb = {} as any;

const MOCK_MEAL: Meal = {
  id: 'meal-1', date: '2026-05-26', mealType: 'lunch',
  createdAt: '2026-05-26T12:00:00.000Z', updatedAt: '2026-05-26T12:00:00.000Z',
};

describe('useFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDB.mockReturnValue(mockDb);
    mockFilterMeals.mockResolvedValue([MOCK_MEAL]);
  });

  it('queries filterMeals on mount', async () => {
    renderHook(() => useFilter());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(mockFilterMeals).toHaveBeenCalledWith(mockDb, {});
  });

  it('re-queries when criteria changes', async () => {
    const { result } = renderHook(() => useFilter());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    jest.clearAllMocks();
    mockFilterMeals.mockResolvedValue([]);

    await act(async () => {
      result.current.setCriteria({ moods: ['good'] });
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockFilterMeals).toHaveBeenCalledWith(mockDb, { moods: ['good'] });
  });

  it('merges partial criteria', async () => {
    const { result } = renderHook(() => useFilter());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    await act(async () => {
      result.current.setCriteria({ moods: ['good'] });
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      result.current.setCriteria({ grades: [5] });
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.criteria).toEqual({ moods: ['good'], grades: [5] });
  });

  it('clearCriteria resets to empty object', async () => {
    const { result } = renderHook(() => useFilter());
    await act(async () => {
      result.current.setCriteria({ moods: ['great'] });
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      result.current.clearCriteria();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.criteria).toEqual({});
  });

  it('exposes totalCount', async () => {
    mockFilterMeals.mockResolvedValue([MOCK_MEAL, { ...MOCK_MEAL, id: 'meal-2' }]);
    const { result } = renderHook(() => useFilter());
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(result.current.totalCount).toBe(2);
  });
});
