import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
} from 'react-native';
import { Mood, MealGrade, MealType } from '@/types';
import { MOOD_CONFIG, MOOD_LIST, MEAL_LABELS } from '@/constants/moodConfig';
import { GRADE_CONFIG, GRADE_LIST } from '@/constants/gradeConfig';
import { FaceIcon } from '@/components/FaceIcon';
import { AppText } from '@/components/AppText';
import { useSettingsStore } from '@/stores/settingsStore';

interface MealMetaModalProps {
  visible: boolean;
  mealType: MealType;
  onConfirm: (meta: { mood?: Mood; event?: string; grade?: MealGrade; note?: string }) => void;
  onCancel: () => void;
}

export function MealMetaModal({ visible, mealType, onConfirm, onCancel }: MealMetaModalProps) {
  const { fontColor } = useSettingsStore();
  const [mood, setMood] = useState<Mood | undefined>();
  const [event, setEvent] = useState('');
  const [grade, setGrade] = useState<MealGrade | undefined>();
  const [note, setNote] = useState('');

  function handleConfirm() {
    onConfirm({ mood, event: event || undefined, grade, note: note || undefined });
    setMood(undefined);
    setEvent('');
    setGrade(undefined);
    setNote('');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.sheet}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText style={styles.title}>{MEAL_LABELS[mealType] ?? mealType}</AppText>

          {/* ── 心情 ── */}
          <AppText style={styles.sectionLabel}>心情</AppText>
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
          <AppText style={styles.sectionLabel}>等級</AppText>
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
          <AppText style={styles.sectionLabel}>事件</AppText>
          <TextInput
            testID="event-input"
            style={styles.input}
            value={event}
            onChangeText={setEvent}
            placeholder="記錄今天發生了什麼…"
            placeholderTextColor="#bbb"
          />

          {/* ── 按鈕 ── */}
          <View style={styles.actions}>
            <TouchableOpacity testID="cancel-btn" style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="confirm-btn" style={styles.confirmBtnWrap} onPress={handleConfirm}>
              <View style={[styles.confirmBtn, { backgroundColor: fontColor }]}>
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
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 10, marginTop: 16 },

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
