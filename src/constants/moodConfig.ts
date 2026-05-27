import { Mood } from '@/types';

export const MOOD_CONFIG: Record<Mood, { label: string; emoji: string }> = {
  great: { label: '很棒', emoji: '😄' },
  good: { label: '不錯', emoji: '🙂' },
  neutral: { label: '普通', emoji: '😐' },
  bad: { label: '不好', emoji: '😕' },
  terrible: { label: '很差', emoji: '😞' },
};

export const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
};
