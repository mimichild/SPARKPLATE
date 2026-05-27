export interface ThemeColor {
  name: string;
  value: string;
}

export const THEME_COLORS: ThemeColor[] = [
  { name: '墨黑',          value: '#111111' },
  { name: '岩石灰',        value: '#6B7280' },
  { name: '海洋藍',        value: '#3B82F6' },
  { name: '薰衣紫',        value: '#7C3AED' },
  { name: 'Mocha Mousse', value: '#A47764' }, // Pantone 2025
  { name: 'Blush Pink',   value: '#f5baba' }, // user-specified
  { name: '翡翠綠',        value: '#10B981' },
  { name: '夕陽橙',        value: '#F97316' },
  { name: '玫瑰紅',        value: '#EC4899' },
  { name: '青瓷藍',        value: '#06B6D4' },
];

export const DEFAULT_FONT_COLOR = '#111111';
