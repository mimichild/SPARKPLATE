import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterPanel } from '@/components/FilterPanel';
import { FilterCriteria, Mood } from '@/types';

function renderPanel(criteria: Partial<FilterCriteria> = {}, onChange = jest.fn()) {
  return render(
    <FilterPanel
      visible={true}
      criteria={criteria}
      totalCount={0}
      onChange={onChange}
      onClear={jest.fn()}
      onClose={jest.fn()}
    />
  );
}

describe('FilterPanel', () => {
  it('renders mood chips', () => {
    const { getByTestId } = renderPanel();
    expect(getByTestId('filter-mood-happy')).toBeTruthy();
    expect(getByTestId('filter-mood-sad')).toBeTruthy();
  });

  it('calls onChange with selected mood', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderPanel({}, onChange);
    fireEvent.press(getByTestId('filter-mood-happy'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ moods: ['happy'] }));
  });

  it('toggles mood off when already selected', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderPanel({ moods: ['happy' as Mood] }, onChange);
    fireEvent.press(getByTestId('filter-mood-happy'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ moods: [] }));
  });

  it('calls onChange with selected grade', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderPanel({}, onChange);
    fireEvent.press(getByTestId('filter-grade-S'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ grades: ['S'] }));
  });

  it('calls onChange with selected mealType', () => {
    const onChange = jest.fn();
    const { getByTestId } = renderPanel({}, onChange);
    fireEvent.press(getByTestId('filter-mealtype-breakfast'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mealTypes: ['breakfast'] }));
  });
});
