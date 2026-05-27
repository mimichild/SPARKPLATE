import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity,
} from 'react-native';
import { MealCard } from '@/components/MealCard';
import { FAB } from '@/components/FAB';
import { MealMetaModal } from '@/components/MealMetaModal';
import { ImageEditModal } from '@/components/ImageEditModal';
import { AppText } from '@/components/AppText';
import { useTodayMeals } from '@/hooks/useTodayMeals';
import { usePhoto } from '@/hooks/usePhoto';
import { useSettingsStore } from '@/stores/settingsStore';
import { Meal, MealType, Mood, MealGrade } from '@/types';

type EditState = { visible: boolean; sourceUri: string };
type MetaState = { visible: boolean; sourceUri: string };

export default function TodayScreen() {
  const { dayRecord, loading, addMealWithPhoto, deleteMealWithPhoto } = useTodayMeals();
  const { takePicture, pickFromLibrary } = usePhoto();
  const { pendingCameraOpen, clearPendingCameraOpen } = useSettingsStore();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editModal,    setEditModal]    = useState<EditState | null>(null);
  const [metaModal,    setMetaModal]    = useState<MetaState | null>(null);

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
  }

  function handleLongPress(_meal: Meal) {
    // share/delete — stub
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <AppText>載入中…</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <MealCard mealType="breakfast" meal={dayRecord.breakfast} onAdd={() => setSheetVisible(true)} onLongPress={handleLongPress} />
        <MealCard mealType="lunch"     meal={dayRecord.lunch}     onAdd={() => setSheetVisible(true)} onLongPress={handleLongPress} />
        <MealCard mealType="dinner"    meal={dayRecord.dinner}    onAdd={() => setSheetVisible(true)} onLongPress={handleLongPress} />
      </ScrollView>

      <FAB onPress={() => setSheetVisible(true)} />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 100 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  sheetHeader: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: '#aaa', fontWeight: '600' },
  action: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  actionText: { fontSize: 16 },
  cancelText: { color: '#999' },
});
