import { SQLiteDatabase } from './dbService';
import { Meal, MealType, DayRecord, FilterCriteria, Photo } from '@/types';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString();
}

interface MealRow {
  id: string;
  date: string;
  meal_type: MealType;
  photo_id: string | null;
  mood: string | null;
  event: string | null;
  grade: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  photo_thumb_uri: string | null;
  photo_grid_uri: string | null;
  photo_detail_uri: string | null;
  photo_backup_lite_uri: string | null;
  photo_created_at: string | null;
}

const MEAL_SELECT = `
  SELECT
    m.id, m.date, m.meal_type, m.photo_id, m.mood, m.event, m.grade, m.note,
    m.created_at, m.updated_at,
    p.thumb_uri       AS photo_thumb_uri,
    p.grid_uri        AS photo_grid_uri,
    p.detail_uri      AS photo_detail_uri,
    p.backup_lite_uri AS photo_backup_lite_uri,
    p.created_at      AS photo_created_at
  FROM meals m
  LEFT JOIN photos p ON p.id = m.photo_id
`;

function rowToMeal(row: MealRow): Meal {
  let photo: Photo | undefined;
  if (row.photo_id && row.photo_thumb_uri) {
    photo = {
      id: row.photo_id,
      thumbUri: row.photo_thumb_uri,
      gridUri: row.photo_grid_uri ?? '',
      detailUri: row.photo_detail_uri ?? '',
      backupLiteUri: row.photo_backup_lite_uri ?? '',
      createdAt: row.photo_created_at ?? '',
    };
  }

  return {
    id: row.id,
    date: row.date,
    mealType: row.meal_type,
    photoId: row.photo_id ?? undefined,
    photo,
    mood: (row.mood as Meal['mood']) ?? undefined,
    event: row.event ?? undefined,
    grade: (row.grade as Meal['grade']) ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createMeal(
  db: SQLiteDatabase,
  data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt' | 'photo'>
): Promise<Meal> {
  const id = generateId();
  const ts = now();

  await db.runAsync(
    `INSERT INTO meals (id, date, meal_type, photo_id, mood, event, grade, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.date,
      data.mealType,
      data.photoId ?? null,
      data.mood ?? null,
      data.event ?? null,
      data.grade ?? null,
      data.note ?? null,
      ts,
      ts,
    ]
  );

  const row = await db.getFirstAsync<MealRow>(`${MEAL_SELECT} WHERE m.id = ?`, [id]);
  if (!row) throw new Error(`Failed to fetch created meal ${id}`);
  return rowToMeal(row);
}

export async function getMealById(
  db: SQLiteDatabase,
  id: string
): Promise<Meal | null> {
  const row = await db.getFirstAsync<MealRow>(`${MEAL_SELECT} WHERE m.id = ?`, [id]);
  return row ? rowToMeal(row) : null;
}

export async function getMealsByDate(
  db: SQLiteDatabase,
  date: string
): Promise<Meal[]> {
  const rows = await db.getAllAsync<MealRow>(
    `${MEAL_SELECT} WHERE m.date = ? ORDER BY m.meal_type ASC`,
    [date]
  );
  return rows.map(rowToMeal);
}

export async function getMealsByDateRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<DayRecord[]> {
  const rows = await db.getAllAsync<MealRow>(
    `${MEAL_SELECT} WHERE m.date >= ? AND m.date <= ? ORDER BY m.date DESC, m.meal_type ASC, m.created_at DESC`,
    [startDate, endDate]
  );

  const dayMap = new Map<string, DayRecord>();
  for (const row of rows) {
    if (!dayMap.has(row.date)) {
      dayMap.set(row.date, { date: row.date });
    }
    const record = dayMap.get(row.date)!;
    const meal = rowToMeal(row);
    // Only set the first (newest, due to created_at DESC) per slot — skip duplicates
    if (row.meal_type === 'breakfast' && !record.breakfast) record.breakfast = meal;
    else if (row.meal_type === 'lunch' && !record.lunch) record.lunch = meal;
    else if (row.meal_type === 'dinner' && !record.dinner) record.dinner = meal;
  }

  return Array.from(dayMap.values());
}

export async function updateMeal(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Omit<Meal, 'id' | 'createdAt' | 'photo'>>
): Promise<Meal> {
  const updatedAt = now();
  const setClauses: string[] = ['updated_at = ?'];
  const params: (string | number | null)[] = [updatedAt];

  if (updates.photoId !== undefined) { setClauses.push('photo_id = ?'); params.push(updates.photoId ?? null); }
  if (updates.mood !== undefined) { setClauses.push('mood = ?'); params.push(updates.mood ?? null); }
  if (updates.event !== undefined) { setClauses.push('event = ?'); params.push(updates.event ?? null); }
  if (updates.grade !== undefined) { setClauses.push('grade = ?'); params.push(updates.grade ?? null); }
  if (updates.note !== undefined) { setClauses.push('note = ?'); params.push(updates.note ?? null); }

  params.push(id);
  await db.runAsync(
    `UPDATE meals SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  const row = await db.getFirstAsync<MealRow>(`${MEAL_SELECT} WHERE m.id = ?`, [id]);
  if (!row) throw new Error(`Meal ${id} not found after update`);
  return rowToMeal(row);
}

export async function deleteMeal(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM meals WHERE id = ?', [id]);
}

export async function filterMeals(
  db: SQLiteDatabase,
  criteria: FilterCriteria
): Promise<Meal[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (criteria.startDate) {
    conditions.push('m.date >= ?');
    params.push(criteria.startDate);
  }
  if (criteria.endDate) {
    conditions.push('m.date <= ?');
    params.push(criteria.endDate);
  }
  if (criteria.moods?.length) {
    conditions.push(`m.mood IN (${criteria.moods.map(() => '?').join(', ')})`);
    params.push(...criteria.moods);
  }
  if (criteria.grades?.length) {
    conditions.push(`m.grade IN (${criteria.grades.map(() => '?').join(', ')})`);
    params.push(...criteria.grades);
  }
  if (criteria.mealTypes?.length) {
    conditions.push(`m.meal_type IN (${criteria.mealTypes.map(() => '?').join(', ')})`);
    params.push(...criteria.mealTypes);
  }
  if (criteria.minWaterMl != null) {
    conditions.push('dh.water_ml >= ?');
    params.push(criteria.minWaterMl);
  }
  if (criteria.minSleepHours != null) {
    conditions.push('dh.sleep_hours >= ?');
    params.push(criteria.minSleepHours);
  }
  if (criteria.hasSnack) {
    conditions.push('dh.snack IS NOT NULL');
  }
  if (criteria.hasLateNight) {
    conditions.push('dh.late_night IS NOT NULL');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const filterSelect = `
    SELECT
      m.id, m.date, m.meal_type, m.photo_id, m.mood, m.event, m.grade, m.note,
      m.created_at, m.updated_at,
      p.thumb_uri       AS photo_thumb_uri,
      p.grid_uri        AS photo_grid_uri,
      p.detail_uri      AS photo_detail_uri,
      p.backup_lite_uri AS photo_backup_lite_uri,
      p.created_at      AS photo_created_at
    FROM meals m
    LEFT JOIN photos p ON p.id = m.photo_id
    LEFT JOIN daily_health dh ON dh.date = m.date
  `;
  const sql = `${filterSelect} ${where} ORDER BY m.date DESC, m.meal_type ASC, m.created_at DESC`;

  const rows = await db.getAllAsync<MealRow>(sql, params);

  // Deduplicate: keep only the newest record per (date, meal_type)
  const seen = new Set<string>();
  const deduped: MealRow[] = [];
  for (const row of rows) {
    const key = `${row.date}:${row.meal_type}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(row);
    }
  }
  return deduped.map(rowToMeal);
}
