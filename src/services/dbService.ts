import * as SQLite from 'expo-sqlite';

export type SQLiteDatabase = SQLite.SQLiteDatabase;

const DB_NAME = 'sparkplate.db';
const SCHEMA_VERSION = 5;

export async function initDB(): Promise<SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrateDB(db);
  return db;
}

export async function migrateDB(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
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
        grade      TEXT,
        note       TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_meals_date      ON meals(date);
      CREATE INDEX IF NOT EXISTS idx_meals_date_type ON meals(date, meal_type);
      CREATE INDEX IF NOT EXISTS idx_meals_mood      ON meals(mood);
      CREATE INDEX IF NOT EXISTS idx_meals_grade     ON meals(grade);
    `);
    await db.execAsync(`PRAGMA user_version = 1`);
  }

  if (version < SCHEMA_VERSION) {
    // v1→v2: grade column changed from INTEGER to TEXT (S/A/B)
    // Drop and recreate meals table (early dev, no data to preserve)
    await db.execAsync(`
      DROP TABLE IF EXISTS meals;

      CREATE TABLE meals (
        id         TEXT PRIMARY KEY,
        date       TEXT NOT NULL,
        meal_type  TEXT NOT NULL,
        photo_id   TEXT REFERENCES photos(id) ON DELETE SET NULL,
        mood       TEXT,
        event      TEXT,
        grade      TEXT,
        note       TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_meals_date      ON meals(date);
      CREATE INDEX IF NOT EXISTS idx_meals_date_type ON meals(date, meal_type);
      CREATE INDEX IF NOT EXISTS idx_meals_mood      ON meals(mood);
      CREATE INDEX IF NOT EXISTS idx_meals_grade     ON meals(grade);
    `);
    await db.execAsync(`PRAGMA user_version = 2`);
  }

  if (version < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_health (
        date         TEXT PRIMARY KEY,
        water_ml     INTEGER,
        sleep_hours  REAL,
        created_at   TEXT NOT NULL,
        updated_at   TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 3`);
  }

  if (version < 4) {
    await db.execAsync(`
      ALTER TABLE daily_health ADD COLUMN snack      TEXT;
      ALTER TABLE daily_health ADD COLUMN late_night TEXT;
    `);
    await db.execAsync(`PRAGMA user_version = 4`);
  }

  if (version < 5) {
    await db.execAsync(`
      ALTER TABLE daily_health ADD COLUMN drink TEXT;
    `);
    await db.execAsync(`PRAGMA user_version = 5`);
  }
}
