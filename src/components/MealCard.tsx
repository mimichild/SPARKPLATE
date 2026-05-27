import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Meal, MealType } from '@/types';
import { MOOD_CONFIG, MEAL_LABELS } from '@/constants/moodConfig';
import { AppText } from '@/components/AppText';

const CARD_SIZE = Dimensions.get('window').width - 48;

interface MealCardProps {
  mealType: MealType;
  meal?: Meal;
  onAdd: (mealType: MealType) => void;
  onLongPress?: (meal: Meal) => void;
}

export function MealCard({ mealType, meal, onAdd, onLongPress }: MealCardProps) {
  const label = MEAL_LABELS[mealType] ?? mealType;

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>{label}</AppText>
      {meal?.photo ? (
        <TouchableOpacity
          testID="meal-card-image"
          activeOpacity={0.9}
          onLongPress={() => onLongPress?.(meal)}
        >
          <Image
            source={{ uri: meal.photo.detailUri }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.meta}>
            {meal.mood && (
              <Text style={styles.emoji}>{MOOD_CONFIG[meal.mood].emoji}</Text>
            )}
            {meal.event ? (
              <AppText style={styles.event} numberOfLines={1}>{meal.event}</AppText>
            ) : null}
            {meal.grade ? (
              <Text style={styles.grade}>{'⭐'.repeat(meal.grade)}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          testID="meal-card-placeholder"
          style={styles.placeholder}
          onPress={() => onAdd(mealType)}
          activeOpacity={0.7}
        >
          <AppText style={styles.plus}>＋</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  image: { width: CARD_SIZE, height: CARD_SIZE, borderRadius: 12 },
  placeholder: {
    width: CARD_SIZE, height: CARD_SIZE, borderRadius: 12,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
  },
  plus: { fontSize: 40, color: '#bbb' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  emoji: { fontSize: 16 },
  event: { fontSize: 12, color: '#666', flex: 1 },
  grade: { fontSize: 11 },
});
