import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
} from 'react-native';
import { AppText } from '@/components/AppText';
import { DateSelector } from '@/components/DateSelector';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDailyHealth } from '@/hooks/useDailyHealth';

const WATER_PRESETS = [500, 1000, 1500, 2000, 2500, 3000];
const SLEEP_PRESETS = [5, 6, 7, 8, 9];

function todayStr() { return new Date().toISOString().slice(0, 10); }

interface DailyHealthModalProps {
  visible: boolean;
  defaultDate?: string;
  onClose: () => void;
}

export function DailyHealthModal({ visible, defaultDate, onClose }: DailyHealthModalProps) {
  const { fontColor } = useSettingsStore();
  const [selectedDate, setSelectedDate] = useState(defaultDate ?? todayStr());

  // Reset selected date each time modal opens
  useEffect(() => {
    if (visible) setSelectedDate(defaultDate ?? todayStr());
  }, [visible, defaultDate]);

  const { health, save } = useDailyHealth(selectedDate);

  const [waterText,     setWaterText]     = useState('');
  const [sleepText,     setSleepText]     = useState('');
  const [drinkText,     setDrinkText]     = useState('');
  const [snackText,     setSnackText]     = useState('');
  const [lateNightText, setLateNightText] = useState('');

  // Populate fields from loaded health record whenever health or date changes
  useEffect(() => {
    setWaterText(health?.waterMl != null ? String(health.waterMl) : '');
    setSleepText(health?.sleepHours != null ? String(health.sleepHours) : '');
    setDrinkText(health?.drink ?? '');
    setSnackText(health?.snack ?? '');
    setLateNightText(health?.lateNight ?? '');
  }, [health, selectedDate]);

  async function handleConfirm() {
    await save({
      waterMl:    waterText    ? parseInt(waterText, 10)   : undefined,
      sleepHours: sleepText    ? parseFloat(sleepText)     : undefined,
      drink:      drinkText.trim()     || undefined,
      snack:      snackText.trim()     || undefined,
      lateNight:  lateNightText.trim() || undefined,
    });
    onClose();
  }

  function OptionalLabel({ label }: { label: string }) {
    return (
      <View style={styles.optionalRow}>
        <AppText style={styles.sectionLabel}>{label}</AppText>
        <Text style={styles.optionalBadge}>選填</Text>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.sheet}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText style={styles.title}>健康紀錄</AppText>

          {/* ── 日期 ── */}
          <DateSelector value={selectedDate} onChange={setSelectedDate} />

          {/* ── 飲水量 ── */}
          <OptionalLabel label="💧 今日飲水量" />
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
              style={styles.input}
              value={waterText}
              onChangeText={(t) => setWaterText(t.replace(/[^0-9]/g, ''))}
              placeholder="自訂 ml 數"
              placeholderTextColor="#bbb"
              keyboardType="numeric"
            />
            <Text style={styles.unit}>ml</Text>
          </View>

          {/* ── 睡眠時長 ── */}
          <OptionalLabel label="😴 昨晚睡眠時長" />
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
              style={styles.input}
              value={sleepText}
              onChangeText={(t) => setSleepText(t.replace(/[^0-9.]/g, ''))}
              placeholder="自訂小時數（如 7.5）"
              placeholderTextColor="#bbb"
              keyboardType="decimal-pad"
            />
            <Text style={styles.unit}>小時</Text>
          </View>

          {/* ── 飲料 ── */}
          <OptionalLabel label="🧋 飲料" />
          <TextInput
            style={styles.textArea}
            value={drinkText}
            onChangeText={setDrinkText}
            placeholder="記錄今天喝的飲料…"
            placeholderTextColor="#bbb"
            multiline
          />

          {/* ── 點心 ── */}
          <OptionalLabel label="🍪 點心" />
          <TextInput
            style={styles.textArea}
            value={snackText}
            onChangeText={setSnackText}
            placeholder="記錄今天吃的點心…"
            placeholderTextColor="#bbb"
            multiline
          />

          {/* ── 宵夜 ── */}
          <OptionalLabel label="🌙 宵夜" />
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
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
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
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  optionalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 16, gap: 6 },
  optionalBadge: { fontSize: 11, color: '#aaa', backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 0 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  preset: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f5f5f5', borderWidth: 1.5, borderColor: '#f5f5f5',
  },
  presetText: { fontSize: 13, color: '#666', fontWeight: '600' },
  presetTextActive: { color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333',
  },
  unit: { fontSize: 13, color: '#888', width: 32 },
  textArea: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333',
    minHeight: 60, textAlignVertical: 'top',
  },
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
