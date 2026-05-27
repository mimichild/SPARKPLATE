jest.mock('expo-sqlite');

import { openDatabaseAsync } from 'expo-sqlite';
import {
  createMeal,
  getMealById,
  getMealsByDate,
  getMealsByDateRange,
  updateMeal,
  deleteMeal,
  filterMeals,
} from '@/services/mealService';
import { Meal, MealType } from '@/types';

const mockOpenDb = openDatabaseAsync as jest.Mock;

function buildMockDb(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const RAW_MEAL_ROW = {
  id: 'meal-1',
  date: '2026-05-26',
  meal_type: 'lunch' as MealType,
  photo_id: null,
  mood: 'good',
  event: '工作午餐',
  grade: 4,
  note: null,
  created_at: '2026-05-26T12:00:00.000Z',
  updated_at: '2026-05-26T12:00:00.000Z',
  photo_thumb_uri: null,
  photo_grid_uri: null,
  photo_detail_uri: null,
  photo_backup_lite_uri: null,
  photo_created_at: null,
};

describe('mealService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMeal', () => {
    it('inserts a row into meals table', async () => {
      const db = buildMockDb({
        getFirstAsync: jest.fn().mockResolvedValue(RAW_MEAL_ROW),
      });
      await createMeal(db as any, {
        date: '2026-05-26',
        mealType: 'lunch',
        mood: 'good',
        grade: 4,
      });
      expect(db.runAsync).toHaveBeenCalledTimes(1);
      const sql: string = db.runAsync.mock.calls[0][0];
      expect(sql).toContain('INSERT INTO meals');
    });

    it('returns a Meal with an auto-generated id', async () => {
      const db = buildMockDb({
        getFirstAsync: jest.fn().mockResolvedValue(RAW_MEAL_ROW),
      });
      const meal = await createMeal(db as any, {
        date: '2026-05-26',
        mealType: 'lunch',
      });
      expect(meal.id).toBeDefined();
      expect(meal.date).toBe('2026-05-26');
      expect(meal.mealType).toBe('lunch');
    });
  });

  describe('getMealById', () => {
    it('returns null when meal not found', async () => {
      const db = buildMockDb({ getFirstAsync: jest.fn().mockResolvedValue(null) });
      const result = await getMealById(db as any, 'non-existent');
      expect(result).toBeNull();
    });

    it('returns a Meal when found', async () => {
      const db = buildMockDb({
        getFirstAsync: jest.fn().mockResolvedValue(RAW_MEAL_ROW),
      });
      const meal = await getMealById(db as any, 'meal-1');
      expect(meal).not.toBeNull();
      expect(meal?.mealType).toBe('lunch');
      expect(meal?.mood).toBe('good');
    });
  });

  describe('getMealsByDate', () => {
    it('queries meals for the given date', async () => {
      const db = buildMockDb({ getAllAsync: jest.fn().mockResolvedValue([RAW_MEAL_ROW]) });
      await getMealsByDate(db as any, '2026-05-26');
      const sql: string = db.getAllAsync.mock.calls[0][0];
      expect(sql).toContain('WHERE');
      expect(db.getAllAsync.mock.calls[0][1]).toContain('2026-05-26');
    });

    it('returns empty array when no meals found', async () => {
      const db = buildMockDb({ getAllAsync: jest.fn().mockResolvedValue([]) });
      const result = await getMealsByDate(db as any, '2026-01-01');
      expect(result).toEqual([]);
    });
  });

  describe('getMealsByDateRange', () => {
    it('returns DayRecord array grouped by date', async () => {
      const db = buildMockDb({
        getAllAsync: jest.fn().mockResolvedValue([RAW_MEAL_ROW]),
      });
      const records = await getMealsByDateRange(db as any, '2026-05-01', '2026-05-31');
      expect(Array.isArray(records)).toBe(true);
      expect(records[0].date).toBe('2026-05-26');
      expect(records[0].lunch).toBeDefined();
    });
  });

  describe('updateMeal', () => {
    it('calls UPDATE SQL with given id', async () => {
      const db = buildMockDb({
        getFirstAsync: jest.fn().mockResolvedValue(RAW_MEAL_ROW),
      });
      await updateMeal(db as any, 'meal-1', { mood: 'great', grade: 5 });
      const sql: string = db.runAsync.mock.calls[0][0];
      expect(sql).toContain('UPDATE meals');
      expect(sql).toContain('WHERE id = ?');
    });

    it('updates updated_at timestamp', async () => {
      const db = buildMockDb({
        getFirstAsync: jest.fn().mockResolvedValue(RAW_MEAL_ROW),
      });
      await updateMeal(db as any, 'meal-1', { mood: 'great' });
      const params: string[] = db.runAsync.mock.calls[0][1];
      // First param is updated_at (ISO string)
      const updatedAt = params[0];
      expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('deleteMeal', () => {
    it('deletes meal by id', async () => {
      const db = buildMockDb();
      await deleteMeal(db as any, 'meal-1');
      const sql: string = db.runAsync.mock.calls[0][0];
      expect(sql).toContain('DELETE FROM meals');
      expect(db.runAsync.mock.calls[0][1]).toContain('meal-1');
    });
  });

  describe('filterMeals', () => {
    it('returns all meals with empty criteria', async () => {
      const db = buildMockDb({ getAllAsync: jest.fn().mockResolvedValue([RAW_MEAL_ROW]) });
      const result = await filterMeals(db as any, {});
      expect(result).toHaveLength(1);
    });

    it('filters by mood', async () => {
      const db = buildMockDb({ getAllAsync: jest.fn().mockResolvedValue([RAW_MEAL_ROW]) });
      await filterMeals(db as any, { moods: ['good', 'great'] });
      const sql: string = db.getAllAsync.mock.calls[0][0];
      expect(sql).toContain('mood IN');
    });

    it('filters by grade', async () => {
      const db = buildMockDb({ getAllAsync: jest.fn().mockResolvedValue([]) });
      await filterMeals(db as any, { grades: [4, 5] });
      const sql: string = db.getAllAsync.mock.calls[0][0];
      expect(sql).toContain('grade IN');
    });

    it('filters by date range', async () => {
      const db = buildMockDb({ getAllAsync: jest.fn().mockResolvedValue([]) });
      await filterMeals(db as any, {
        startDate: '2026-05-01',
        endDate: '2026-05-31',
      });
      const sql: string = db.getAllAsync.mock.calls[0][0];
      expect(sql).toContain('date >=');
      expect(sql).toContain('date <=');
    });

    it('filters by mealType', async () => {
      const db = buildMockDb({ getAllAsync: jest.fn().mockResolvedValue([]) });
      await filterMeals(db as any, { mealTypes: ['breakfast', 'dinner'] });
      const sql: string = db.getAllAsync.mock.calls[0][0];
      expect(sql).toContain('meal_type IN');
    });
  });
});
