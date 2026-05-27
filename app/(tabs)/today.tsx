import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity,
} from 'react-native';
import { MealCard } from '@/components/MealCard';
import { FAB } from '@/components/FAB';
import { MealMetaModal } from '@/components/MealMetaModal';
import { AppText } from '@/components/AppText';
import { useTodayMeals } from '@/hooks/useTodayMeals';
import { usePhoto } from '@/hooks/usePhoto';
import { useSettingsStore } from '@/stores/settingsStore';
import { Meal, MealType, Mood, MealGrade } from '@/types';

type ActionSheetState = { visible: boolean; mealType?: MealType };
type MetaState = { visible: boolean; mealType: MealType; sourceUri: string };

export default function TodayScreen() {
  const { dayRecord, loading, addMealWithPhoto, deleteMealWithPhoto } = useTodayMeals();
  const { takePicture, pickFromLibrary } = usePhoto();
  const { pendingCameraOpen, clearPendingCameraOpen } = useSettingsStore();
  const [actionSheet, setActionSheet] = useState<ActionSheetState>({ visible: false });
  const [metaModal, setMetaModal] = useState<MetaState | null>(null);

  useEffect(() => {
    if (pendingCameraOpen) {
      setActionSheet({ visible: true, mealType: undefined });
      clearPendingCameraOpen();
    }
  }, [pendingCameraOpen, clearPendingCameraOpen]);

  async function handleCamera() {
    const mealType = actionSheet.mealType;
    setActionSheet({ visible: false });
    const uri = await takePicture();
    if (uri && mealType) setMetaModal({ visible: true, mealType, sourceUri: uri });
  }

  async function handleLibrary() {
    const mealType = actionSheet.mealType;
    setActionSheet({ visible: false });
    const uri = await pickFromLibrary();
    if (uri && mealType) setMetaModal({ visible: true, mealType, sourceUri: uri });
  }

  async function handleMetaConfirm(meta: {
    mood?: Mood; event?: string; grade?: MealGrade; note?: string;
  }) {
    if (!metaModal) return;
    await addMealWithPhoto(metaModal.mealType, metaModal.sourceUri, meta);
    setMetaModal(null);
  }

  function handleAdd(mealType: MealType) {
    setActionSheet({ visible: true, mealType });
  }

  function handleLongPress(_meal: Meal) {
    // share/delete options — stub for now
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
        <MealCard mealType="lunch" meal={dayRecord.lunch} onAdd={handleAdd} onLongPress={handleLongPress} />
        <MealCard mealType="dinner" meal={dayRecord.dinner} onAdd={handleAdd} onLongPress={handleLongPress} />
      </ScrollView>

      <FAB onPress={() => setActionSheet({ visible: true, mealType: undefined })} />

      <Modal
        visible={actionSheet.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionSheet({ visible: false })}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setActionSheet({ visible: false })}
        >
          <View style={styles.sheet}>
            <TouchableOpacity testID="action-camera" style={styles.action} onPress={handleCamera}>
              <AppText style={styles.actionText}>📷 拍照</AppText>
            </TouchableOpacity>
            <TouchableOpacity testID="action-library" style={styles.action} onPress={handleLibrary}>
              <AppText style={styles.actionText}>🖼️ 選取相簿</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              testID="action-cancel"
              style={[styles.action, styles.cancelAction]}
              onPress={() => setActionSheet({ visible: false })}
            >
              <AppText style={styles.cancelText}>取消</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
  scroll: { padding: 24, paddingBottom: 100 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  action: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  cancelAction: { marginTop: 8 },
  actionText: { fontSize: 16 },
  cancelText: { color: '#999' },
});
