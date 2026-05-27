import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet, Dimensions } from 'react-native';
import { Meal } from '@/types';
import { MOOD_CONFIG } from '@/constants/moodConfig';

const CELL_SIZE = Dimensions.get('window').width / 3;

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
      {meal.photo ? (
        <Image source={{ uri: meal.photo.gridUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.empty]} />
      )}
      <View style={styles.overlay}>
        {meal.mood && <Text style={styles.emoji}>{MOOD_CONFIG[meal.mood].emoji}</Text>}
        {meal.grade && <Text style={styles.grade}>{meal.grade}⭐</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: { width: CELL_SIZE, height: CELL_SIZE },
  image: { width: '100%', height: '100%' },
  empty: { backgroundColor: '#eee' },
  overlay: {
    position: 'absolute', bottom: 4, right: 4,
    flexDirection: 'row', gap: 2,
  },
  emoji: { fontSize: 12 },
  grade: { fontSize: 10, color: '#fff' },
});
