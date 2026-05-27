import { useState, useCallback, useEffect } from 'react';
import { useDB } from '@/hooks/useDB';
import { filterMeals } from '@/services/mealService';
import { FilterCriteria, Meal } from '@/types';

interface UseFilterReturn {
  criteria: FilterCriteria;
  results: Meal[];
  loading: boolean;
  totalCount: number;
  setCriteria: (partial: Partial<FilterCriteria>) => void;
  clearCriteria: () => void;
}

export function useFilter(): UseFilterReturn {
  const db = useDB();
  const [criteria, setCriteriaState] = useState<FilterCriteria>({});
  const [results, setResults] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    filterMeals(db, criteria)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [db, criteria]);

  const setCriteria = useCallback((partial: Partial<FilterCriteria>) => {
    setCriteriaState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearCriteria = useCallback(() => {
    setCriteriaState({});
  }, []);

  return { criteria, results, loading, totalCount: results.length, setCriteria, clearCriteria };
}
