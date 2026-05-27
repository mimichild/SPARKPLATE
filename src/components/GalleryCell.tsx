import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet, Dimensions } from 'react-native';
import { Meal } from '@/types';
import { MEAL_LABELS } from '@/constants/moodConfig';

const CELL_SIZE = Math.floor(Dimensions.get('window').width / 3);
export const GALLERY_CELL_HEIGHT = CELL_SIZE + 36;

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

interface GalleryCellProps {
  meal: Meal;
  onPress: (meal: Meal) => void;
}

export function GalleryCell({ meal, onPress }: GalleryCellProps) {
  return (
    <TouchableOpacity
      testID={`gallery-cell-${meal.id}`}
      style={styles.cell}
      onPress={() => onPress(meal)}
      activeOpacity={0.85}
    >
      {/* Photo */}
      {meal.photo ? (
        <Image source={{ uri: meal.photo.gridUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.empty]} />
      )}

      {/* Info area */}
      <View style={styles.info}>
        <Text style={styles.date}>{formatDate(meal.date)}</Text>
        <Text style={styles.mealType}>{MEAL_LABELS[meal.mealType]}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: { width: CELL_SIZE, height: GALLERY_CELL_HEIGHT },
  image: { width: CELL_SIZE, height: CELL_SIZE },
  empty: { backgroundColor: '#eee' },
  info: { height: 36, paddingHorizontal: 5, paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11, color: '#111', fontWeight: '600' },
  mealType: { fontSize: 11, color: '#777' },
});
