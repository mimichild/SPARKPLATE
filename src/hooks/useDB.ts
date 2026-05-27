import { useDBContext } from '@/providers/DBProvider';
import type { SQLiteDatabase } from '@/services/dbService';

export function useDB(): SQLiteDatabase {
  const db = useDBContext();
  if (!db) throw new Error('useDB must be called within a DBProvider');
  return db;
}
