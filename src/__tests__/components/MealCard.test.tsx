import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MealCard } from '@/components/MealCard';
import { Meal } from '@/types';

const MOCK_MEAL: Meal = {
  id: 'meal-1',
  date: '2026-05-26',
  mealType: 'lunch',
  mood: 'good',
  event: '工作午餐',
  grade: 4,
  photo: {
    id: 'photo-1',
    thumbUri: '/thumb.jpg',
    gridUri: '/grid.jpg',
    detailUri: '/detail.jpg',
    backupLiteUri: '/backup.jpg',
    createdAt: '2026-05-26T12:00:00.000Z',
  },
  createdAt: '2026-05-26T12:00:00.000Z',
  updatedAt: '2026-05-26T12:00:00.000Z',
};

describe('MealCard', () => {
  it('renders placeholder when no meal provided', () => {
    const { getByTestId } = render(
      <MealCard mealType="breakfast" onAdd={jest.fn()} />
    );
    expect(getByTestId('meal-card-placeholder')).toBeTruthy();
  });

  it('renders image when meal has photo', () => {
    const { getByTestId } = render(
      <MealCard mealType="lunch" meal={MOCK_MEAL} onAdd={jest.fn()} />
    );
    expect(getByTestId('meal-card-image')).toBeTruthy();
  });

  it('calls onAdd with mealType when placeholder tapped', () => {
    const onAdd = jest.fn();
    const { getByTestId } = render(
      <MealCard mealType="breakfast" onAdd={onAdd} />
    );
    fireEvent.press(getByTestId('meal-card-placeholder'));
    expect(onAdd).toHaveBeenCalledWith('breakfast');
  });

  it('displays mood emoji when meal has mood', () => {
    const { getByText } = render(
      <MealCard mealType="lunch" meal={MOCK_MEAL} onAdd={jest.fn()} />
    );
    expect(getByText('🙂')).toBeTruthy();
  });

  it('calls onLongPress when card is long-pressed', () => {
    const onLongPress = jest.fn();
    const { getByTestId } = render(
      <MealCard mealType="lunch" meal={MOCK_MEAL} onAdd={jest.fn()} onLongPress={onLongPress} />
    );
    fireEvent(getByTestId('meal-card-image'), 'longPress');
    expect(onLongPress).toHaveBeenCalledWith(MOCK_MEAL);
  });
});
