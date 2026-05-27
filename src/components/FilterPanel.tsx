import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FilterCriteria, Mood, MealGrade, MealType } from '@/types';
import { MOOD_CONFIG, MEAL_LABELS } from '@/constants/moodConfig';
import { AppText } from '@/components/AppText';

interface FilterPanelProps {
  criteria: FilterCriteria;
  onChange: (partial: Partial<FilterCriteria>) => void;
}

const MOODS: Mood[] = ['great', 'good', 'neutral', 'bad', 'terrible'];
const GRADES: MealGrade[] = [1, 2, 3, 4, 5];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

function toggle<T>(arr: T[] | undefined, item: T): T[] {
  if (!arr) return [item];
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function FilterPanel({ criteria, onChange }: FilterPanelProps) {
  return (
    <View style={styles.container} testID="filter-panel">
      <AppText style={styles.sectionLabel}>心情</AppText>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m}
            testID={`filter-mood-${m}`}
            style={[styles.chip, criteria.moods?.includes(m) ? styles.chipActive : null]}
            onPress={() => onChange({ moods: toggle(criteria.moods, m) })}
          >
            <AppText style={styles.chipText}>{MOOD_CONFIG[m].emoji}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      <AppText style={styles.sectionLabel}>等級</AppText>
      <View style={styles.row}>
        {GRADES.map((g) => (
          <TouchableOpacity
            key={g}
            testID={`filter-grade-${g}`}
            style={[styles.chip, criteria.grades?.includes(g) ? styles.chipActive : null]}
            onPress={() => onChange({ grades: toggle(criteria.grades, g) })}
          >
            <AppText style={styles.chipText}>{'⭐'.repeat(g)}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      <AppText style={styles.sectionLabel}>餐別</AppText>
      <View style={styles.row}>
        {MEAL_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            testID={`filter-mealtype-${t}`}
            style={[styles.chip, criteria.mealTypes?.includes(t) ? styles.chipActive : null]}
            onPress={() => onChange({ mealTypes: toggle(criteria.mealTypes, t) })}
          >
            <AppText style={styles.chipText}>{MEAL_LABELS[t]}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 8, marginTop: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#333' },
  chipText: { fontSize: 14 },
});
