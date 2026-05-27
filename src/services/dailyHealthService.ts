import { SQLiteDatabase } from './dbService';
import { DailyHealth } from '@/types';

function now(): string {
  return new Date().toISOString();
}

interface HealthRow {
  date: string;
  water_ml: number | null;
  sleep_hours: number | null;
  snack: string | null;
  late_night: string | null;
  created_at: string;
  updated_at: string;
}

function rowToHealth(row: HealthRow): DailyHealth {
  return {
    date: row.date,
    waterMl: row.water_ml ?? undefined,
    sleepHours: row.sleep_hours ?? undefined,
    snack: row.snack ?? undefined,
    lateNight: row.late_night ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDailyHealth(
  db: SQLiteDatabase,
  date: string
): Promise<DailyHealth | null> {
  if (!date) return null;
  const row = await db.getFirstAsync<HealthRow>(
    'SELECT * FROM daily_health WHERE date = ?',
    [date]
  );
  return row ? rowToHealth(row) : null;
}

export async function upsertDailyHealth(
  db: SQLiteDatabase,
  date: string,
  data: { waterMl?: number; sleepHours?: number; snack?: string; lateNight?: string }
): Promise<DailyHealth> {
  const ts = now();
  await db.runAsync(
    `INSERT INTO daily_health (date, water_ml, sleep_hours, snack, late_night, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       water_ml    = excluded.water_ml,
       sleep_hours = excluded.sleep_hours,
       snack       = excluded.snack,
       late_night  = excluded.late_night,
       updated_at  = excluded.updated_at`,
    [
      date,
      data.waterMl ?? null,
      data.sleepHours ?? null,
      data.snack ?? null,
      data.lateNight ?? null,
      ts,
      ts,
    ]
  );
  const row = await db.getFirstAsync<HealthRow>(
    'SELECT * FROM daily_health WHERE date = ?',
    [date]
  );
  if (!row) throw new Error(`Failed to fetch daily_health for ${date}`);
  return rowToHealth(row);
}
