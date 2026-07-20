import React, { createContext, useContext, useEffect, useState, useCallback, PropsWithChildren } from 'react';
import { initDB } from '@/services/dbService';
import type { SQLiteDatabase } from '@/services/dbService';

interface DBContextValue {
  db: SQLiteDatabase | null;
  reloadDB: () => Promise<void>;
}

const DBContext = createContext<DBContextValue>({ db: null, reloadDB: async () => {} });

export function useDBContext(): SQLiteDatabase | null {
  return useContext(DBContext).db;
}

// 匯入備份會先關閉現有連線再覆蓋硬碟上的檔案（見 BackupRestoreModal），
// 關閉後的連線物件無法復原，必須呼叫這個方法重新開一個新連線並更新
// context，否則同一次 App 執行期間所有查詢都會撞到「Access to closed
// resource」，只能逼使用者整個關掉 App 重開才能恢復。
export function useDBReload(): () => Promise<void> {
  return useContext(DBContext).reloadDB;
}

export function DBProvider({ children }: PropsWithChildren): React.JSX.Element | null {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  const reloadDB = useCallback(async () => {
    const next = await initDB();
    setDb(next);
  }, []);

  useEffect(() => {
    reloadDB().catch(console.error);
  }, [reloadDB]);

  if (!db) return null;

  return <DBContext.Provider value={{ db, reloadDB }}>{children}</DBContext.Provider>;
}
