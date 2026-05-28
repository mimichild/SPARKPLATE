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
  reload: () => void;
}

export function useFilter(): UseFilterReturn {
  const db = useDB();
  const [criteria, setCriteriaState] = useState<FilterCriteria>({});
  const [results, setResults] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setLoading(true);
    filterMeals(db, criteria)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [db, criteria, version]);

  const setCriteria = useCallback((partial: Partial<FilterCriteria>) => {
    setCriteriaState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearCriteria = useCallback(() => {
    setCriteriaState({});
  }, []);

  const reload = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return { criteria, results, loading, totalCount: results.length, setCriteria, clearCriteria, reload };
}
