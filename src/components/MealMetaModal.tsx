import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
} from 'react-native';
import { Mood, MealGrade, MealType } from '@/types';
import { MOOD_CONFIG, MOOD_LIST } from '@/constants/moodConfig';
import { GRADE_CONFIG, GRADE_LIST } from '@/constants/gradeConfig';
import { FaceIcon } from '@/components/FaceIcon';
import { AppText } from '@/components/AppText';
import { DateSelector } from '@/components/DateSelector';
import { useSettingsStore } from '@/stores/settingsStore';

function todayStr() { return new Date().toISOString().slice(0, 10); }

const MEAL_OPTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: '早餐', icon: '🌅' },
  { type: 'lunch',     label: '午餐', icon: '☀️' },
  { type: 'dinner',    label: '晚餐', icon: '🌙' },
];

interface MealMetaModalProps {
  visible: boolean;
  onConfirm: (meta: {
    date: string;
    mealType: MealType;
    mood?: Mood;
    event?: string;
    grade?: MealGrade;
    note?: string;
  }) => void;
  onCancel: () => void;
}

export function MealMetaModal({ visible, onConfirm, onCancel }: MealMetaModalProps) {
  const { fontColor } = useSettingsStore();
  const [date,     setDate]     = useState(todayStr());
  const [mealType, setMealType] = useState<MealType | undefined>();
  const [mood,     setMood]     = useState<Mood | undefined>();
  const [event,    setEvent]    = useState('');
  const [grade,    setGrade]    = useState<MealGrade | undefined>();
  const [note,     setNote]     = useState('');

  function reset() {
    setDate(todayStr());
    setMealType(undefined);
    setMood(undefined);
    setEvent('');
    setGrade(undefined);
    setNote('');
  }

  function handleConfirm() {
    if (!mealType) return;
    onConfirm({ date, mealType, mood, event: event || undefined, grade, note: note || undefined });
    reset();
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <ScrollView
          style={styles.scrollWrap}
          contentContainerStyle={styles.sheet}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText style={styles.title}>新增餐點</AppText>

          {/* ── 日期 ── */}
          <DateSelector value={date} onChange={setDate} />

          {/* ── 餐別（必填） ── */}
          <View style={styles.requiredRow}>
            <AppText style={styles.sectionLabel}>餐別</AppText>
            <Text style={styles.requiredBadge}>必填</Text>
          </View>
          <View style={styles.mealTypeRow}>
            {MEAL_OPTIONS.map(({ type, label, icon }) => {
              const active = mealType === type;
              return (
                <TouchableOpacity
                  key={type}
                  testID={`meal-type-${type}`}
                  style={[styles.mealTypeChip, active && { backgroundColor: fontColor, borderColor: fontColor }]}
                  onPress={() => setMealType(active ? undefined : type)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.mealTypeIcon}>{icon}</Text>
                  <Text style={[styles.mealTypeLabel, active && styles.mealTypeLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 心情 ── */}
          <View style={styles.optionalRow}>
            <AppText style={styles.sectionLabel}>心情</AppText>
            <Text style={styles.optionalBadge}>選填</Text>
          </View>
          <View style={styles.moodRow}>
            {MOOD_LIST.map((m) => {
              const active = mood === m;
              return (
                <TouchableOpacity
                  key={m}
                  testID={`mood-chip-${m}`}
                  style={[styles.moodChip, active && { backgroundColor: fontColor }]}
                  onPress={() => setMood(mood === m ? undefined : m)}
                  activeOpacity={0.75}
                >
                  <FaceIcon mood={m} size={40} />
                  <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>
                    {MOOD_CONFIG[m].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 等級 ── */}
          <View style={styles.optionalRow}>
            <AppText style={styles.sectionLabel}>等級</AppText>
            <Text style={styles.optionalBadge}>選填</Text>
          </View>
          {GRADE_LIST.map((g) => {
            const info = GRADE_CONFIG[g];
            const active = grade === g;
            return (
              <TouchableOpacity
                key={g}
                testID={`grade-chip-${g}`}
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
          <View style={styles.optionalRow}>
            <AppText style={styles.sectionLabel}>事件</AppText>
            <Text style={styles.optionalBadge}>選填</Text>
          </View>
          <TextInput
            testID="event-input"
            style={styles.input}
            value={event}
            onChangeText={setEvent}
            placeholder="記錄今天發生了什麼…（如：工作壓力大、姨媽來、聚餐）"
            placeholderTextColor="#bbb"
          />

          {/* ── 按鈕 ── */}
          <View style={styles.actions}>
            <TouchableOpacity testID="cancel-btn" style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="confirm-btn"
              style={styles.confirmBtnWrap}
              onPress={handleConfirm}
              disabled={!mealType}
            >
              <View style={[styles.confirmBtn, { backgroundColor: mealType ? fontColor : '#ccc' }]}>
                <Text style={styles.confirmText}>完成</Text>
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
  requiredRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 4, gap: 6 },
  requiredBadge: { fontSize: 11, color: '#fff', backgroundColor: '#E85D5D', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  optionalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 16, gap: 6 },
  optionalBadge: { fontSize: 11, color: '#aaa', backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 0 },

  // Meal type chips
  mealTypeRow: { flexDirection: 'row', gap: 10 },
  mealTypeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#f5f5f5', borderWidth: 1.5, borderColor: '#f5f5f5',
  },
  mealTypeIcon: { fontSize: 16 },
  mealTypeLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  mealTypeLabelActive: { color: '#fff' },

  // Mood row
  moodRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  moodChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, backgroundColor: '#f5f5f5',
  },
  moodLabel: { fontSize: 11, color: '#888', marginTop: 6 },
  moodLabelActive: { color: '#fff' },

  // Grade rows
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

  // Event input
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333',
  },

  // Actions
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  confirmBtnWrap: { flex: 1 },
  confirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  cancelText: { color: '#666', fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '600' },
});
