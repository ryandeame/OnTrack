import DashboardHistoryChart from '@/components/dashboard-history-chart';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

type DayRow = {
  d: string;
  totalReps: number;
};

function formatDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildLastTenDays(rows: DayRow[]) {
  const map = new Map(rows.map((row) => [row.d, row]));
  const days: DayRow[] = [];

  for (let offset = 9; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = formatDayKey(date);
    days.push(map.get(key) ?? { d: key, totalReps: 0 });
  }

  return days;
}

export default function ExerciseDashboardScreen() {
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartContainerWidth, setChartContainerWidth] = useState(0);
  const { width } = useWindowDimensions();

  const cardBackground = useThemeColor({}, 'menuBackground');
  const muted = useThemeColor({}, 'tabIconDefault');
  const accent = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'inputPlaceholder');
  const chartLineColor = useThemeColor({}, 'chartLine');
  const chartAxisColor = useThemeColor({}, 'chartAxis');

  const fetchExerciseDashboardHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const { data: rpcRows, error: rpcError } = await supabase.rpc('get_exercise_dashboard_history', {
        timezone,
        days_count: 10,
      });

      if (rpcError) throw rpcError;

      const mapped = ((rpcRows as any[]) ?? []).map((row) => ({
        d: row.day_date,
        totalReps: Number(row.total_reps) || 0,
      }));

      setRows(buildLastTenDays(mapped));
    } catch (rpcFailure: any) {
      try {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 9);

        const { data, error: queryError } = await supabase
          .from('exercise_logs')
          .select('occurred_at, sets, reps')
          .gte('occurred_at', startDate.toISOString())
          .order('occurred_at', { ascending: true });

        if (queryError) throw queryError;

        const byDay = new Map<string, DayRow>();
        for (const row of data ?? []) {
          const date = new Date(row.occurred_at);
          const key = formatDayKey(date);
          const current = byDay.get(key) ?? { d: key, totalReps: 0 };
          current.totalReps += (Number(row.sets) || 0) * (Number(row.reps) || 0);
          byDay.set(key, current);
        }

        setRows(buildLastTenDays(Array.from(byDay.values())));
      } catch (fallbackError: any) {
        setRows(buildLastTenDays([]));
        setError(fallbackError?.message || rpcFailure?.message || 'Unable to load exercise dashboard history.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExerciseDashboardHistory();
    }, [fetchExerciseDashboardHistory])
  );

  const averageValue = useMemo(() => {
    if (rows.length === 0) return 0;
    const total = rows.reduce((sum, row) => sum + row.totalReps, 0);
    return total / rows.length;
  }, [rows]);

  const bestDay = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.reduce((best, row) => (row.totalReps > best.totalReps ? row : best), rows[0]);
  }, [rows]);

  const chartData = useMemo(
    () => rows.map((row) => ({
      day: row.d.slice(5),
      value: row.totalReps,
    })),
    [rows]
  );

  const chartOuterWidth = useMemo(
    () => Math.max(220, Math.floor(chartContainerWidth || (width - 32))),
    [chartContainerWidth, width]
  );

  return (
    <ThemedView style={styles.screen} useImageBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>
        <ThemedText style={[styles.subtitle, { color: muted }]}>Exercise reps from Supabase over the last 10 days.</ThemedText>

        <View
          style={[styles.panel, { backgroundColor: cardBackground, borderColor: border }]}
          onLayout={(event) => {
            const measuredWidth = Math.floor(event.nativeEvent.layout.width - 32);
            setChartContainerWidth((prev) => (prev === measuredWidth ? prev : measuredWidth));
          }}>
          <ThemedText type="subtitle">Last 10 days</ThemedText>
          <ThemedText style={[styles.panelCaption, { color: muted }]}>Daily total reps</ThemedText>

          {loading ? (
            <ThemedText style={{ color: muted }}>Loading dashboard data...</ThemedText>
          ) : chartData.length > 0 ? (
            <DashboardHistoryChart
              chartData={chartData}
              chartWidth={chartOuterWidth}
              chartLineColor={chartLineColor}
              chartAxisColor={chartAxisColor}
            />
          ) : (
            <ThemedText style={{ color: muted }}>No data to chart yet.</ThemedText>
          )}
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor: border }]}>
            <ThemedText style={[styles.metricLabel, { color: muted }]}>Average</ThemedText>
            <ThemedText type="title" style={styles.metricValue}>{Math.round(averageValue)}</ThemedText>
            <ThemedText style={{ color: muted }}>total reps per day</ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor: border }]}>
            <ThemedText style={[styles.metricLabel, { color: muted }]}>Best Day</ThemedText>
            <ThemedText type="title" style={styles.metricValue}>{Math.round(bestDay?.totalReps ?? 0)}</ThemedText>
            <ThemedText style={{ color: muted }}>{bestDay ? new Date(bestDay.d).toLocaleDateString() : 'No data yet'}</ThemedText>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: cardBackground, borderColor: border }]}>
          <ThemedText type="subtitle">Last 10 days</ThemedText>
          <ThemedText style={[styles.panelCaption, { color: muted }]}>Day-by-day reps from the same exercise history feed.</ThemedText>

          {loading ? (
            <ThemedText style={{ color: muted }}>Loading dashboard data...</ThemedText>
          ) : (
            <View style={styles.rows}>
              {rows.map((row) => (
                <View key={row.d} style={[styles.dayRow, { borderBottomColor: border }]}>
                  <View>
                    <ThemedText type="defaultSemiBold">{new Date(row.d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</ThemedText>
                    <ThemedText style={{ color: muted }}>{row.d}</ThemedText>
                  </View>
                  <View style={styles.dayValueWrap}>
                    <ThemedText type="defaultSemiBold" style={{ color: accent }}>{Math.round(row.totalReps)}</ThemedText>
                    <ThemedText style={{ color: muted }}>total reps</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!!error && <ThemedText style={[styles.errorText, { color: '#ef4444' }]}>{error}</ThemedText>}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    marginTop: 16,
    lineHeight: 42,
  },
  subtitle: {
    marginTop: -4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  metricLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    lineHeight: 36,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  panelCaption: {
    marginTop: -2,
  },
  rows: {
    gap: 2,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayValueWrap: {
    alignItems: 'flex-end',
  },
  errorText: {
    marginTop: 4,
  },
});
