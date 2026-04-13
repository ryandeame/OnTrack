import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useExerciseLogs, type ExerciseLog } from '@/hooks/use-exercise-logs';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

type ExerciseLogDayGroup = {
    key: string;
    date: Date;
    totalReps: number;
    entries: ExerciseLog[];
};

type ExerciseLogDaysListProps = {
    refreshTrigger?: number;
};

function buildDayKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function ExerciseLogDaysList({ refreshTrigger }: ExerciseLogDaysListProps) {
    const { list, remove } = useExerciseLogs();
    const { resolvedTheme } = useTheme();
    const themeColors = Colors[resolvedTheme];
    const [dayGroups, setDayGroups] = useState<ExerciseLogDayGroup[]>([]);
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

    const loadExerciseLogs = useCallback(async () => {
        try {
            const rows = await list(500);
            const byDay = new Map<string, ExerciseLogDayGroup>();

            for (const exerciseLog of rows) {
                const occurredAt = new Date(exerciseLog.occurred_at);
                const dayKey = buildDayKey(occurredAt);
                const existing = byDay.get(dayKey) ?? {
                    key: dayKey,
                    date: new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate()),
                    totalReps: 0,
                    entries: [],
                };

                existing.entries.push(exerciseLog);
                existing.totalReps += exerciseLog.sets * exerciseLog.reps;
                byDay.set(dayKey, existing);
            }

            for (const group of byDay.values()) {
                group.entries.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
            }

            setDayGroups(Array.from(byDay.values()).sort((a, b) => b.date.getTime() - a.date.getTime()));
        } catch (error) {
            console.error('Failed to load exercise logs', error);
        }
    }, [list]);

    useEffect(() => {
        loadExerciseLogs();
    }, [loadExerciseLogs, refreshTrigger]);

    const dayHeaderGradient = useMemo(() => [
        themeColors.navBackground,
        themeColors.menuBackground,
        themeColors.accentMuted,
    ] as const, [themeColors]);

    const getVolumeStatusColor = useCallback((totalReps: number) => {
        if (totalReps <= 60) return themeColors.success;
        if (totalReps <= 140) return themeColors.warning;
        return themeColors.danger;
    }, [themeColors]);

    const formatDayHeaderDate = useCallback((date: Date) => {
        const dayName = date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        return `${dayName} ${mm}/${dd}/${yy}`;
    }, []);

    const toggleDayExpanded = useCallback((dayKey: string) => {
        setExpandedDays((prev) => {
            const next = new Set(prev);
            if (next.has(dayKey)) {
                next.delete(dayKey);
            } else {
                next.add(dayKey);
            }
            return next;
        });
    }, []);

    const handleDeleteExerciseEntry = useCallback(async (exerciseLogId: number) => {
        const doDelete = async () => {
            await remove(exerciseLogId);
            await loadExerciseLogs();
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to delete this exercise entry?');
            if (confirmed) {
                await doDelete();
            }
            return;
        }

        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this exercise entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        void doDelete();
                    },
                },
            ]
        );
    }, [loadExerciseLogs, remove]);

    const renderExerciseDay = useCallback(({ item: dayGroup }: { item: ExerciseLogDayGroup }) => {
        const isDayExpanded = expandedDays.has(dayGroup.key);
        const statusColor = getVolumeStatusColor(dayGroup.totalReps);
        const entryCountLabel = `${dayGroup.entries.length} ${dayGroup.entries.length === 1 ? 'entry' : 'entries'}`;

        return (
            <View style={styles.dayContainer}>
                <Pressable
                    onPress={() => toggleDayExpanded(dayGroup.key)}
                    style={({ pressed }) => [styles.dayHeaderPressable, pressed && styles.dayHeaderPressed]}>
                    <LinearGradient
                        colors={dayHeaderGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0.8 }}
                        style={[styles.dayHeader, { borderColor: themeColors.navBorder }]}>
                        <View style={styles.dayHeaderLeft}>
                            <View style={[styles.dayDateIconWrap, { backgroundColor: themeColors.accentMuted }]}>
                                <MaterialIcons name="fitness-center" size={14} color={themeColors.accent} />
                            </View>
                            <View>
                                <ThemedText style={[styles.dayHeaderText, { color: themeColors.text }]}>{formatDayHeaderDate(dayGroup.date)}</ThemedText>
                                <ThemedText style={[styles.dayHeaderMeta, { color: themeColors.textSecondary }]}>{entryCountLabel}</ThemedText>
                            </View>
                        </View>

                        <View style={styles.dayHeaderRight}>
                            <View>
                                <ThemedText style={[styles.dayHeaderSummary, { color: themeColors.text }]}>{`${dayGroup.totalReps} reps`}</ThemedText>
                            </View>
                            <View style={[styles.dayStatusCircle, { backgroundColor: statusColor }]}>
                                <MaterialIcons
                                    name={isDayExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                                    size={18}
                                    color={themeColors.buttonText}
                                />
                            </View>
                        </View>
                    </LinearGradient>
                </Pressable>

                {isDayExpanded && (
                    <View style={styles.entriesContainer}>
                        {dayGroup.entries.map((exerciseEntry) => (
                            <ThemedView
                                key={exerciseEntry.id}
                                style={[
                                    styles.entryRow,
                                    { backgroundColor: themeColors.card, borderColor: themeColors.navBorder },
                                ]}>
                                <View style={styles.entryDetails}>
                                    <ThemedText type="defaultSemiBold">{exerciseEntry.name}</ThemedText>
                                    <ThemedText style={[styles.entryBodyText, { color: themeColors.textSecondary }]}>
                                        {`${exerciseEntry.sets} sets · ${exerciseEntry.reps} reps`}
                                    </ThemedText>
                                    <ThemedText style={[styles.entryBodyText, { color: themeColors.textSecondary }]}>
                                        {`${exerciseEntry.sets * exerciseEntry.reps} total reps`}
                                    </ThemedText>
                                    <ThemedText style={[styles.entryTime, { color: themeColors.textMuted }]}>
                                        {new Date(exerciseEntry.occurred_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </ThemedText>
                                </View>
                                <View style={styles.entryActions}>
                                    <Pressable
                                        onPress={() => handleDeleteExerciseEntry(exerciseEntry.id)}
                                        style={({ pressed }) => [
                                            styles.entryActionButton,
                                            {
                                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                                borderColor: themeColors.navBorder,
                                                opacity: pressed ? 0.82 : 1,
                                            },
                                        ]}
                                        accessibilityLabel={`Delete ${exerciseEntry.name}`}>
                                        <MaterialIcons name="delete-outline" size={18} color={themeColors.danger} />
                                    </Pressable>
                                </View>
                            </ThemedView>
                        ))}
                    </View>
                )}
            </View>
        );
    }, [dayHeaderGradient, expandedDays, formatDayHeaderDate, getVolumeStatusColor, handleDeleteExerciseEntry, themeColors, toggleDayExpanded]);

    return (
        <View style={styles.list}>
            <View style={styles.listContent}>
                {dayGroups.length > 0 ? (
                    dayGroups.map((dayGroup) => (
                        <View key={dayGroup.key}>
                            {renderExerciseDay({ item: dayGroup })}
                        </View>
                    ))
                ) : (
                    <ThemedView style={[styles.emptyCard, { backgroundColor: themeColors.card, borderColor: themeColors.navBorder }]}>
                        <ThemedText type="defaultSemiBold">No exercise logged yet.</ThemedText>
                        <ThemedText style={{ color: themeColors.textSecondary }}>Your next workout will show up here once it is saved.</ThemedText>
                    </ThemedView>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 24,
    },
    dayContainer: {
        marginBottom: 12,
    },
    dayHeaderPressable: {
        borderRadius: 20,
    },
    dayHeaderPressed: {
        opacity: 0.94,
    },
    dayHeader: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    dayHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    dayDateIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayHeaderText: {
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    dayHeaderMeta: {
        fontSize: 12,
        marginTop: 2,
    },
    dayHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginLeft: 12,
    },
    dayHeaderSummary: {
        fontWeight: '700',
        textAlign: 'right',
    },
    dayHeaderSummaryMuted: {
        fontSize: 12,
        marginTop: 2,
        textAlign: 'right',
    },
    dayStatusCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    entriesContainer: {
        paddingHorizontal: 8,
        paddingTop: 10,
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
        gap: 12,
    },
    entryDetails: {
        flex: 1,
    },
    entryBodyText: {
        fontSize: 14,
        marginTop: 2,
    },
    entryTime: {
        fontSize: 12,
        marginTop: 4,
    },
    entryActions: {
        flexDirection: 'row',
        gap: 8,
        alignSelf: 'flex-start',
    },
    entryActionButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    emptyCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        gap: 6,
    },
});
