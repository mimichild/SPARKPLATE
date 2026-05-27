import * as SQLite from 'expo-sqlite';

export type SQLiteDatabase = SQLite.SQLiteDatabase;

const DB_NAME = 'sparkplate.db';

export async function initDB(): Promise<SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrateDB(db);
  return db;
}

export async function migrateDB(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS photos (
      id              TEXT PRIMARY KEY,
      thumb_uri       TEXT NOT NULL,
      grid_uri        TEXT NOT NULL,
      detail_uri      TEXT NOT NULL,
      backup_lite_uri TEXT NOT NULL,
      original_uri    TEXT,
      width           INTEGER,
      height          INTEGER,
      created_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meals (
      id         TEXT PRIMARY KEY,
      date       TEXT NOT NULL,
      meal_type  TEXT NOT NULL,
      photo_id   TEXT REFERENCES photos(id) ON DELETE SET NULL,
      mood       TEXT,
      event      TEXT,
      grade      INTEGER,
      note       TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_meals_date      ON meals(date);
    CREATE INDEX IF NOT EXISTS idx_meals_date_type ON meals(date, meal_type);
    CREATE INDEX IF NOT EXISTS idx_meals_mood      ON meals(mood);
    CREATE INDEX IF NOT EXISTS idx_meals_grade     ON meals(grade);
  `);
}
