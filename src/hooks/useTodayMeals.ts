import { useState, useCallback, useEffect } from 'react';
import { useDB } from '@/hooks/useDB';
import { getMealsByDate, createMeal, updateMeal, deleteMeal } from '@/services/mealService';
import { savePhoto, deletePhoto } from '@/services/photoService';
import { DayRecord, Meal, MealType, Mood, MealGrade } from '@/types';

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mealsToDay(meals: Meal[], date: string): DayRecord {
  const record: DayRecord = { date };
  for (const meal of meals) {
    if (meal.mealType === 'breakfast') record.breakfast = meal;
    else if (meal.mealType === 'lunch') record.lunch = meal;
    else if (meal.mealType === 'dinner') record.dinner = meal;
  }
  return record;
}

interface UseTodayMealsReturn {
  dayRecord: DayRecord;
  loading: boolean;
  error: string | null;
  reload: () => void;
  addMealWithPhoto: (
    mealType: MealType,
    sourceUri: string,
    meta?: { mood?: Mood; event?: string; grade?: MealGrade; note?: string }
  ) => Promise<void>;
  updateMeal: (id: string, updates: Partial<Meal>) => Promise<void>;
  deleteMealWithPhoto: (id: string, photoId?: string) => Promise<void>;
}

export function useTodayMeals(): UseTodayMealsReturn {
  const db = useDB();
  const today = todayDate();
  const [dayRecord, setDayRecord] = useState<DayRecord>({ date: today });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    getMealsByDate(db, today)
      .then((meals) => {
        setDayRecord(mealsToDay(meals, today));
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [db, today]);

  useEffect(() => { reload(); }, [reload]);

  const addMealWithPhoto = useCallback(
    async (
      mealType: MealType,
      sourceUri: string,
      meta?: { mood?: Mood; event?: string; grade?: MealGrade; note?: string }
    ) => {
      const photo = await savePhoto(db, sourceUri);
      await createMeal(db, { date: today, mealType, photoId: photo.id, ...meta });
      reload();
    },
    [db, today, reload]
  );

  const updateMealFn = useCallback(
    async (id: string, updates: Partial<Meal>) => {
      await updateMeal(db, id, updates);
      reload();
    },
    [db, reload]
  );

  const deleteMealWithPhoto = useCallback(
    async (id: string, photoId?: string) => {
      await deleteMeal(db, id);
      if (photoId) await deletePhoto(db, photoId);
      reload();
    },
    [db, reload]
  );

  return {
    dayRecord,
    loading,
    error,
    reload,
    addMealWithPhoto,
    updateMeal: updateMealFn,
    deleteMealWithPhoto,
  };
}
