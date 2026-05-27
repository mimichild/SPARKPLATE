import { MealGrade } from '@/types';

export interface GradeInfo {
  label: string;
  desc: string;
  color: string;
}

export const GRADE_CONFIG: Record<MealGrade, GradeInfo> = {
  S: { label: 'S', desc: '原型食物',                          color: '#5BAD7A' },
  A: { label: 'A', desc: '普通食物',                          color: '#5A8FC9' },
  B: { label: 'B', desc: '加工食品 / 高精緻澱粉 / 含糖飲料', color: '#C97A3A' },
};

export const GRADE_LIST: MealGrade[] = ['S', 'A', 'B'];
