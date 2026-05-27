import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterPanel } from '@/components/FilterPanel';
import { FilterCriteria } from '@/types';

describe('FilterPanel', () => {
  it('renders mood chips', () => {
    const { getByTestId } = render(
      <FilterPanel criteria={{}} onChange={jest.fn()} />
    );
    expect(getByTestId('filter-mood-good')).toBeTruthy();
    expect(getByTestId('filter-mood-great')).toBeTruthy();
  });

  it('calls onChange with selected mood', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <FilterPanel criteria={{}} onChange={onChange} />
    );
    fireEvent.press(getByTestId('filter-mood-good'));
    expect(onChange).toHaveBeenCalledWith({ moods: ['good'] });
  });

  it('toggles mood off when already selected', () => {
    const criteria: FilterCriteria = { moods: ['good'] };
    const onChange = jest.fn();
    const { getByTestId } = render(
      <FilterPanel criteria={criteria} onChange={onChange} />
    );
    fireEvent.press(getByTestId('filter-mood-good'));
    expect(onChange).toHaveBeenCalledWith({ moods: [] });
  });

  it('calls onChange with selected grade', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <FilterPanel criteria={{}} onChange={onChange} />
    );
    fireEvent.press(getByTestId('filter-grade-5'));
    expect(onChange).toHaveBeenCalledWith({ grades: [5] });
  });

  it('calls onChange with selected mealType', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <FilterPanel criteria={{}} onChange={onChange} />
    );
    fireEvent.press(getByTestId('filter-mealtype-breakfast'));
    expect(onChange).toHaveBeenCalledWith({ mealTypes: ['breakfast'] });
  });
});
