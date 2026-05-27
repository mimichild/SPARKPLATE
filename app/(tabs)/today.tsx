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

type SheetStep = 'meal' | 'photo';
type ActionSheetState = { visible: boolean; step: SheetStep; mealType?: MealType };
type EditState  = { visible: boolean; mealType: MealType; sourceUri: string };
type MetaState  = { visible: boolean; mealType: MealType; sourceUri: string };

export default function TodayScreen() {
  const { dayRecord, loading, addMealWithPhoto, deleteMealWithPhoto } = useTodayMeals();
  const { takePicture, pickFromLibrary } = usePhoto();
  const { pendingCameraOpen, clearPendingCameraOpen } = useSettingsStore();
  const [actionSheet, setActionSheet] = useState<ActionSheetState>({ visible: false, step: 'meal' });
  const [editModal,  setEditModal]  = useState<EditState | null>(null);
  const [metaModal,  setMetaModal]  = useState<MetaState | null>(null);

  useEffect(() => {
    if (pendingCameraOpen) {
      setActionSheet({ visible: true, step: 'meal', mealType: undefined });
      clearPendingCameraOpen();
    }
  }, [pendingCameraOpen, clearPendingCameraOpen]);

  async function handleCamera() {
    const mealType = actionSheet.mealType;
    setActionSheet({ visible: false, step: 'meal' });
    const uri = await takePicture();
    if (uri && mealType) setEditModal({ visible: true, mealType, sourceUri: uri });
  }

  async function handleLibrary() {
    const mealType = actionSheet.mealType;
    setActionSheet({ visible: false, step: 'meal' });
    const uri = await pickFromLibrary();
    if (uri && mealType) setEditModal({ visible: true, mealType, sourceUri: uri });
  }

  function openMetaFromEdit(mealType: MealType, uri: string) {
    setMetaModal({ visible: true, mealType, sourceUri: uri });
    setEditModal(null);
  }

  async function handleMetaConfirm(meta: {
    mood?: Mood; event?: string; grade?: MealGrade; note?: string;
  }) {
    if (!metaModal) return;
    await addMealWithPhoto(metaModal.mealType, metaModal.sourceUri, meta);
    setMetaModal(null);
  }

  function handleSelectMeal(mealType: MealType) {
    setActionSheet({ visible: true, step: 'photo', mealType });
  }

  function handleAdd(mealType: MealType) {
    setActionSheet({ visible: true, step: 'photo', mealType });
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
        <MealCard mealType="breakfast" meal={dayRecord.breakfast} onAdd={handleAdd} onLongPress={handleLongPress} />
        <MealCard mealType="lunch"     meal={dayRecord.lunch}     onAdd={handleAdd} onLongPress={handleLongPress} />
        <MealCard mealType="dinner"    meal={dayRecord.dinner}    onAdd={handleAdd} onLongPress={handleLongPress} />
      </ScrollView>

      <FAB onPress={() => setActionSheet({ visible: true, step: 'meal', mealType: undefined })} />

      {/* ── Action sheet ── */}
      <Modal
        visible={actionSheet.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionSheet({ visible: false, step: 'meal' })}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setActionSheet({ visible: false, step: 'meal' })}
        >
          <View style={styles.sheet}>
            {actionSheet.step === 'meal' ? (
              <>
                <TouchableOpacity testID="action-breakfast" style={styles.action} onPress={() => handleSelectMeal('breakfast')}>
                  <AppText style={styles.actionText}>🌅 早餐</AppText>
                </TouchableOpacity>
                <TouchableOpacity testID="action-lunch" style={styles.action} onPress={() => handleSelectMeal('lunch')}>
                  <AppText style={styles.actionText}>☀️ 午餐</AppText>
                </TouchableOpacity>
                <TouchableOpacity testID="action-dinner" style={styles.action} onPress={() => handleSelectMeal('dinner')}>
                  <AppText style={styles.actionText}>🌙 晚餐</AppText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity testID="action-camera" style={styles.action} onPress={handleCamera}>
                  <AppText style={styles.actionText}>📷 拍照</AppText>
                </TouchableOpacity>
                <TouchableOpacity testID="action-library" style={styles.action} onPress={handleLibrary}>
                  <AppText style={styles.actionText}>🖼️ 選取相簿</AppText>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              testID="action-cancel"
              style={[styles.action, styles.cancelAction]}
              onPress={() => setActionSheet({ visible: false, step: 'meal' })}
            >
              <AppText style={styles.cancelText}>取消</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Image edit modal ── */}
      {editModal && (
        <ImageEditModal
          visible={editModal.visible}
          sourceUri={editModal.sourceUri}
          onConfirm={(uri) => openMetaFromEdit(editModal.mealType, uri)}
          onSkip={() => openMetaFromEdit(editModal.mealType, editModal.sourceUri)}
        />
      )}

      {/* ── Meal meta modal ── */}
      {metaModal && (
        <MealMetaModal
          visible={metaModal.visible}
          mealType={metaModal.mealType}
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
  action: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  cancelAction: { marginTop: 8 },
  actionText: { fontSize: 16 },
  cancelText: { color: '#999' },
});
