import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FilterPanel } from '@/components/FilterPanel';
import { GalleryCell } from '@/components/GalleryCell';
import { PhotoViewer } from '@/components/PhotoViewer';
import { AppText } from '@/components/AppText';
import { useFilter } from '@/hooks/useFilter';
import { Meal } from '@/types';

export default function FilterScreen() {
  const { criteria, results, loading, totalCount, setCriteria } = useFilter();
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  return (
    <View style={styles.container}>
      <FilterPanel criteria={criteria} onChange={setCriteria} />

      <View style={styles.countRow}>
        {loading ? (
          <AppText style={styles.countText}>載入中…</AppText>
        ) : (
          <AppText style={styles.countText}>共 {totalCount} 筆</AppText>
        )}
      </View>

      {!loading && results.length === 0 && (
        <View style={styles.center}>
          <AppText style={styles.empty}>沒有符合的紀錄</AppText>
        </View>
      )}

      {results.length > 0 && (
        <FlashList
          data={results}
          numColumns={3}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <GalleryCell meal={item} onPress={setSelectedMeal} />
          )}
        />
      )}

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
  countRow: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  countText: { fontSize: 13, color: '#888' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 16, color: '#aaa' },
});
