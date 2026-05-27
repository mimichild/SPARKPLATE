export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type Mood = 'happy' | 'sad' | 'angry' | 'neutral';

export type MealGrade = 'S' | 'A' | 'B';

export type PhotoSize = 'thumb' | 'grid' | 'detail' | 'backup-lite';

export interface Photo {
  id: string;
  thumbUri: string;
  gridUri: string;
  detailUri: string;
  backupLiteUri: string;
  originalUri?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface Meal {
  id: string;
  date: string;
  mealType: MealType;
  photoId?: string;
  photo?: Photo;
  mood?: Mood;
  event?: string;
  grade?: MealGrade;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayRecord {
  date: string;
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
}

export interface DailyHealth {
  date: string;
  waterMl?: number;
  sleepHours?: number;
  snack?: string;
  lateNight?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterCriteria {
  startDate?: string;
  endDate?: string;
  moods?: Mood[];
  grades?: MealGrade[];
  mealTypes?: MealType[];
  minWaterMl?: number;
  minSleepHours?: number;
  hasSnack?: boolean;
  hasLateNight?: boolean;
}

export interface AppSettings {
  skipSplash: boolean;
  openCameraOnStart: boolean;
}

export interface PhotoSizeConfig {
  width: number;
  height: number;
  quality: number;
}

export const PHOTO_SIZE_CONFIG: Record<PhotoSize, PhotoSizeConfig> = {
  thumb: { width: 120, height: 120, quality: 0.8 },
  grid: { width: 400, height: 400, quality: 0.85 },
  detail: { width: 800, height: 800, quality: 0.9 },
  'backup-lite': { width: 600, height: 600, quality: 0.6 },
};
