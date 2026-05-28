import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FilterPanel, buildActiveChips } from '@/components/FilterPanel';
import { GalleryCell, GALLERY_CELL_HEIGHT } from '@/components/GalleryCell';
import { PhotoViewer } from '@/components/PhotoViewer';
import { AppText } from '@/components/AppText';
import { useFilter } from '@/hooks/useFilter';
import { useSettingsStore } from '@/stores/settingsStore';
import { Meal } from '@/types';

const CELL_SIZE = Math.floor(Dimensions.get('window').width / 3);

function groupMealsByDate(meals: Meal[]): (Meal | null)[] {
  const byDate: Record<string, { breakfast?: Meal; lunch?: Meal; dinner?: Meal }> = {};
  for (const meal of meals) {
    if (!byDate[meal.date]) byDate[meal.date] = {};
    byDate[meal.date][meal.mealType] = meal;
  }
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const cells: (Meal | null)[] = [];
  for (const date of sortedDates) {
    const day = byDate[date];
    cells.push(day.breakfast ?? null, day.lunch ?? null, day.dinner ?? null);
  }
  return cells;
}

export default function FilterScreen() {
  const { criteria, results, loading, totalCount, setCriteria, clearCriteria, reload } = useFilter();
  const groupedData = groupMealsByDate(results);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const { fontColor, pendingFilterOpen, clearPendingFilterOpen } = useSettingsStore();

  // Open filter panel when triggered from BackHeader
  useEffect(() => {
    if (pendingFilterOpen) {
      setFilterOpen(true);
      clearPendingFilterOpen();
    }
  }, [pendingFilterOpen, clearPendingFilterOpen]);

  const activeChips = buildActiveChips(criteria, setCriteria);

  return (
    <View style={styles.container}>

      {/* ── 計數列 + 已選 chip ── */}
      <View style={styles.topBar}>
        <View style={styles.countRow}>
          <AppText style={styles.countText}>
            {loading ? '載入中…' : `共 ${totalCount} 筆`}
          </AppText>
          {activeChips.length > 0 && (
            <TouchableOpacity onPress={clearCriteria} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={styles.clearAllText}>清除全部</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeChips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {activeChips.map((chip) => (
              <View key={chip.key} style={[styles.activeChip, { borderColor: fontColor }]}>
                <Text style={[styles.activeChipText, { color: fontColor }]}>{chip.label}</Text>
                <TouchableOpacity onPress={chip.onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={[styles.activeChipX, { color: fontColor }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── 照片結果 ── */}
      {!loading && results.length === 0 ? (
        <View style={styles.center}>
          <AppText style={styles.empty}>沒有符合的紀錄</AppText>
        </View>
      ) : (
        <FlashList
          data={groupedData}
          numColumns={3}
          keyExtractor={(item, index) => item ? item.id : `empty-${index}`}
          renderItem={({ item }) =>
            item ? (
              <GalleryCell meal={item} onPress={setSelectedMeal} />
            ) : (
              <View style={styles.emptyCell} />
            )
          }
          estimatedItemSize={GALLERY_CELL_HEIGHT}
        />
      )}

      {/* ── 篩選面板 Modal ── */}
      <FilterPanel
        visible={filterOpen}
        criteria={criteria}
        totalCount={totalCount}
        onChange={setCriteria}
        onClear={clearCriteria}
        onClose={() => setFilterOpen(false)}
      />

      {/* ── 照片大圖 ── */}
      <PhotoViewer
        visible={selectedMeal !== null}
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onMealUpdated={(updated) => setSelectedMeal(updated)}
        onMealDeleted={() => { setSelectedMeal(null); reload(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: { fontSize: 13, color: '#888' },
  clearAllText: { fontSize: 13, color: '#aaa' },

  chipsRow: { flexDirection: 'row', gap: 8, paddingTop: 8, paddingBottom: 2 },
  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1.5, backgroundColor: '#fafafa',
  },
  activeChipText: { fontSize: 12, fontWeight: '600' },
  activeChipX: { fontSize: 11 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 16, color: '#aaa' },
  emptyCell: { width: CELL_SIZE, height: GALLERY_CELL_HEIGHT },
});
