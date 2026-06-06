import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
} from 'react-native';
import { Mood, MealGrade, MealType, Meal, DailyHealth } from '@/types';
import { MOOD_CONFIG, MOOD_LIST } from '@/constants/moodConfig';
import { GRADE_CONFIG, GRADE_LIST } from '@/constants/gradeConfig';
import { FaceIcon } from '@/components/FaceIcon';
import { AppText } from '@/components/AppText';
import { useSettingsStore } from '@/stores/settingsStore';

const MEAL_OPTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: '早餐', icon: '🌅' },
  { type: 'lunch',     label: '午餐', icon: '☀️' },
  { type: 'dinner',    label: '晚餐', icon: '🌙' },
];

const WATER_PRESETS = [500, 1000, 1500, 2000, 2500, 3000];
const SLEEP_PRESETS = [5, 6, 7, 8, 8.5, 9];

export interface EditMealData {
  mealType: MealType;
  mood?: Mood;
  grade?: MealGrade;
  event?: string;
  waterMl?: number;
  sleepHours?: number;
  drink?: string;
  snack?: string;
  lateNight?: string;
}

interface EditMealModalProps {
  visible: boolean;
  meal: Meal;
  health: DailyHealth | null;
  onConfirm: (data: EditMealData) => void;
  onCancel: () => void;
}

export function EditMealModal({ visible, meal, health, onConfirm, onCancel }: EditMealModalProps) {
  const { fontColor } = useSettingsStore();

  const [mealType,      setMealType]      = useState<MealType>(meal.mealType);
  const [mood,          setMood]          = useState<Mood | undefined>(meal.mood);
  const [grade,         setGrade]         = useState<MealGrade | undefined>(meal.grade);
  const [event,         setEvent]         = useState(meal.event ?? '');
  const [waterText,     setWaterText]     = useState('');
  const [sleepText,     setSleepText]     = useState('');
  const [drinkText,     setDrinkText]     = useState('');
  const [snackText,     setSnackText]     = useState('');
  const [lateNightText, setLateNightText] = useState('');

  useEffect(() => {
    if (visible) {
      setMealType(meal.mealType);
      setMood(meal.mood);
      setGrade(meal.grade);
      setEvent(meal.event ?? '');
      setWaterText(health?.waterMl != null ? String(health.waterMl) : '');
      setSleepText(health?.sleepHours != null ? String(health.sleepHours) : '');
      setDrinkText(health?.drink ?? '');
      setSnackText(health?.snack ?? '');
      setLateNightText(health?.lateNight ?? '');
    }
  }, [visible, meal, health]);

  function handleConfirm() {
    onConfirm({
      mealType,
      mood,
      grade,
      event: event.trim() || undefined,
      waterMl:    waterText    ? parseInt(waterText, 10) : undefined,
      sleepHours: sleepText    ? parseFloat(sleepText)   : undefined,
      drink:      drinkText.trim()     || undefined,
      snack:      snackText.trim()     || undefined,
      lateNight:  lateNightText.trim() || undefined,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <ScrollView
          style={styles.scrollWrap}
          contentContainerStyle={styles.sheet}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText style={styles.title}>編輯紀錄</AppText>

          {/* ── 餐別 ── */}
          <AppText style={styles.sectionLabel}>餐別</AppText>
          <View style={styles.mealTypeRow}>
            {MEAL_OPTIONS.map(({ type, label, icon }) => {
              const active = mealType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.mealTypeChip, active && { backgroundColor: fontColor, borderColor: fontColor }]}
                  onPress={() => setMealType(type)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.mealTypeIcon}>{icon}</Text>
                  <Text style={[styles.mealTypeLabel, active && styles.mealTypeLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 心情 ── */}
          <AppText style={[styles.sectionLabel, styles.sectionTop]}>心情</AppText>
          <View style={styles.moodRow}>
            {MOOD_LIST.map((m) => {
              const active = mood === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.moodChip, active && { backgroundColor: fontColor }]}
                  onPress={() => setMood(mood === m ? undefined : m)}
                  activeOpacity={0.75}
                >
                  <FaceIcon mood={m} size={36} />
                  <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>
                    {MOOD_CONFIG[m].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 等級 ── */}
          <AppText style={[styles.sectionLabel, styles.sectionTop]}>等級</AppText>
          {GRADE_LIST.map((g) => {
            const info = GRADE_CONFIG[g];
            const active = grade === g;
            return (
              <TouchableOpacity
                key={g}
                style={[styles.gradeRow, active && { borderColor: info.color, backgroundColor: info.color + '18' }]}
                onPress={() => setGrade(grade === g ? undefined : g)}
                activeOpacity={0.75}
              >
                <View style={[styles.gradeBadge, { backgroundColor: active ? info.color : '#ddd' }]}>
                  <Text style={styles.gradeLetter}>{info.label}</Text>
                </View>
                <Text style={[styles.gradeDesc, active && { color: info.color }]}>{info.desc}</Text>
              </TouchableOpacity>
            );
          })}

          {/* ── 事件 ── */}
          <AppText style={[styles.sectionLabel, styles.sectionTop]}>事件</AppText>
          <TextInput
            style={styles.input}
            value={event}
            onChangeText={setEvent}
            placeholder="記錄今天發生了什麼…（如：工作壓力大、姨媽來、聚餐）"
            placeholderTextColor="#bbb"
          />

          {/* ── 分隔線 ── */}
          <View style={styles.divider} />

          {/* ── 飲水量 ── */}
          <AppText style={styles.sectionLabel}>💧 今日飲水量</AppText>
          <View style={styles.presetRow}>
            {WATER_PRESETS.map((ml) => {
              const active = waterText === String(ml);
              return (
                <TouchableOpacity
                  key={ml}
                  style={[styles.preset, active && { backgroundColor: fontColor, borderColor: fontColor }]}
                  onPress={() => setWaterText(active ? '' : String(ml))}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>
                    {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.numberInput}
              value={waterText}
              onChangeText={(t) => setWaterText(t.replace(/[^0-9]/g, ''))}
              placeholder="自訂 ml 數"
              placeholderTextColor="#bbb"
              keyboardType="numeric"
            />
            <Text style={styles.unit}>ml</Text>
          </View>

          {/* ── 睡眠時長 ── */}
          <AppText style={[styles.sectionLabel, styles.sectionTop]}>😴 昨晚睡眠時長</AppText>
          <View style={styles.presetRow}>
            {SLEEP_PRESETS.map((h) => {
              const active = sleepText === String(h);
              return (
                <TouchableOpacity
                  key={h}
                  style={[styles.preset, active && { backgroundColor: fontColor, borderColor: fontColor }]}
                  onPress={() => setSleepText(active ? '' : String(h))}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>{h}h</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.numberInput}
              value={sleepText}
              onChangeText={(t) => setSleepText(t.replace(/[^0-9.]/g, ''))}
              placeholder="自訂小時數（如 7.5）"
              placeholderTextColor="#bbb"
              keyboardType="decimal-pad"
            />
            <Text style={styles.unit}>小時</Text>
          </View>

          {/* ── 飲料 ── */}
          <AppText style={[styles.sectionLabel, styles.sectionTop]}>🧋 飲料</AppText>
          <TextInput
            style={styles.textArea}
            value={drinkText}
            onChangeText={setDrinkText}
            placeholder="記錄今天喝的飲料…"
            placeholderTextColor="#bbb"
            multiline
          />

          {/* ── 點心 ── */}
          <AppText style={[styles.sectionLabel, styles.sectionTop]}>🍪 點心</AppText>
          <TextInput
            style={styles.textArea}
            value={snackText}
            onChangeText={setSnackText}
            placeholder="記錄今天吃的點心…"
            placeholderTextColor="#bbb"
            multiline
          />

          {/* ── 宵夜 ── */}
          <AppText style={[styles.sectionLabel, styles.sectionTop]}>🌙 宵夜</AppText>
          <TextInput
            style={styles.textArea}
            value={lateNightText}
            onChangeText={setLateNightText}
            placeholder="記錄今晚的宵夜…"
            placeholderTextColor="#bbb"
            multiline
          />

          {/* ── 按鈕 ── */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtnWrap} onPress={handleConfirm}>
              <View style={[styles.confirmBtn, { backgroundColor: fontColor }]}>
                <Text style={styles.confirmText}>儲存</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  scrollWrap: { maxHeight: '88%' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingTop: 28, paddingBottom: 40,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 10 },
  sectionTop: { marginTop: 16 },

  // Meal type
  mealTypeRow: { flexDirection: 'row', gap: 10 },
  mealTypeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#f5f5f5', borderWidth: 1.5, borderColor: '#f5f5f5',
  },
  mealTypeIcon: { fontSize: 16 },
  mealTypeLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  mealTypeLabelActive: { color: '#fff' },

  // Mood
  moodRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  moodChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, backgroundColor: '#f5f5f5',
  },
  moodLabel: { fontSize: 11, color: '#888', marginTop: 6 },
  moodLabelActive: { color: '#fff' },

  // Grade
  gradeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#eee',
    marginBottom: 8, gap: 12,
  },
  gradeBadge: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  gradeLetter: { color: '#fff', fontSize: 14, fontWeight: '800' },
  gradeDesc: { fontSize: 13, color: '#555', flex: 1 },

  // Event
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333',
  },

  // Divider
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee', marginVertical: 20 },

  // Water / sleep presets
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  preset: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f5f5f5', borderWidth: 1.5, borderColor: '#f5f5f5',
  },
  presetText: { fontSize: 13, color: '#666', fontWeight: '600' },
  presetTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numberInput: {
    flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333',
  },
  unit: { fontSize: 13, color: '#888', width: 36 },

  // Text area (snack / late night)
  textArea: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333',
    minHeight: 60, textAlignVertical: 'top',
  },

  // Actions
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  confirmBtnWrap: { flex: 1 },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '600' },
});
