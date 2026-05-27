import React, { useState } from 'react';
import {
  Modal, View, Image, TouchableOpacity, Text, StyleSheet,
  Dimensions, ScrollView,
} from 'react-native';
import { Meal, DailyHealth } from '@/types';
import { MEAL_LABELS, MOOD_CONFIG } from '@/constants/moodConfig';
import { GRADE_CONFIG } from '@/constants/gradeConfig';
import { FaceIcon } from '@/components/FaceIcon';
import { AppText } from '@/components/AppText';
import { EditMealModal, EditMealData } from '@/components/EditMealModal';
import { useDB } from '@/hooks/useDB';
import { useDailyHealth } from '@/hooks/useDailyHealth';
import { updateMeal } from '@/services/mealService';
import { useSettingsStore } from '@/stores/settingsStore';

const { width, height } = Dimensions.get('window');
const PHOTO_HEIGHT = Math.round(height * 0.52);

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

interface PhotoViewerProps {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
  onMealUpdated?: (meal: Meal) => void;
}

function HealthRow({ label, value, unit }: { label: string; value?: number; unit: string }) {
  return (
    <View style={detail.healthRow}>
      <Text style={detail.healthLabel}>{label}</Text>
      <Text style={detail.healthValue}>
        {value != null ? `${value}${unit}` : '—'}
      </Text>
    </View>
  );
}

interface DetailPanelProps {
  meal: Meal;
  health: DailyHealth | null;
  onEditPress: () => void;
}

function DetailPanel({ meal, health, onEditPress }: DetailPanelProps) {
  const { fontColor } = useSettingsStore();

  return (
    <ScrollView style={detail.panel} contentContainerStyle={detail.panelContent} showsVerticalScrollIndicator={false}>
      {/* Date + meal type */}
      <View style={detail.row}>
        <Text style={detail.date}>{formatDate(meal.date)}</Text>
        <AppText style={detail.mealType}>{MEAL_LABELS[meal.mealType]}</AppText>
      </View>

      {/* Mood + grade */}
      {(meal.mood || meal.grade) ? (
        <View style={detail.row}>
          {meal.mood && (
            <View style={detail.moodWrap}>
              <FaceIcon mood={meal.mood} size={28} />
              <Text style={detail.moodLabel}>{MOOD_CONFIG[meal.mood].label}</Text>
            </View>
          )}
          {meal.grade && (
            <View style={[detail.gradeBadge, { backgroundColor: GRADE_CONFIG[meal.grade].color }]}>
              <Text style={detail.gradeText}>{meal.grade}</Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Event */}
      {meal.event ? (
        <Text style={detail.event}>{meal.event}</Text>
      ) : null}

      {/* Divider */}
      <View style={detail.divider} />

      {/* Health */}
      <HealthRow label="💧 今日飲水" value={health?.waterMl} unit=" ml" />
      <HealthRow label="😴 昨晚睡眠" value={health?.sleepHours} unit=" 小時" />
      {health?.snack ? (
        <View style={detail.healthRow}>
          <Text style={detail.healthLabel}>🧃 飲料或點心</Text>
          <Text style={[detail.healthValue, { flex: 1, textAlign: 'right', marginLeft: 8 }]} numberOfLines={2}>{health.snack}</Text>
        </View>
      ) : null}
      {health?.lateNight ? (
        <View style={detail.healthRow}>
          <Text style={detail.healthLabel}>🌙 宵夜</Text>
          <Text style={[detail.healthValue, { flex: 1, textAlign: 'right', marginLeft: 8 }]} numberOfLines={2}>{health.lateNight}</Text>
        </View>
      ) : null}

      {/* Edit button */}
      <TouchableOpacity
        style={[detail.editBtn, { borderColor: fontColor }]}
        onPress={onEditPress}
        activeOpacity={0.75}
      >
        <Text style={[detail.editBtnText, { color: fontColor }]}>✏️ 編輯紀錄</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export function PhotoViewer({ visible, meal, onClose, onMealUpdated }: PhotoViewerProps) {
  const [editVisible, setEditVisible] = useState(false);
  const db = useDB();
  const { health, save: saveHealth } = useDailyHealth(meal?.date ?? '');

  async function handleEditConfirm(data: EditMealData) {
    if (!meal) return;
    const updated = await updateMeal(db, meal.id, {
      mealType: data.mealType,
      mood:     data.mood,
      grade:    data.grade,
      event:    data.event,
    });
    await saveHealth({
      waterMl:    data.waterMl,
      sleepHours: data.sleepHours,
      snack:      data.snack,
      lateNight:  data.lateNight,
    });
    setEditVisible(false);
    onMealUpdated?.(updated);
  }

  if (!meal?.photo) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Photo */}
        <Image
          source={{ uri: meal.photo.detailUri }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Close button */}
        <TouchableOpacity testID="photo-viewer-close" style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* Detail panel */}
        <DetailPanel
          meal={meal}
          health={health}
          onEditPress={() => setEditVisible(true)}
        />

        {/* Edit modal */}
        {editVisible && (
          <EditMealModal
            visible={editVisible}
            meal={meal}
            health={health}
            onConfirm={handleEditConfirm}
            onCancel={() => setEditVisible(false)}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  image: { width, height: PHOTO_HEIGHT },
  closeBtn: {
    position: 'absolute', top: 52, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

const detail = StyleSheet.create({
  panel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  panelContent: { padding: 20, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  date: { fontSize: 18, fontWeight: '700', color: '#111' },
  mealType: { fontSize: 16, color: '#777' },
  moodWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moodLabel: { fontSize: 14, color: '#555' },
  gradeBadge: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  gradeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  event: { fontSize: 14, color: '#444', marginBottom: 10, lineHeight: 20 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee', marginVertical: 14 },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  healthLabel: { fontSize: 14, color: '#555' },
  healthValue: { fontSize: 14, color: '#111', fontWeight: '600' },
  editBtn: {
    marginTop: 20, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center',
  },
  editBtnText: { fontSize: 15, fontWeight: '600' },
});
