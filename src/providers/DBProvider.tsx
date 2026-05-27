import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { initDB } from '@/services/dbService';
import type { SQLiteDatabase } from '@/services/dbService';

const DBContext = createContext<SQLiteDatabase | null>(null);

export function useDBContext(): SQLiteDatabase | null {
  return useContext(DBContext);
}

export function DBProvider({ children }: PropsWithChildren): React.JSX.Element | null {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    initDB().then(setDb).catch(console.error);
  }, []);

  if (!db) return null;

  return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
}
