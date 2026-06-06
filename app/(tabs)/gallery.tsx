import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Image, ToastAndroid,
} from 'react-native';
import { captureRef, captureScreen } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { FlashList } from '@shopify/flash-list';
import { GalleryCell, GALLERY_CELL_HEIGHT } from '@/components/GalleryCell';
import { PhotoViewer } from '@/components/PhotoViewer';
import { FAB } from '@/components/FAB';
import { ImageEditModal } from '@/components/ImageEditModal';
import { MealMetaModal } from '@/components/MealMetaModal';
import { DailyHealthModal } from '@/components/DailyHealthModal';
import { ExportModal, CollageGrid } from '@/components/ExportModal';
import { CameraLaunchModal } from '@/components/CameraLaunchModal';
import { AppText } from '@/components/AppText';
import { useGallery } from '@/hooks/useGallery';
import { useTodayMeals } from '@/hooks/useTodayMeals';
import { usePhoto } from '@/hooks/usePhoto';
import { useDB } from '@/hooks/useDB';
import { useSettingsStore } from '@/stores/settingsStore';
import { getMealsByDateRange } from '@/services/mealService';
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
        backgroundColor: '#fff', marginTop: -2,
      }} />
    </View>
  );
}

function todayDate() { return new Date().toISOString().slice(0, 10); }

export default function GalleryScreen() {
  const { days, loading, hasMore, loadMore, reload } = useGallery();
  const { addMealWithPhoto } = useTodayMeals();
  const { pickFromLibrary } = usePhoto();
  const { fontColor, pendingCameraOpen, clearPendingCameraOpen, pendingExportOpen, clearPendingExportOpen, pendingScreenshot, clearPendingScreenshot } = useSettingsStore();
  const db = useDB();
  const today = todayDate();

  const [selectedMeal,     setSelectedMeal]     = useState<Meal | null>(null);
  const [sheetVisible,     setSheetVisible]     = useState(false);
  const [cameraLaunch,     setCameraLaunch]     = useState(false);
  const [editModal,        setEditModal]        = useState<EditState | null>(null);
  const [metaModal,     setMetaModal]     = useState<MetaState | null>(null);
  const [healthModal,   setHealthModal]   = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [gridDays,      setGridDays]      = useState<DayRecord[]>([]);
  const [fabsHidden,    setFabsHidden]    = useState(false);
  const gridRef    = useRef<View | null>(null);
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleFabLongPress() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setFabsHidden(true);
    ToastAndroid.show('按鈕已隱藏，8秒後自動恢復', ToastAndroid.SHORT);
    hideTimer.current = setTimeout(() => setFabsHidden(false), 8000);
  }

  async function handleScreenshotCapture() {
    // 1. 請求相簿寫入權限
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      ToastAndroid.show('請允許存取相簿權限', ToastAndroid.SHORT);
      return;
    }
    // 2. 隱藏按鈕
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setFabsHidden(true);
    // 3. 等待畫面更新（200ms 確保按鈕消失後再截圖）
    await new Promise(r => setTimeout(r, 200));
    try {
      const uri = await captureScreen({ format: 'jpg', quality: 0.95 });
      await MediaLibrary.saveToLibraryAsync(uri);
      ToastAndroid.show('截圖已儲存到相簿', ToastAndroid.SHORT);
    } catch {
      ToastAndroid.show('截圖失敗，請重試', ToastAndroid.SHORT);
    } finally {
      // 4. 3 秒後恢復按鈕
      hideTimer.current = setTimeout(() => setFabsHidden(false), 3000);
    }
  }

  useEffect(() => {
    if (pendingCameraOpen) {
      setCameraLaunch(true);
      clearPendingCameraOpen();
    }
  }, [pendingCameraOpen, clearPendingCameraOpen]);

  useEffect(() => {
    if (pendingExportOpen) {
      setExportVisible(true);
      clearPendingExportOpen();
    }
  }, [pendingExportOpen, clearPendingExportOpen]);

  useEffect(() => {
    if (pendingScreenshot) {
      clearPendingScreenshot();
      handleScreenshotCapture();
    }
  }, [pendingScreenshot]);

  function handleCamera() {
    setSheetVisible(false);
    setCameraLaunch(true);
  }

  async function handleLibrary() {
    setSheetVisible(false);
    setCameraLaunch(false);
    const uri = await pickFromLibrary();
    if (uri) setEditModal({ visible: true, sourceUri: uri });
  }

  function openMetaFromEdit(uri: string) {
    setMetaModal({ visible: true, sourceUri: uri });
    setEditModal(null);
  }

  async function handleMetaConfirm(meta: {
    date: string; mealType: MealType; mood?: Mood; event?: string; grade?: MealGrade; note?: string;
  }) {
    if (!metaModal) return;
    const { mealType, ...rest } = meta; // rest includes date
    await addMealWithPhoto(mealType, metaModal.sourceUri, rest);
    setMetaModal(null);
    reload();
  }

  async function handleCollageGenerate(
    startDate: string,
    endDate: string,
    onProgress: (p: number) => void,
  ): Promise<string> {
    onProgress(5);

    // Fetch meals in range
    const fetchedDays = await getMealsByDateRange(db, startDate, endDate);
    setGridDays(fetchedDays);
    onProgress(25);

    // Prefetch all images so they load instantly when CollageGrid renders
    const uris = fetchedDays.flatMap(d =>
      (['breakfast', 'lunch', 'dinner'] as const)
        .map(t => d[t]?.photo?.gridUri)
        .filter((u): u is string => !!u)
    );
    if (uris.length === 0) throw new Error('所選日期範圍內沒有任何餐點照片');
    await Promise.all(uris.map(u => Image.prefetch(u)));
    onProgress(55);

    // Wait for React to render CollageGrid with pre-fetched images
    await new Promise(r => setTimeout(r, 1500));
    onProgress(80);

    // Capture the off-screen grid
    if (!gridRef.current) throw new Error('組圖視圖尚未就緒，請重試');
    const uri = await captureRef(gridRef, { format: 'jpg', quality: 0.92 });
    onProgress(100);

    // Clear grid after capture
    setGridDays([]);
    return uri;
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
        style={[styles.waterFab, { backgroundColor: fontColor, opacity: fabsHidden ? 0 : 1 }]}
        onPress={() => setHealthModal(true)}
        onLongPress={handleFabLongPress}
        activeOpacity={0.8}
        disabled={fabsHidden}
      >
        <WaterDropIcon />
      </TouchableOpacity>

      <FAB
        onPress={() => setSheetVisible(true)}
        onLongPress={handleFabLongPress}
        hidden={fabsHidden}
      />

      {/* ── Photo viewer ── */}
      <PhotoViewer
        visible={selectedMeal !== null}
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onMealUpdated={(updated) => { setSelectedMeal(updated); reload(); }}
        onMealDeleted={() => { setSelectedMeal(null); reload(); }}
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
        defaultDate={today}
        onClose={() => setHealthModal(false)}
      />

      {/* ── Export collage modal ── */}
      <ExportModal
        visible={exportVisible}
        onClose={() => setExportVisible(false)}
        onGenerate={handleCollageGenerate}
      />

      {/* ── Camera launch modal (from openCameraOnStart setting) ── */}
      <CameraLaunchModal
        visible={cameraLaunch}
        onPhotoTaken={(uri) => { setCameraLaunch(false); setEditModal({ visible: true, sourceUri: uri }); }}
        onClose={() => setCameraLaunch(false)}
      />

      {/* ── Hidden collage grid for capture (rendered outside any Modal) ── */}
      <CollageGrid days={gridDays} gridRef={gridRef} />
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
  waterFab: {
    position: 'absolute', bottom: 100, right: 24,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
});
