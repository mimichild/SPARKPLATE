import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Animated, ActivityIndicator,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { DayRecord } from '@/types';
import { AppText } from '@/components/AppText';
import { useSettingsStore } from '@/stores/settingsStore';

export const COLLAGE_CELL_SIZE = 300;

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
export function diffDays(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
function fmtDate(d: string) {
  const [, m, day] = d.split('-');
  return `${parseInt(m)}/${parseInt(day)}`;
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────

const WEEKS = ['日', '一', '二', '三', '四', '五', '六'];

function MiniCalendar({
  startDate, endDate, fontColor, onSelectDay,
}: {
  startDate: string | null; endDate: string | null;
  fontColor: string; onSelectDay: (d: string) => void;
}) {
  const now = new Date();
  const [yr, setYr] = useState(now.getFullYear());
  const [mo, setMo] = useState(now.getMonth());
  const today = todayStr();

  const numDays = daysInMonth(yr, mo);
  const offset  = firstWeekday(yr, mo);
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMo = () => {
    if (mo === 0) { setMo(11); setYr(y => y - 1); }
    else setMo(m => m - 1);
  };
  const nextMo = () => {
    if (mo === 11) { setMo(0); setYr(y => y + 1); }
    else setMo(m => m + 1);
  };

  return (
    <View style={cal.wrap}>
      <View style={cal.navRow}>
        <TouchableOpacity onPress={prevMo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={cal.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={cal.monthTitle}>{yr}年{mo + 1}月</Text>
        <TouchableOpacity onPress={nextMo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={cal.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={cal.row}>
        {WEEKS.map(w => <Text key={w} style={cal.weekLabel}>{w}</Text>)}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, ri) => (
        <View key={ri} style={cal.row}>
          {cells.slice(ri * 7, ri * 7 + 7).map((day, ci) => {
            if (!day) return <View key={ci} style={cal.cell} />;
            const d = toISO(yr, mo, day);
            const selected = d === startDate || d === endDate;
            const between = !!(startDate && endDate && d > startDate && d < endDate);
            const isToday = d === today;
            return (
              <TouchableOpacity
                key={ci}
                style={[cal.cell, between && { backgroundColor: fontColor + '22' }]}
                onPress={() => onSelectDay(d)}
                activeOpacity={0.7}
              >
                <View style={[
                  cal.dayInner,
                  selected && { backgroundColor: fontColor },
                  !selected && isToday && { borderWidth: 1.5, borderColor: fontColor },
                ]}>
                  <Text style={[
                    cal.dayNum,
                    selected && { color: '#fff', fontWeight: '700' },
                    !selected && between && { color: fontColor },
                    !selected && isToday && { color: fontColor },
                  ]}>{day}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ── Animated Progress Bar ─────────────────────────────────────────────────────

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={{ width: '100%', marginTop: 8 }}>
      <View style={prog.track}>
        <Animated.View style={[prog.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={prog.pct}>{Math.round(progress)}%</Text>
    </View>
  );
}

// ── Hidden Collage Grid (rendered in parent, captured with captureRef) ────────

interface CollageGridProps {
  days: DayRecord[];
  gridRef: React.RefObject<View | null>;
}

export function CollageGrid({ days, gridRef }: CollageGridProps) {
  if (days.length === 0) return null;
  return (
    <View
      ref={gridRef as React.RefObject<View>}
      collapsable={false}
      style={{
        position: 'absolute',
        left: -(COLLAGE_CELL_SIZE * 3 + 300),
        top: 0,
        width: COLLAGE_CELL_SIZE * 3,
        backgroundColor: '#fff',
      }}
    >
      {days.map(day => (
        <View key={day.date} style={{ flexDirection: 'row' }}>
          {(['breakfast', 'lunch', 'dinner'] as const).map(type => {
            const meal = day[type];
            return (
              <View
                key={type}
                style={{ width: COLLAGE_CELL_SIZE, height: COLLAGE_CELL_SIZE, backgroundColor: '#ebebeb' }}
              >
                {meal?.photo ? (
                  <Image
                    source={{ uri: meal.photo.gridUri }}
                    style={{ width: COLLAGE_CELL_SIZE, height: COLLAGE_CELL_SIZE }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ── Grid Icon (for the export button) ────────────────────────────────────────

export function GridIcon() {
  return (
    <View style={{ gap: 3 }}>
      {[0, 1, 2].map(row => (
        <View key={row} style={{ flexDirection: 'row', gap: 3 }}>
          {[0, 1, 2].map(col => (
            <View key={col} style={{ width: 5, height: 5, backgroundColor: '#fff', borderRadius: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Main Export Modal ─────────────────────────────────────────────────────────

type Step = 'picker' | 'generating' | 'save' | 'done' | 'error';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  /** Parent fetches meals + renders CollageGrid + captures; returns file URI */
  onGenerate: (
    startDate: string,
    endDate: string,
    onProgress: (p: number) => void,
  ) => Promise<string>;
}

export function ExportModal({ visible, onClose, onGenerate }: ExportModalProps) {
  const { fontColor } = useSettingsStore();

  const [startDate,   setStartDate]   = useState<string | null>(null);
  const [endDate,     setEndDate]     = useState<string | null>(null);
  const [step,        setStep]        = useState<Step>('picker');
  const [progress,    setProgress]    = useState(0);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [errorMsg,    setErrorMsg]    = useState('');

  const diff      = startDate && endDate ? diffDays(startDate, endDate) : -1;
  const rangeOk   = diff >= 0 && diff <= 6;
  const rangeDays = diff >= 0 ? diff + 1 : 0;

  function handleDay(d: string) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(d); setEndDate(null);
    } else {
      if (d < startDate) { setStartDate(d); setEndDate(startDate); }
      else { setEndDate(d); }
    }
  }

  async function generate() {
    if (!startDate || !endDate) return;
    setStep('generating'); setProgress(0);
    try {
      const uri = await onGenerate(startDate, endDate, setProgress);
      setCapturedUri(uri);
      setStep('save');
    } catch (e: any) {
      setErrorMsg(e?.message ?? '發生未知錯誤');
      setStep('error');
    }
  }

  async function saveToLibrary() {
    if (!capturedUri) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('需要相片庫權限才能儲存，請到系統設定中開啟');
      setStep('error');
      return;
    }
    await MediaLibrary.saveToLibraryAsync(capturedUri);
    setStep('done');
  }

  async function shareFile() {
    if (!capturedUri) return;
    await Sharing.shareAsync(capturedUri, { mimeType: 'image/jpeg' });
    setStep('done');
  }

  function handleClose() {
    setStartDate(null); setEndDate(null);
    setStep('picker'); setProgress(0);
    setCapturedUri(null); setErrorMsg('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={s.overlay}>
        <ScrollView
          contentContainerStyle={s.sheet}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText style={s.title}>匯出組圖</AppText>

          {/* ── PICKER ── */}
          {step === 'picker' && (
            <>
              <Text style={s.desc}>
                選擇 1～7 天的日期範圍，系統將自動收集所有餐點照片，按日期排序合成一張 3 欄組圖，存入手機。
              </Text>

              <MiniCalendar
                startDate={startDate} endDate={endDate}
                fontColor={fontColor} onSelectDay={handleDay}
              />

              <View style={s.rangeBox}>
                {startDate
                  ? <Text style={s.rangeText}>
                      {fmtDate(startDate)}
                      {endDate ? ` ～ ${fmtDate(endDate)}（共 ${rangeDays} 天）` : ' ～ 請選擇結束日期'}
                    </Text>
                  : <Text style={s.rangePlaceholder}>請點選開始日期</Text>}
              </View>

              {diff > 6 && (
                <View style={s.warnBox}>
                  <Text style={s.warnText}>⚠️ 已超過 7 天，請重新選擇較短的範圍</Text>
                </View>
              )}

              <View style={s.actions}>
                <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
                  <Text style={s.cancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.confirmWrap} onPress={generate} disabled={!rangeOk}>
                  <View style={[s.confirmBtn, { backgroundColor: rangeOk ? fontColor : '#ccc' }]}>
                    <Text style={s.confirmText}>產生組圖</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── GENERATING ── */}
          {step === 'generating' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={fontColor} style={{ marginBottom: 24 }} />
              <Text style={s.genLabel}>合成中，請稍候…</Text>
              <ProgressBar progress={progress} color={fontColor} />
            </View>
          )}

          {/* ── SAVE ── */}
          {step === 'save' && (
            <View style={s.center}>
              <Text style={s.saveTitle}>組圖完成！請選擇儲存位置</Text>
              <TouchableOpacity
                style={[s.saveBtn, { borderColor: fontColor }]}
                onPress={saveToLibrary}
                activeOpacity={0.8}
              >
                <Text style={[s.saveBtnTxt, { color: fontColor }]}>📥 儲存到手機相簿</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { borderColor: fontColor, marginTop: 12 }]}
                onPress={shareFile}
                activeOpacity={0.8}
              >
                <Text style={[s.saveBtnTxt, { color: fontColor }]}>🔗 分享 / 匯出到其他位置</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.cancelBtn, { marginTop: 16, alignSelf: 'center', width: 120 }]}
                onPress={handleClose}
              >
                <Text style={[s.cancelText, { textAlign: 'center' }]}>取消</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <View style={s.center}>
              <Text style={{ fontSize: 60, marginBottom: 12 }}>✅</Text>
              <AppText style={s.doneText}>已儲存！</AppText>
              <TouchableOpacity style={[s.doneBtn, { backgroundColor: fontColor }]} onPress={handleClose} activeOpacity={0.8}>
                <Text style={s.confirmText}>完成</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <View style={s.center}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>❌</Text>
              <Text style={s.errorText}>{errorMsg}</Text>
              <View style={[s.actions, { marginTop: 24 }]}>
                <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
                  <Text style={s.cancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.confirmWrap}
                  onPress={() => { setStep('picker'); setErrorMsg(''); }}
                >
                  <View style={[s.confirmBtn, { backgroundColor: fontColor }]}>
                    <Text style={s.confirmText}>重試</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 48,
  },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  desc: { fontSize: 13, color: '#777', lineHeight: 20, marginBottom: 12 },
  rangeBox: { marginTop: 14, alignItems: 'center' },
  rangeText: { fontSize: 15, fontWeight: '600', color: '#333' },
  rangePlaceholder: { fontSize: 14, color: '#bbb' },
  warnBox: { backgroundColor: '#fff8e1', borderRadius: 8, padding: 10, marginTop: 10 },
  warnText: { fontSize: 13, color: '#e65100' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  cancelText: { color: '#666', fontWeight: '600' },
  confirmWrap: { flex: 1 },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '600' },
  center: { alignItems: 'center', paddingVertical: 16 },
  genLabel: { fontSize: 15, color: '#555', marginBottom: 16 },
  saveTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 20 },
  saveBtn: { width: '100%', paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  saveBtnTxt: { fontSize: 15, fontWeight: '600' },
  doneText: { fontSize: 18, fontWeight: '700', color: '#333' },
  doneBtn: { marginTop: 24, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12, alignItems: 'center' },
  errorText: { fontSize: 14, color: '#e53935', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});

const cal = StyleSheet.create({
  wrap: { backgroundColor: '#f9f9f9', borderRadius: 14, padding: 12 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  arrow: { fontSize: 22, color: '#555', paddingHorizontal: 8 },
  monthTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  row: { flexDirection: 'row' },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: '#aaa', paddingVertical: 6 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  dayInner: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  dayNum: { fontSize: 13, color: '#333' },
});

const prog = StyleSheet.create({
  track: { height: 10, backgroundColor: '#eee', borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10 },
  pct: { textAlign: 'right', fontSize: 12, color: '#888', marginTop: 4 },
});
