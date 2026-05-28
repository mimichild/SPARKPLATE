import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function fmtShort(d: string) {
  const [, m, day] = d.split('-');
  return `${parseInt(m)}月${parseInt(day)}日`;
}

const WEEKS = ['日', '一', '二', '三', '四', '五', '六'];
const CELL = 36;

interface DateSelectorProps {
  value: string;
  onChange: (d: string) => void;
}

export function DateSelector({ value, onChange }: DateSelectorProps) {
  const { fontColor } = useSettingsStore();
  const today = todayStr();
  const [open, setOpen] = useState(false);

  const parsed = new Date(value);
  const [yr, setYr] = useState(parsed.getFullYear());
  const [mo, setMo] = useState(parsed.getMonth());

  // Sync calendar view when value changes externally
  useEffect(() => {
    const p = new Date(value);
    setYr(p.getFullYear());
    setMo(p.getMonth());
  }, [value]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const canGoNext = yr < currentYear || (yr === currentYear && mo < currentMonth);

  const prevMo = () => {
    if (mo === 0) { setMo(11); setYr(y => y - 1); }
    else setMo(m => m - 1);
  };
  const nextMo = () => {
    if (!canGoNext) return;
    if (mo === 11) { setMo(0); setYr(y => y + 1); }
    else setMo(m => m + 1);
  };

  const numDays = daysInMonth(yr, mo);
  const offset = firstWeekday(yr, mo);
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function handleSelect(date: string) {
    if (date > today) return;
    onChange(date);
    setOpen(false);
  }

  const label = value === today
    ? `今天（${fmtShort(value)}）`
    : fmtShort(value);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.chip, open && { borderColor: fontColor }]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
      >
        <Text style={styles.calIcon}>📅</Text>
        <Text style={[styles.chipText, open && { color: fontColor }]}>{label}</Text>
        <Text style={styles.caret}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.calWrap}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={prevMo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{yr}年{mo + 1}月</Text>
            <TouchableOpacity onPress={nextMo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKS.map(w => <Text key={w} style={styles.weekLabel}>{w}</Text>)}
          </View>

          {Array.from({ length: cells.length / 7 }, (_, ri) => (
            <View key={ri} style={styles.weekRow}>
              {cells.slice(ri * 7, ri * 7 + 7).map((day, ci) => {
                if (!day) return <View key={ci} style={styles.cell} />;
                const date = toISO(yr, mo, day);
                const selected = date === value;
                const future = date > today;
                const isToday = date === today;
                return (
                  <TouchableOpacity
                    key={ci}
                    style={styles.cell}
                    onPress={() => handleSelect(date)}
                    disabled={future}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.dayInner,
                      selected && { backgroundColor: fontColor },
                      !selected && isToday && { borderWidth: 1.5, borderColor: fontColor },
                    ]}>
                      <Text style={[
                        styles.dayNum,
                        selected && { color: '#fff', fontWeight: '700' },
                        !selected && isToday && { color: fontColor },
                        future && styles.futureDay,
                      ]}>{day}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#eee',
    backgroundColor: '#fafafa',
  },
  calIcon: { fontSize: 15 },
  chipText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#555' },
  caret: { fontSize: 10, color: '#aaa' },
  calWrap: {
    marginTop: 6, padding: 8,
    borderWidth: 1, borderColor: '#eee',
    borderRadius: 12, backgroundColor: '#fafafa',
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8,
  },
  navArrow: { fontSize: 22, color: '#555', fontWeight: '600' },
  navArrowDisabled: { color: '#ddd' },
  monthTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  weekLabel: { width: CELL, textAlign: 'center', fontSize: 11, color: '#aaa' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 13, color: '#333' },
  futureDay: { color: '#ccc' },
});
