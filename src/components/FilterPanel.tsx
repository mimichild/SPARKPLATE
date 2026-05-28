import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput,
} from 'react-native';
import { FilterCriteria, Mood, MealGrade, MealType } from '@/types';
import { MOOD_CONFIG, MOOD_LIST, MEAL_LABELS } from '@/constants/moodConfig';
import { GRADE_CONFIG, GRADE_LIST } from '@/constants/gradeConfig';
import { FaceIcon } from '@/components/FaceIcon';
import { AppText } from '@/components/AppText';
import { useSettingsStore } from '@/stores/settingsStore';

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function diffDays(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
function fmtShort(d: string) {
  const [, m, day] = d.split('-');
  return `${parseInt(m)}/${parseInt(day)}`;
}

const WEEKS = ['日', '一', '二', '三', '四', '五', '六'];
const MAX_DAYS = 365;

// ── Date Range Calendar ───────────────────────────────────────────────────────

interface DateRangeCalProps {
  startDate: string | null;
  endDate: string | null;
  fontColor: string;
  onSelectDay: (d: string) => void;
}

function DateRangeCal({ startDate, endDate, fontColor, onSelectDay }: DateRangeCalProps) {
  const today = todayStr();
  const now = new Date();
  const [yr, setYr] = useState(now.getFullYear());
  const [mo, setMo] = useState(now.getMonth());

  const numDays = daysInMonth(yr, mo);
  const offset = firstWeekday(yr, mo);
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
  const canGoNext = toISO(yr, mo, 1) < toISO(now.getFullYear(), now.getMonth(), 1) === false
    ? true  // always allow forward (future months just show grayed dates)
    : true;

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
            const isStart = d === startDate;
            const isEnd = d === endDate;
            const selected = isStart || isEnd;
            const inRange = !!(startDate && endDate && d > startDate && d < endDate);
            const isToday = d === today;
            const future = d > today;

            return (
              <TouchableOpacity
                key={ci}
                style={[cal.cell, inRange && { backgroundColor: fontColor + '22' }]}
                onPress={() => !future && onSelectDay(d)}
                activeOpacity={0.7}
                disabled={future}
              >
                <View style={[
                  cal.dayInner,
                  selected && { backgroundColor: fontColor },
                  !selected && isToday && { borderWidth: 1.5, borderColor: fontColor },
                ]}>
                  <Text style={[
                    cal.dayNum,
                    selected && { color: '#fff', fontWeight: '700' },
                    !selected && inRange && { color: fontColor },
                    !selected && isToday && { color: fontColor },
                    future && cal.futureDay,
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

// ── Date Range Selector (collapsible section used inside FilterPanel) ─────────

interface DateRangeSectionProps {
  startDate: string | undefined;
  endDate: string | undefined;
  fontColor: string;
  onChange: (p: Partial<FilterCriteria>) => void;
}

function DateRangeSection({ startDate, endDate, fontColor, onChange }: DateRangeSectionProps) {
  const [open, setOpen] = useState(false);
  // pick stage: 'start' | 'end'
  const [stage, setStage] = useState<'start' | 'end'>('start');

  const today = todayStr();
  const rangeOk = startDate && endDate;
  const rangeLabel = rangeOk
    ? `${fmtShort(startDate!)} ～ ${fmtShort(endDate!)}`
    : startDate
      ? `${fmtShort(startDate!)} ～ 結束日`
      : '全部日期';

  const dayCount = rangeOk ? diffDays(startDate!, endDate!) + 1 : 0;
  const overLimit = dayCount > MAX_DAYS;

  function handleSelectDay(d: string) {
    if (stage === 'start') {
      // Set start, clear end, move to end stage
      onChange({ startDate: d, endDate: undefined });
      setStage('end');
    } else {
      if (d < (startDate ?? today)) {
        // Tapped before start → restart from this date
        onChange({ startDate: d, endDate: undefined });
        setStage('end');
      } else {
        onChange({ endDate: d });
        setStage('start');
        setOpen(false);
      }
    }
  }

  function handleClear() {
    onChange({ startDate: undefined, endDate: undefined });
    setStage('start');
  }

  const chipActive = !!(startDate || endDate);

  return (
    <View>
      <View style={ds.headerRow}>
        <TouchableOpacity
          style={[ds.chip, chipActive && { borderColor: fontColor }]}
          onPress={() => setOpen(o => !o)}
          activeOpacity={0.75}
        >
          <Text style={ds.calIcon}>📅</Text>
          <Text style={[ds.chipText, chipActive && { color: fontColor }]}>{rangeLabel}</Text>
          <Text style={ds.caret}>{open ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {chipActive && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={ds.clearLink}>清除</Text>
          </TouchableOpacity>
        )}
      </View>

      {open && (
        <View style={ds.calContainer}>
          {/* Hint */}
          <Text style={[ds.hint, stage === 'start' && { color: fontColor }]}>
            {stage === 'start' ? '點選開始日期' : '點選結束日期（最長1年）'}
          </Text>

          {overLimit && (
            <Text style={ds.warning}>⚠️ 已超過1年範圍，請縮短日期區間</Text>
          )}

          <DateRangeCal
            startDate={startDate ?? null}
            endDate={endDate ?? null}
            fontColor={fontColor}
            onSelectDay={handleSelectDay}
          />
        </View>
      )}
    </View>
  );
}

// ── FilterPanel (Modal) ───────────────────────────────────────────────────────

interface FilterPanelProps {
  visible: boolean;
  criteria: FilterCriteria;
  totalCount: number;
  onChange: (partial: Partial<FilterCriteria>) => void;
  onClear: () => void;
  onClose: () => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

function toggle<T>(arr: T[] | undefined, item: T): T[] {
  if (!arr) return [item];
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function FilterPanel({ visible, criteria, totalCount, onChange, onClear, onClose }: FilterPanelProps) {
  const { fontColor } = useSettingsStore();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <AppText style={styles.headerTitle}>篩選條件</AppText>
            <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>清除</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── 日期 ── */}
            <AppText style={styles.sectionLabel}>日期</AppText>
            <View style={styles.sectionPad}>
              <DateRangeSection
                startDate={criteria.startDate}
                endDate={criteria.endDate}
                fontColor={fontColor}
                onChange={onChange}
              />
            </View>

            {/* ── 心情 ── */}
            <AppText style={styles.sectionLabel}>心情</AppText>
            <View style={styles.row}>
              {MOOD_LIST.map((m) => {
                const active = criteria.moods?.includes(m) ?? false;
                return (
                  <TouchableOpacity
                    key={m}
                    testID={`filter-mood-${m}`}
                    style={[styles.moodChip, active && { backgroundColor: fontColor }]}
                    onPress={() => onChange({ moods: toggle(criteria.moods, m) })}
                    activeOpacity={0.75}
                  >
                    <FaceIcon mood={m} size={32} />
                    <Text style={[styles.moodLabel, active && styles.activeLabelWhite]}>
                      {MOOD_CONFIG[m].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 等級 ── */}
            <AppText style={styles.sectionLabel}>等級</AppText>
            <View style={styles.gradeRow}>
              {GRADE_LIST.map((g) => {
                const info = GRADE_CONFIG[g];
                const active = criteria.grades?.includes(g) ?? false;
                return (
                  <TouchableOpacity
                    key={g}
                    testID={`filter-grade-${g}`}
                    style={[styles.gradeChip, active && { backgroundColor: info.color, borderColor: info.color }]}
                    onPress={() => onChange({ grades: toggle(criteria.grades, g) })}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.gradeLabel, active && styles.activeLabelWhite]}>{info.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 餐別 ── */}
            <AppText style={styles.sectionLabel}>餐別</AppText>
            <View style={styles.row}>
              {MEAL_TYPES.map((t) => {
                const active = criteria.mealTypes?.includes(t) ?? false;
                return (
                  <TouchableOpacity
                    key={t}
                    testID={`filter-mealtype-${t}`}
                    style={[styles.chip, active && { backgroundColor: fontColor }]}
                    onPress={() => onChange({ mealTypes: toggle(criteria.mealTypes, t) })}
                    activeOpacity={0.75}
                  >
                    <AppText style={[styles.chipText, active && styles.activeLabelWhite]}>
                      {MEAL_LABELS[t as MealType]}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 飲水量 ── */}
            <AppText style={styles.sectionLabel}>💧 飲水量（至少）</AppText>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.filterInput}
                value={criteria.minWaterMl != null ? String(criteria.minWaterMl) : ''}
                onChangeText={(t) => {
                  const v = t.replace(/[^0-9]/g, '');
                  onChange({ minWaterMl: v ? parseInt(v, 10) : undefined });
                }}
                placeholder="ml"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
              />
              <Text style={styles.inputUnit}>ml</Text>
              {criteria.minWaterMl != null && (
                <TouchableOpacity onPress={() => onChange({ minWaterMl: undefined })}>
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── 睡眠時長 ── */}
            <AppText style={styles.sectionLabel}>😴 睡眠時長（至少）</AppText>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.filterInput}
                value={criteria.minSleepHours != null ? String(criteria.minSleepHours) : ''}
                onChangeText={(t) => {
                  const v = t.replace(/[^0-9.]/g, '');
                  onChange({ minSleepHours: v ? parseFloat(v) : undefined });
                }}
                placeholder="小時"
                placeholderTextColor="#bbb"
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputUnit}>小時</Text>
              {criteria.minSleepHours != null && (
                <TouchableOpacity onPress={() => onChange({ minSleepHours: undefined })}>
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── 其他篩選 ── */}
            <AppText style={styles.sectionLabel}>其他篩選</AppText>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.chip, criteria.hasSnack && { backgroundColor: fontColor }]}
                onPress={() => onChange({ hasSnack: criteria.hasSnack ? undefined : true })}
                activeOpacity={0.75}
              >
                <AppText style={[styles.chipText, criteria.hasSnack && styles.activeLabelWhite]}>
                  🧋 有飲料或點心
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, criteria.hasLateNight && { backgroundColor: fontColor }]}
                onPress={() => onChange({ hasLateNight: criteria.hasLateNight ? undefined : true })}
                activeOpacity={0.75}
              >
                <AppText style={[styles.chipText, criteria.hasLateNight && styles.activeLabelWhite]}>
                  🌙 有宵夜
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerCount}>共 {totalCount} 筆</Text>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: fontColor }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>完成</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Helper exports (used in filter.tsx) ──────────────────────────────────────

export function countActiveCriteria(c: FilterCriteria): number {
  let n = 0;
  if (c.startDate || c.endDate) n++;
  if (c.moods?.length)          n += c.moods.length;
  if (c.grades?.length)         n += c.grades.length;
  if (c.mealTypes?.length)      n += c.mealTypes.length;
  if (c.minWaterMl != null)     n++;
  if (c.minSleepHours != null)  n++;
  if (c.hasSnack)               n++;
  if (c.hasLateNight)           n++;
  return n;
}

export interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function buildActiveChips(
  c: FilterCriteria,
  onChange: (p: Partial<FilterCriteria>) => void
): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (c.startDate || c.endDate) {
    const label = c.startDate && c.endDate
      ? `📅 ${fmtShort(c.startDate)}～${fmtShort(c.endDate)}`
      : c.startDate ? `📅 ${fmtShort(c.startDate)}起`
      : `📅 ～${fmtShort(c.endDate!)}`;
    chips.push({ key: 'date', label, onRemove: () => onChange({ startDate: undefined, endDate: undefined }) });
  }
  (c.moods ?? []).forEach((m) =>
    chips.push({ key: `mood-${m}`, label: MOOD_CONFIG[m].label, onRemove: () => onChange({ moods: (c.moods ?? []).filter((x) => x !== m) }) })
  );
  (c.grades ?? []).forEach((g) =>
    chips.push({ key: `grade-${g}`, label: `${GRADE_CONFIG[g].label}級`, onRemove: () => onChange({ grades: (c.grades ?? []).filter((x) => x !== g) }) })
  );
  (c.mealTypes ?? []).forEach((t) =>
    chips.push({ key: `mt-${t}`, label: MEAL_LABELS[t as MealType], onRemove: () => onChange({ mealTypes: (c.mealTypes ?? []).filter((x) => x !== t) }) })
  );
  if (c.minWaterMl != null)
    chips.push({ key: 'water', label: `💧≥${c.minWaterMl}ml`, onRemove: () => onChange({ minWaterMl: undefined }) });
  if (c.minSleepHours != null)
    chips.push({ key: 'sleep', label: `😴≥${c.minSleepHours}h`, onRemove: () => onChange({ minSleepHours: undefined }) });
  if (c.hasSnack)
    chips.push({ key: 'snack', label: '🧋 有點心', onRemove: () => onChange({ hasSnack: undefined }) });
  if (c.hasLateNight)
    chips.push({ key: 'latenight', label: '🌙 有宵夜', onRemove: () => onChange({ hasLateNight: undefined }) });
  return chips;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CELL = 36;

const cal = StyleSheet.create({
  wrap: { paddingHorizontal: 4 },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  arrow: { fontSize: 22, color: '#555', fontWeight: '600', paddingHorizontal: 8 },
  monthTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  weekLabel: { width: CELL, textAlign: 'center', fontSize: 11, color: '#aaa' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 13, color: '#333' },
  futureDay: { color: '#ccc' },
});

const ds = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', backgroundColor: '#fafafa',
  },
  calIcon: { fontSize: 15 },
  chipText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#555' },
  caret: { fontSize: 10, color: '#aaa' },
  clearLink: { fontSize: 13, color: '#aaa' },
  calContainer: {
    marginTop: 10, padding: 10,
    borderWidth: 1, borderColor: '#eee', borderRadius: 12, backgroundColor: '#fafafa',
  },
  hint: { fontSize: 12, color: '#aaa', textAlign: 'center', marginBottom: 8 },
  warning: { fontSize: 12, color: '#E85D5D', textAlign: 'center', marginBottom: 6 },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  clearText: { fontSize: 14, color: '#aaa' },

  sectionLabel: { fontSize: 13, color: '#888', marginBottom: 10, marginTop: 16, marginHorizontal: 20 },
  sectionPad: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingHorizontal: 20 },

  moodChip: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14, backgroundColor: '#f5f5f5', minWidth: 60,
  },
  moodLabel: { fontSize: 11, color: '#888', marginTop: 5 },

  gradeRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  gradeChip: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f5f5f5', borderWidth: 2, borderColor: '#eee',
  },
  gradeLabel: { fontSize: 18, fontWeight: '800', color: '#aaa' },

  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipText: { fontSize: 14, color: '#555' },

  activeLabelWhite: { color: '#fff' },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  filterInput: {
    width: 110, borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#333',
  },
  inputUnit: { fontSize: 13, color: '#888' },
  clearBtn: { fontSize: 14, color: '#aaa', paddingHorizontal: 4 },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#eee',
    paddingBottom: 28,
  },
  footerCount: { fontSize: 14, color: '#888' },
  doneBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
