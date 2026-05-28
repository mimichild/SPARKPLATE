import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { FilterCriteria, Mood, MealGrade, MealType } from '@/types';
import { MOOD_CONFIG, MOOD_LIST, MEAL_LABELS } from '@/constants/moodConfig';
import { GRADE_CONFIG, GRADE_LIST } from '@/constants/gradeConfig';
import { FaceIcon } from '@/components/FaceIcon';
import { AppText } from '@/components/AppText';
import { useSettingsStore } from '@/stores/settingsStore';

interface FilterPanelProps {
  criteria: FilterCriteria;
  onChange: (partial: Partial<FilterCriteria>) => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

function toggle<T>(arr: T[] | undefined, item: T): T[] {
  if (!arr) return [item];
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function FilterPanel({ criteria, onChange }: FilterPanelProps) {
  const { fontColor } = useSettingsStore();

  return (
    <View style={styles.container} testID="filter-panel">

      {/* ── 心情 ── */}
      <AppText style={styles.sectionLabel}>心情</AppText>
      <View style={styles.row}>
        {MOOD_LIST.map((m) => {
          const active = criteria.moods?.includes(m) ?? false;
          return (
            <TouchableOpacity
              key={m}
              testID={`filter-mood-${m}`}
              style={[styles.moodChip, active && { backgroundColor: fontColor }]}
              onPress={() => onChange({ moods: toggle(criteria.moods, m) })}
              activeOpacity={0.75}
            >
              <FaceIcon mood={m} size={32} />
              <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>
                {MOOD_CONFIG[m].label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 等級 ── */}
      <AppText style={styles.sectionLabel}>等級</AppText>
      <View style={styles.gradeRow}>
        {GRADE_LIST.map((g) => {
          const info = GRADE_CONFIG[g];
          const active = criteria.grades?.includes(g) ?? false;
          return (
            <TouchableOpacity
              key={g}
              testID={`filter-grade-${g}`}
              style={[styles.gradeChip, active && { backgroundColor: info.color, borderColor: info.color }]}
              onPress={() => onChange({ grades: toggle(criteria.grades, g) })}
              activeOpacity={0.75}
            >
              <Text style={[styles.gradeLabel, active && styles.gradeLabelActive]}>{info.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 餐別 ── */}
      <AppText style={styles.sectionLabel}>餐別</AppText>
      <View style={styles.row}>
        {MEAL_TYPES.map((t) => {
          const active = criteria.mealTypes?.includes(t) ?? false;
          return (
            <TouchableOpacity
              key={t}
              testID={`filter-mealtype-${t}`}
              style={[styles.chip, active && { backgroundColor: fontColor }]}
              onPress={() => onChange({ mealTypes: toggle(criteria.mealTypes, t) })}
              activeOpacity={0.75}
            >
              <AppText style={[styles.chipText, active && styles.chipTextActive]}>
                {MEAL_LABELS[t]}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 飲水量 ── */}
      <AppText style={styles.sectionLabel}>💧 飲水量（至少）</AppText>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.filterInput}
          value={criteria.minWaterMl != null ? String(criteria.minWaterMl) : ''}
          onChangeText={(t) => {
            const v = t.replace(/[^0-9]/g, '');
            onChange({ minWaterMl: v ? parseInt(v, 10) : undefined });
          }}
          placeholder="ml"
          placeholderTextColor="#bbb"
          keyboardType="numeric"
        />
        <Text style={styles.inputUnit}>ml</Text>
        {criteria.minWaterMl != null && (
          <TouchableOpacity onPress={() => onChange({ minWaterMl: undefined })}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── 睡眠時長 ── */}
      <AppText style={styles.sectionLabel}>😴 睡眠時長（至少）</AppText>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.filterInput}
          value={criteria.minSleepHours != null ? String(criteria.minSleepHours) : ''}
          onChangeText={(t) => {
            const v = t.replace(/[^0-9.]/g, '');
            onChange({ minSleepHours: v ? parseFloat(v) : undefined });
          }}
          placeholder="小時"
          placeholderTextColor="#bbb"
          keyboardType="decimal-pad"
        />
        <Text style={styles.inputUnit}>小時</Text>
        {criteria.minSleepHours != null && (
          <TouchableOpacity onPress={() => onChange({ minSleepHours: undefined })}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── 飲料或點心 / 宵夜 ── */}
      <AppText style={styles.sectionLabel}>其他篩選</AppText>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.chip, criteria.hasSnack && { backgroundColor: fontColor }]}
          onPress={() => onChange({ hasSnack: criteria.hasSnack ? undefined : true })}
          activeOpacity={0.75}
        >
          <AppText style={[styles.chipText, criteria.hasSnack && styles.chipTextActive]}>
            🧋 有飲料或點心
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, criteria.hasLateNight && { backgroundColor: fontColor }]}
          onPress={() => onChange({ hasLateNight: criteria.hasLateNight ? undefined : true })}
          activeOpacity={0.75}
        >
          <AppText style={[styles.chipText, criteria.hasLateNight && styles.chipTextActive]}>
            🌙 有宵夜
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 8, marginTop: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

  // Mood chips
  moodChip: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14, backgroundColor: '#f5f5f5', minWidth: 60,
  },
  moodLabel: { fontSize: 11, color: '#888', marginTop: 5 },
  moodLabelActive: { color: '#fff' },

  // Grade chips
  gradeRow: { flexDirection: 'row', gap: 10 },
  gradeChip: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f5f5f5', borderWidth: 2, borderColor: '#eee',
  },
  gradeLabel: { fontSize: 18, fontWeight: '800', color: '#aaa' },
  gradeLabelActive: { color: '#fff' },

  // Meal type chips
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipText: { fontSize: 14, color: '#555' },
  chipTextActive: { color: '#fff' },

  // Health filters
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterInput: {
    width: 100, borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#333',
  },
  inputUnit: { fontSize: 13, color: '#888' },
  clearBtn: { fontSize: 14, color: '#aaa', paddingHorizontal: 4 },
});
