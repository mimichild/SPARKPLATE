import { useState, useEffect, useCallback } from 'react';
import { useDB } from '@/hooks/useDB';
import { getDailyHealth, upsertDailyHealth } from '@/services/dailyHealthService';
import { DailyHealth } from '@/types';

export function useDailyHealth(date: string) {
  const db = useDB();
  const [health, setHealth] = useState<DailyHealth | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    getDailyHealth(db, date)
      .then(setHealth)
      .finally(() => setLoading(false));
  }, [db, date]);

  const save = useCallback(
    async (data: { waterMl?: number; sleepHours?: number; drink?: string; snack?: string; lateNight?: string }) => {
      const result = await upsertDailyHealth(db, date, data);
      setHealth(result);
    },
    [db, date]
  );

  return { health, loading, save };
}
