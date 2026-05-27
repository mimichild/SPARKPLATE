import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { GalleryCell, GALLERY_CELL_HEIGHT } from '@/components/GalleryCell';
import { PhotoViewer } from '@/components/PhotoViewer';
import { FAB } from '@/components/FAB';
import { ImageEditModal } from '@/components/ImageEditModal';
import { MealMetaModal } from '@/components/MealMetaModal';
import { DailyHealthModal } from '@/components/DailyHealthModal';
import { AppText } from '@/components/AppText';
import { useGallery } from '@/hooks/useGallery';
import { useTodayMeals } from '@/hooks/useTodayMeals';
import { usePhoto } from '@/hooks/usePhoto';
import { useDailyHealth } from '@/hooks/useDailyHealth';
import { useSettingsStore } from '@/stores/settingsStore';
import { DayRecord, Meal, MealType, Mood, MealGrade } from '@/types';

type EditState = { visible: boolean; sourceUri: string };
type MetaState = { visible: boolean; sourceUri: string };

function mealsFromDay(day: DayRecord): Meal[] {
  return [day.breakfast, day.lunch, day.dinner].filter(Boolean) as Meal[];
}

function WaterDropIcon() {
  return (
    <View style={{ width: 22, height: 26, alignItems: 'center' }}>
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 10,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: '#fff',
      }} />
      <View style={{
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 2.5, borderColor: '#fff', marginTop: -2,
      }} />
    </View>
  );
}

function todayDate() { return new Date().toISOString().slice(0, 10); }

export default function GalleryScreen() {
  const { days, loading, hasMore, loadMore, reload } = useGallery();
  const { addMealWithPhoto } = useTodayMeals();
  const { takePicture, pickFromLibrary } = usePhoto();
  const { fontColor, pendingCameraOpen, clearPendingCameraOpen } = useSettingsStore();
  const today = todayDate();
  const { health: todayHealth, save: saveHealth } = useDailyHealth(today);

  const [selectedMeal,    setSelectedMeal]    = useState<Meal | null>(null);
  const [sheetVisible,    setSheetVisible]    = useState(false);
  const [editModal,       setEditModal]       = useState<EditState | null>(null);
  const [metaModal,       setMetaModal]       = useState<MetaState | null>(null);
  const [healthModal,     setHealthModal]     = useState(false);

  useEffect(() => {
    if (pendingCameraOpen) {
      setSheetVisible(true);
      clearPendingCameraOpen();
    }
  }, [pendingCameraOpen, clearPendingCameraOpen]);

  async function handleCamera() {
    setSheetVisible(false);
    const uri = await takePicture();
    if (uri) setEditModal({ visible: true, sourceUri: uri });
  }

  async function handleLibrary() {
    setSheetVisible(false);
    const uri = await pickFromLibrary();
    if (uri) setEditModal({ visible: true, sourceUri: uri });
  }

  function openMetaFromEdit(uri: string) {
    setMetaModal({ visible: true, sourceUri: uri });
    setEditModal(null);
  }

  async function handleMetaConfirm(meta: {
    mealType: MealType; mood?: Mood; event?: string; grade?: MealGrade; note?: string;
  }) {
    if (!metaModal) return;
    const { mealType, ...rest } = meta;
    await addMealWithPhoto(mealType, metaModal.sourceUri, rest);
    setMetaModal(null);
    reload();
  }

  const meals = days.flatMap(mealsFromDay).filter((m) => m.photo);

  return (
    <View style={styles.container}>
      {meals.length === 0 && !loading ? (
        <View style={styles.center}>
          <AppText style={styles.empty}>尚無紀錄，點擊右下角相機新增</AppText>
        </View>
      ) : (
        <FlashList
          data={meals}
          numColumns={3}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <GalleryCell meal={item} onPress={setSelectedMeal} />
          )}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          estimatedItemSize={GALLERY_CELL_HEIGHT}
        />
      )}

      {/* Water drop FAB */}
      <TouchableOpacity
        style={[styles.waterFab, { backgroundColor: fontColor }]}
        onPress={() => setHealthModal(true)}
        activeOpacity={0.8}
      >
        <WaterDropIcon />
      </TouchableOpacity>

      <FAB onPress={() => setSheetVisible(true)} />

      {/* ── Photo viewer ── */}
      <PhotoViewer
        visible={selectedMeal !== null}
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
      />

      {/* ── Source action sheet ── */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSheetVisible(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSheetVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.action} onPress={handleCamera}>
              <AppText style={styles.actionText}>📷 拍照</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={handleLibrary}>
              <AppText style={styles.actionText}>🖼️ 從相簿選取</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Image edit modal ── */}
      {editModal && (
        <ImageEditModal
          visible={editModal.visible}
          sourceUri={editModal.sourceUri}
          onConfirm={(uri) => openMetaFromEdit(uri)}
          onSkip={() => openMetaFromEdit(editModal.sourceUri)}
        />
      )}

      {/* ── Meal meta modal ── */}
      {metaModal && (
        <MealMetaModal
          visible={metaModal.visible}
          onConfirm={handleMetaConfirm}
          onCancel={() => setMetaModal(null)}
        />
      )}

      {/* ── Daily health modal ── */}
      <DailyHealthModal
        visible={healthModal}
        date={today}
        existing={todayHealth}
        onConfirm={async (data) => { await saveHealth(data); setHealthModal(false); }}
        onCancel={() => setHealthModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 16, color: '#aaa' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  sheetHeader: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: '#aaa', fontWeight: '600' },
  action: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  actionText: { fontSize: 16 },
  cancelText: { color: '#999' },
  waterFab: {
    position: 'absolute', bottom: 100, right: 24,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
});
