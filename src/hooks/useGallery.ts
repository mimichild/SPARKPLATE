import { useState, useCallback, useEffect } from 'react';
import { useDB } from '@/hooks/useDB';
import { getMealsByDateRange } from '@/services/mealService';
import { DayRecord } from '@/types';

interface UseGalleryReturn {
  days: DayRecord[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
}

export function useGallery(pageSize = 30): UseGalleryReturn {
  const db = useDB();
  const [days, setDays] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [endDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [offsetDays, setOffsetDays] = useState(0);

  const fetchPage = useCallback(
    async (offset: number, replace: boolean) => {
      setLoading(true);
      const end = new Date(endDate);
      end.setDate(end.getDate() - offset);
      const start = new Date(end);
      start.setDate(start.getDate() - pageSize + 1);

      const records = await getMealsByDateRange(
        db,
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10)
      );

      setDays((prev) => (replace ? records : [...prev, ...records]));
      setHasMore(records.length >= pageSize);
      setLoading(false);
    },
    [db, endDate, pageSize]
  );

  useEffect(() => {
    fetchPage(0, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextOffset = offsetDays + pageSize;
      setOffsetDays(nextOffset);
      fetchPage(nextOffset, false);
    }
  }, [loading, hasMore, offsetDays, pageSize, fetchPage]);

  const reload = useCallback(() => {
    setOffsetDays(0);
    fetchPage(0, true);
  }, [fetchPage]);

  return { days, loading, hasMore, loadMore, reload };
}
