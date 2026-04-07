import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  value: Date;
  onChange: (d: Date) => void;
  onClose: () => void;
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function DateTimePicker({ visible, value, onChange, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const themeColors = Colors[resolvedTheme];

  // Dynamic input styles based on theme
  const timeInputStyle = useMemo(() => ({
    ...styles.timeInput,
    backgroundColor: themeColors.inputBackground,
    color: themeColors.inputText,
    borderColor: themeColors.inputPlaceholder,
  }), [themeColors]);

  // Dynamic cell styles based on theme
  const cellSelectedStyle = useMemo(() => ({
    backgroundColor: themeColors.foodLogBtnBg,
  }), [themeColors]);

  const cellTextStyle = useMemo(() => ({
    ...styles.cellText,
    color: themeColors.text,
  }), [themeColors]);

  const cellTextSelectedStyle = useMemo(() => ({
    color: themeColors.foodLogBtnText,
  }), [themeColors]);

  const [temp, setTemp] = useState<Date>(value);
  const y = temp.getFullYear();
  const m = temp.getMonth();
  const d = temp.getDate();
  const hh = temp.getHours();
  const mm = temp.getMinutes();
  const ss = temp.getSeconds();
  const [hourStr, setHourStr] = useState(String(hh).padStart(2, '0'));
  const [minuteStr, setMinuteStr] = useState(String(mm).padStart(2, '0'));
  const [secondStr, setSecondStr] = useState(String(ss).padStart(2, '0'));

  const monthName = temp.toLocaleString(undefined, { month: 'long' });

  const grid = useMemo(() => {
    const first = new Date(y, m, 1);
    const firstDow = first.getDay(); // 0-6 (Sun-Sat)
    const total = daysInMonth(y, m);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let i = 1; i <= total; i++) cells.push(i);
    // Always pad to 6 rows (42 cells) for consistent height
    while (cells.length < 42) cells.push(null);
    return cells;
  }, [y, m]);

  const changeMonth = (delta: number) => {
    const next = new Date(temp);
    next.setMonth(m + delta);
    setTemp(next);
  };

  const pickDay = (day: number) => {
    const next = new Date(temp);
    next.setDate(day);
    setTemp(next);
  };

  // Update display strings whenever time changes (not while typing)
  useEffect(() => {
    setHourStr(String(hh).padStart(2, '0'));
    setMinuteStr(String(mm).padStart(2, '0'));
    setSecondStr(String(ss).padStart(2, '0'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hh, mm, ss]);

  // Reset picker state when opened or when value changes while open
  useEffect(() => {
    if (visible) {
      setTemp(value);
      const v = value;
      setHourStr(String(v.getHours()).padStart(2, '0'));
      setMinuteStr(String(v.getMinutes()).padStart(2, '0'));
      setSecondStr(String(v.getSeconds()).padStart(2, '0'));
    }
  }, [visible, value]);

  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

  const commitHour = () => {
    const n = Number.isFinite(parseInt(hourStr, 10)) ? clamp(parseInt(hourStr, 10), 0, 23) : 0;
    const next = new Date(temp);
    next.setHours(n);
    setTemp(next);
    setHourStr(String(n).padStart(2, '0'));
  };

  const commitMinute = () => {
    const n = Number.isFinite(parseInt(minuteStr, 10)) ? clamp(parseInt(minuteStr, 10), 0, 59) : 0;
    const next = new Date(temp);
    next.setMinutes(n);
    setTemp(next);
    setMinuteStr(String(n).padStart(2, '0'));
  };

  const commitSecond = () => {
    const n = Number.isFinite(parseInt(secondStr, 10)) ? clamp(parseInt(secondStr, 10), 0, 59) : 0;
    const next = new Date(temp);
    next.setSeconds(n);
    setTemp(next);
    setSecondStr(String(n).padStart(2, '0'));
  };

  const commitAll = (): Date => {
    const next = new Date(temp);
    const h = Number.isFinite(parseInt(hourStr, 10)) ? clamp(parseInt(hourStr, 10), 0, 23) : 0;
    const m = Number.isFinite(parseInt(minuteStr, 10)) ? clamp(parseInt(minuteStr, 10), 0, 59) : 0;
    const s = Number.isFinite(parseInt(secondStr, 10)) ? clamp(parseInt(secondStr, 10), 0, 59) : 0;
    next.setHours(h);
    next.setMinutes(m);
    next.setSeconds(s);
    setTemp(next);
    setHourStr(String(h).padStart(2, '0'));
    setMinuteStr(String(m).padStart(2, '0'));
    setSecondStr(String(s).padStart(2, '0'));
    return next;
  };

  const applyNow = () => {
    const now = new Date();
    setTemp(now);
    setHourStr(String(now.getHours()).padStart(2, '0'));
    setMinuteStr(String(now.getMinutes()).padStart(2, '0'));
    setSecondStr(String(now.getSeconds()).padStart(2, '0'));
  };

  const apply = () => {
    const next = commitAll();
    onChange(new Date(next));
    onClose();
  };

  const cancel = () => {
    setTemp(value);
    onClose();
  };

  const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={cancel}>
      <View style={[styles.backdrop, { backgroundColor: themeColors.modalBackdrop }]}>
        <ThemedView style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}>
          <View style={styles.header}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn}>
              <ThemedText>{'<'}</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">{`${monthName} ${y}`}</ThemedText>
            <Pressable onPress={() => changeMonth(1)} style={styles.navBtn}>
              <ThemedText>{'>'}</ThemedText>
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
              <ThemedText key={w} style={styles.weekCell}>{w}</ThemedText>
            ))}
          </View>
          <View style={styles.grid}>
            {grid.map((day, idx) => {
              const isSelected = day != null && isSameDay(new Date(y, m, day), temp);
              return (
                <Pressable
                  key={idx}
                  onPress={() => day && pickDay(day)}
                  disabled={day == null}
                  style={[styles.cell, isSelected && cellSelectedStyle, day == null && styles.cellEmpty]}
                >
                  <ThemedText style={[cellTextStyle, isSelected && cellTextSelectedStyle]}>{day ?? ''}</ThemedText>
                </Pressable>
              );
            })}
          </View>
          {/* Time row: time inputs centered on left, Now button on right */}
          <View style={styles.timeRow}>
            <View style={styles.timeContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ThemedText>Time</ThemedText>
                <TextInput
                  value={hourStr}
                  onChangeText={(t) => setHourStr(t.replace(/[^0-9]/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  style={timeInputStyle}
                  maxLength={2}
                  onEndEditing={commitHour}
                />
                <ThemedText>:</ThemedText>
                <TextInput
                  value={minuteStr}
                  onChangeText={(t) => setMinuteStr(t.replace(/[^0-9]/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  style={timeInputStyle}
                  maxLength={2}
                  onEndEditing={commitMinute}
                />
                <ThemedText>:</ThemedText>
                <TextInput
                  value={secondStr}
                  onChangeText={(t) => setSecondStr(t.replace(/[^0-9]/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  style={timeInputStyle}
                  maxLength={2}
                  onEndEditing={commitSecond}
                />
              </View>
            </View>
            <Pressable
              onPress={applyNow}
              style={[
                styles.btn,
                styles.btnUnified,
                {
                  backgroundColor: themeColors.foodLogBtnBg,
                  borderColor: themeColors.inputPlaceholder,
                  borderWidth: 1,
                }
              ]}
            >
              <ThemedText style={{ color: themeColors.foodLogBtnText, fontWeight: '600' }}>Now</ThemedText>
            </Pressable>
          </View>

          {/* Footer: Cancel on left, Set on right */}
          <View style={styles.footer}>
            <Pressable
              onPress={cancel}
              style={[
                styles.btn,
                styles.btnUnified,
                {
                  backgroundColor: themeColors.calculatorCancelBtn,
                  borderColor: themeColors.calculatorCancelBorder,
                  borderWidth: 1,
                }
              ]}
            >
              <ThemedText style={{ color: themeColors.calculatorCancelText, fontWeight: '600' }}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={apply}
              style={[
                styles.btn,
                styles.btnUnified,
                {
                  backgroundColor: themeColors.foodLogBtnBg,
                  borderColor: themeColors.inputPlaceholder,
                  borderWidth: 1,
                }
              ]}
            >
              <ThemedText style={{ color: themeColors.foodLogBtnText, fontWeight: '600' }}>Set</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxWidth: 800,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navBtn: {
    padding: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekCell: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  cellEmpty: {
    opacity: 0.3,
  },
  cellText: {
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  timeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 44,
    maxWidth: 52,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnUnified: {
    minWidth: 80,
    alignItems: 'center',
  },
});
