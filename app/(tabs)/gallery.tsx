import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { GalleryCell } from '@/components/GalleryCell';
import { PhotoViewer } from '@/components/PhotoViewer';
import { AppText } from '@/components/AppText';
import { useGallery } from '@/hooks/useGallery';
import { DayRecord, Meal } from '@/types';

function mealsFromDay(day: DayRecord): Meal[] {
  return [day.breakfast, day.lunch, day.dinner].filter(Boolean) as Meal[];
}

export default function GalleryScreen() {
  const { days, loading, hasMore, loadMore } = useGallery();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const meals = days.flatMap(mealsFromDay).filter((m) => m.photo);

  if (loading && meals.length === 0) {
    return (
      <View style={styles.center}>
        <AppText>載入中…</AppText>
      </View>
    );
  }

  if (!loading && meals.length === 0) {
    return (
      <View style={styles.center}>
        <AppText style={styles.empty}>尚無紀錄</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={meals}
        numColumns={3}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <GalleryCell meal={item} onPress={setSelectedMeal} />
        )}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.3}
      />
      <PhotoViewer
        visible={selectedMeal !== null}
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 16, color: '#aaa' },
});
