jest.mock('expo-sqlite');

import { openDatabaseAsync } from 'expo-sqlite';
import { initDB, migrateDB } from '@/services/dbService';

const mockOpenDb = openDatabaseAsync as jest.Mock;

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  closeAsync: jest.fn().mockResolvedValue(undefined),
};

describe('dbService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenDb.mockResolvedValue(mockDb);
  });

  describe('initDB', () => {
    it('opens sparkplate.db', async () => {
      await initDB();
      expect(mockOpenDb).toHaveBeenCalledWith('sparkplate.db');
    });

    it('runs migrations after opening', async () => {
      await initDB();
      expect(mockDb.execAsync).toHaveBeenCalled();
    });

    it('returns the database instance', async () => {
      const db = await initDB();
      expect(db).toBe(mockDb);
    });
  });

  describe('migrateDB', () => {
    it('creates photos and meals tables', async () => {
      await migrateDB(mockDb as any);
      const sql: string = mockDb.execAsync.mock.calls.flat().join(' ');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS photos');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS meals');
    });

    it('creates index on meals.date', async () => {
      await migrateDB(mockDb as any);
      const sql: string = mockDb.execAsync.mock.calls.flat().join(' ');
      expect(sql).toContain('idx_meals_date');
    });

    it('is idempotent — running twice does not throw', async () => {
      await expect(migrateDB(mockDb as any)).resolves.not.toThrow();
      await expect(migrateDB(mockDb as any)).resolves.not.toThrow();
    });
  });
});
