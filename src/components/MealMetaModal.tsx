import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
} from 'react-native';
import { Mood, MealGrade, MealType } from '@/types';
import { MOOD_CONFIG, MEAL_LABELS } from '@/constants/moodConfig';
import { AppText } from '@/components/AppText';

interface MealMetaModalProps {
  visible: boolean;
  mealType: MealType;
  onConfirm: (meta: { mood?: Mood; event?: string; grade?: MealGrade; note?: string }) => void;
  onCancel: () => void;
}

const MOODS: Mood[] = ['great', 'good', 'neutral', 'bad', 'terrible'];
const GRADES: MealGrade[] = [1, 2, 3, 4, 5];

export function MealMetaModal({ visible, mealType, onConfirm, onCancel }: MealMetaModalProps) {
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
        <View style={styles.sheet}>
          <AppText style={styles.title}>{MEAL_LABELS[mealType] ?? mealType}</AppText>

          <AppText style={styles.sectionLabel}>心情</AppText>
          <View style={styles.row}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m}
                testID={`mood-chip-${m}`}
                style={[styles.chip, mood === m ? styles.chipActive : null]}
                onPress={() => setMood(mood === m ? undefined : m)}
              >
                <Text style={styles.chipText}>{MOOD_CONFIG[m].emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <AppText style={styles.sectionLabel}>等級</AppText>
          <View style={styles.row}>
            {GRADES.map((g) => (
              <TouchableOpacity
                key={g}
                testID={`grade-chip-${g}`}
                style={[styles.chip, grade === g ? styles.chipActive : null]}
                onPress={() => setGrade(grade === g ? undefined : g)}
              >
                <Text style={styles.chipText}>{'⭐'.repeat(g)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <AppText style={styles.sectionLabel}>事件</AppText>
          <TextInput
            testID="event-input"
            style={styles.input}
            value={event}
            onChangeText={setEvent}
            placeholder="記錄今天發生了什麼…"
            placeholderTextColor="#bbb"
          />

          <View style={styles.actions}>
            <TouchableOpacity testID="cancel-btn" style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="confirm-btn" style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>完成</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 8, marginTop: 12 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#333' },
  chipText: { fontSize: 16 },
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333',
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#333', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '600' },
});
