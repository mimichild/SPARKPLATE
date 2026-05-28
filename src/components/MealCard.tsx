import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Meal, MealType } from '@/types';
import { MEAL_LABELS } from '@/constants/moodConfig';
import { FaceIcon } from '@/components/FaceIcon';
import { AppText } from '@/components/AppText';
import { useSettingsStore } from '@/stores/settingsStore';

const THUMB_SIZE = 72;

interface MealCardProps {
  mealType: MealType;
  meal?: Meal;
  onAdd: (mealType: MealType) => void;
  onLongPress?: (meal: Meal) => void;
}

function formatDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export function MealCard({ mealType, meal, onAdd, onLongPress }: MealCardProps) {
  const label = MEAL_LABELS[mealType] ?? mealType;
  const dateStr = formatDate(meal?.date);
  const { fontColor } = useSettingsStore();

  return (
    <View style={styles.row}>
      {/* Left: meal type label */}
      <View style={styles.labelCol}>
        <AppText style={[styles.label, { color: fontColor }]}>{label}</AppText>
      </View>

      {/* Center: photo thumbnail */}
      {meal?.photo ? (
        <TouchableOpacity
          testID="meal-card-image"
          activeOpacity={0.9}
          onLongPress={() => onLongPress?.(meal)}
        >
          <Image
            source={{ uri: meal.photo.detailUri }}
            style={styles.thumb}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          testID="meal-card-placeholder"
          activeOpacity={0.9}
          onPress={() => onAdd(mealType)}
          style={[styles.thumb, styles.placeholder]}
        />
      )}

      {/* Right: date + meta info */}
      <View style={styles.infoCol}>
        <AppText style={styles.date}>{dateStr}</AppText>
        <View style={styles.metaRow}>
          {meal?.mood ? <View testID="meal-mood-icon"><FaceIcon mood={meal.mood} size={20} /></View> : null}
          {meal?.grade ? (
            <Text style={styles.grade}>{meal.grade}</Text>
          ) : null}
        </View>
        {meal?.event ? (
          <AppText style={styles.event} numberOfLines={2}>{meal.event}</AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  labelCol: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  infoCol: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  grade: {
    fontSize: 13,
    fontWeight: '700',
    color: '#777',
  },
  event: {
    fontSize: 12,
    color: '#777',
  },
});
