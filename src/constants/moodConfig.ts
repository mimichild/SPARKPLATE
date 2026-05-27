import { Mood } from '@/types';

export const MOOD_CONFIG: Record<Mood, { label: string }> = {
  happy:   { label: '開心' },
  sad:     { label: '難過' },
  angry:   { label: '生氣' },
  neutral: { label: '普通' },
};

export const MOOD_LIST: Mood[] = ['happy', 'sad', 'angry', 'neutral'];

export const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch:     '午餐',
  dinner:    '晚餐',
};
