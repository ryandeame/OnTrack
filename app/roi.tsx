import Collapsible from '@/components/collapsible';
import CompactCalendar from '@/components/compact-calendar';
import { GradientProgressRing } from '@/components/gradient-progress-ring';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, type ThemeName } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useDailyCalories, useYesterdaySpend } from '@/hooks/use-daily-calories';
import { formatTime, useTodayFoodLogs } from '@/hooks/use-today-food-logs';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

type DailySummaryPalette = {
    background: string;
    backgroundAlt: string;
    cardBackground: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    ringCenter: string;
    softPrimary: string;
    softSecondary: string;
    softNeutral: string;
};

const CALORIE_GOAL = 2000;
const SPEND_GOAL = 10;

function withOpacity(hex: string, opacity: number) {
    const normalized = hex.replace('#', '');
    const safe = normalized.length === 3
        ? normalized.split('').map((char) => `${char}${char}`).join('')
        : normalized;

    const red = Number.parseInt(safe.slice(0, 2), 16);
    const green = Number.parseInt(safe.slice(2, 4), 16);
    const blue = Number.parseInt(safe.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function isInverseTheme(themeName: ThemeName) {
    return themeName.endsWith('Inverse');
}

function getDailySummaryPalette(themeName: ThemeName): DailySummaryPalette {
    const themeColors = Colors[themeName];
    const inverse = isInverseTheme(themeName);

    return {
        background: themeColors.background,
        backgroundAlt: themeColors.navBackground,
        cardBackground: withOpacity(themeColors.accentSecondary, inverse ? 0.08 : 0.11),
        cardBorder: withOpacity(themeColors.accent, inverse ? 0.16 : 0.18),
        text: themeColors.text,
        textSecondary: themeColors.textSecondary,
        textMuted: themeColors.textMuted,
        primary: themeColors.accent,
        secondary: themeColors.accentSecondary,
        success: themeColors.success,
        warning: themeColors.warning,
        danger: themeColors.danger,
        ringCenter: inverse ? themeColors.navBackground : '#120F22',
        softPrimary: withOpacity(themeColors.accent, inverse ? 0.09 : 0.14),
        softSecondary: withOpacity(themeColors.accentSecondary, inverse ? 0.09 : 0.14),
        softNeutral: inverse ? 'rgba(99, 115, 129, 0.12)' : 'rgba(71, 85, 105, 0.22)',
    };
}

function formatNumber(num: number): string {
    return num.toLocaleString();
}

function isSameDay(first: Date, second: Date): boolean {
    return first.getFullYear() === second.getFullYear()
        && first.getMonth() === second.getMonth()
        && first.getDate() === second.getDate();
}

function formatDateHeadline(date: Date): string {
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function ROIScreen() {
    const { resolvedTheme } = useTheme();
    const palette = useMemo(() => getDailySummaryPalette(resolvedTheme), [resolvedTheme]);
    const styles = useMemo(() => createStyles(palette), [palette]);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarVisible, setCalendarVisible] = useState(false);

    const { summary, loading, refresh } = useDailyCalories(selectedDate);
    const { items: foodItems, loading: foodLoading, refresh: refreshFoodLogs } = useTodayFoodLogs(selectedDate);
    const { yesterdaySpend, refresh: refreshYesterdaySpend } = useYesterdaySpend(selectedDate);

    useFocusEffect(
        useCallback(() => {
            refresh();
            refreshFoodLogs();
            refreshYesterdaySpend();
        }, [refresh, refreshFoodLogs, refreshYesterdaySpend])
    );

    const handleDateSelect = useCallback((date: Date) => {
        setCalendarVisible(false);
        setTimeout(() => {
            setSelectedDate(date);
        }, 350);
    }, []);

    const progressPercent = Math.round((summary.totalCalories / CALORIE_GOAL) * 100);
    const spendPercentChange = yesterdaySpend > 0
        ? Math.round(((summary.totalSpend - yesterdaySpend) / yesterdaySpend) * 100)
        : 0;
    const isToday = isSameDay(selectedDate, new Date());
    const logTitle = isToday ? "Today's Log" : `${formatDateHeadline(selectedDate)} Log`;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[palette.background, palette.backgroundAlt]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerTextWrap}>
                            <View style={styles.pageTitleWrap}>
                                <ThemedText style={styles.pageTitle}>Daily Summary</ThemedText>
                            </View>
                            <ThemedText style={styles.dateText}>{formatDateHeadline(selectedDate)}</ThemedText>
                        </View>
                        <Pressable style={styles.calendarButton} onPress={() => setCalendarVisible((current) => !current)}>
                            <MaterialIcons
                                name={calendarVisible ? 'keyboard-arrow-down' : 'calendar-month'}
                                size={16}
                                color={palette.primary}
                            />
                            <ThemedText style={styles.calendarButtonText}>
                                {calendarVisible ? 'Hide Calendar' : 'Select Date'}
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>

                <Collapsible expanded={calendarVisible} duration={350}>
                    <View style={styles.calendarWrap}>
                        <CompactCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
                    </View>
                </Collapsible>

                <View style={styles.summaryGrid}>
                    <View style={styles.glassCard}>
                        <LinearGradient colors={[palette.secondary, palette.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardStrip} />
                        <ThemedText style={styles.eyebrow}>Daily Spend</ThemedText>
                        {loading ? (
                            <ActivityIndicator size="small" color={palette.primary} style={styles.metricLoader} />
                        ) : (
                            <>
                                <View style={styles.primaryMetricWrap}>
                                    <ThemedText style={styles.primaryMetric}>${summary.totalSpend.toFixed(2)}</ThemedText>
                                </View>
                                <ThemedText style={styles.goalLabel}>${SPEND_GOAL.toFixed(2)} goal</ThemedText>
                            </>
                        )}
                        {yesterdaySpend > 0 && spendPercentChange !== 0 && (
                            <View style={styles.changeBadge}>
                                <View style={styles.changeBadgeContent}>
                                    <MaterialIcons
                                        name={spendPercentChange >= 0 ? 'trending-up' : 'trending-down'}
                                        size={12}
                                        color={palette.primary}
                                    />
                                    <ThemedText style={styles.changeBadgeText}>
                                        {spendPercentChange >= 0 ? '+' : ''}
                                        {spendPercentChange}% vs yesterday
                                    </ThemedText>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={[styles.glassCard, styles.centerCard]}>
                        <LinearGradient colors={[palette.primary, palette.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardStrip} />
                        <View style={styles.ringWrap}>
                            <GradientProgressRing
                                size={110}
                                strokeWidth={7}
                                progressPercent={progressPercent}
                                trackColor={palette.softNeutral}
                                startColor={palette.primary}
                                endColor={palette.secondary}>
                                <View style={styles.ringInner}>
                                    {loading ? (
                                        <ActivityIndicator size="small" color={palette.primary} />
                                    ) : (
                                        <>
                                            <ThemedText style={styles.ringValue}>{formatNumber(summary.totalCalories)}</ThemedText>
                                            <ThemedText style={styles.ringLabel}>kcal</ThemedText>
                                        </>
                                    )}
                                </View>
                            </GradientProgressRing>
                        </View>
                        <ThemedText style={styles.goalLabel}>Goal: {formatNumber(CALORIE_GOAL)} kcal</ThemedText>
                        <ThemedText style={styles.progressCaption}>{loading ? '...' : `${progressPercent}% of target`}</ThemedText>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.macroRow}>
                    <View style={[styles.macroChip, { backgroundColor: palette.softPrimary, borderColor: withOpacity(palette.primary, 0.28) }]}>
                        <View style={[styles.macroDot, { backgroundColor: palette.primary }]} />
                        <ThemedText style={styles.macroText}>{loading ? 'PROTEIN ...' : `PROTEIN ${summary.totalProtein}g`}</ThemedText>
                    </View>
                    <View style={[styles.macroChip, { backgroundColor: palette.softSecondary, borderColor: withOpacity(palette.secondary, 0.28) }]}>
                        <View style={[styles.macroDot, { backgroundColor: palette.secondary }]} />
                        <ThemedText style={styles.macroText}>{loading ? 'CARBS ...' : `CARBS ${summary.totalCarbs}g`}</ThemedText>
                    </View>
                </ScrollView>

                <View style={styles.logSection}>
                    <View style={styles.logHeader}>
                        <ThemedText style={styles.logTitle}>{logTitle}</ThemedText>
                        <ThemedText style={styles.logCount}>{foodItems.length} items</ThemedText>
                    </View>

                    {foodLoading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="small" color={palette.primary} />
                        </View>
                    ) : foodItems.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="lunch-dining" size={40} color={palette.textSecondary} />
                            <ThemedText style={styles.emptyText}>No food logged {isToday ? 'today' : 'for this day'}.</ThemedText>
                        </View>
                    ) : (
                        foodItems.map((item) => {
                            return (
                                <View key={item.id} style={styles.logCard}>
                                    <View style={[styles.logIconWrap, { backgroundColor: palette.softPrimary }]}>
                                        <MaterialIcons name="restaurant" size={22} color={palette.primary} />
                                    </View>
                                    <View style={styles.logCopy}>
                                        <ThemedText style={styles.logItemTitle} numberOfLines={2}>{item.name}</ThemedText>
                                        <ThemedText style={styles.logItemMeta}>{`${item.grams}g • ${formatTime(item.eatenAt)}`}</ThemedText>
                                    </View>
                                    <View style={styles.logValues}>
                                        <ThemedText style={styles.logMetric}>{item.calories}</ThemedText>
                                        <ThemedText style={styles.logMetricLabel}>kcal</ThemedText>
                                        <ThemedText style={styles.logPrice}>
                                            {item.cost !== null ? `$${item.cost.toFixed(2)}` : '-'}
                                        </ThemedText>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (palette: DailySummaryPalette) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 32,
        paddingBottom: 36,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 18,
    },
    headerRow: {
        minHeight: 72,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: 12,
    },
    headerTextWrap: {
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
        justifyContent: 'center',
    },
    pageTitleWrap: {
        minHeight: 40,
        justifyContent: 'center',
    },
    pageTitle: {
        fontSize: 28,
        lineHeight: 36,
        fontWeight: '800',
        color: palette.text,
        letterSpacing: -0.8,
        fontFamily: Fonts.rounded,
        flexShrink: 1,
    },
    dateText: {
        marginTop: 4,
        color: palette.primary,
        fontSize: 16,
        fontWeight: '600',
        fontFamily: Fonts.rounded,
        flexShrink: 1,
    },
    calendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flexShrink: 1,
        width: 128,
        height: '100%',
        paddingHorizontal: 14,
        paddingVertical: 0,
        borderRadius: 999,
        backgroundColor: withOpacity(palette.primary, 0.1),
        borderWidth: 1,
        borderColor: withOpacity(palette.primary, 0.18),
    },
    calendarButtonText: {
        color: palette.primary,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: Fonts.rounded,
        flexShrink: 1,
        textAlign: 'center',
        includeFontPadding: false,
    },
    calendarWrap: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    summaryGrid: {
        paddingHorizontal: 24,
        flexDirection: 'row',
        gap: 14,
    },
    glassCard: {
        flex: 1,
        minHeight: 210,
        padding: 18,
        borderRadius: 24,
        backgroundColor: palette.cardBackground,
        borderWidth: 1,
        borderColor: palette.cardBorder,
        overflow: 'hidden',
    },
    centerCard: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        opacity: 0.9,
    },
    eyebrow: {
        color: palette.textSecondary,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        fontFamily: Fonts.rounded,
    },
    metricLoader: {
        marginTop: 20,
    },
    primaryMetric: {
        color: palette.text,
        fontSize: 34,
        lineHeight: 42,
        fontWeight: '800',
        letterSpacing: -1,
        fontFamily: Fonts.rounded,
    },
    primaryMetricWrap: {
        minHeight: 46,
        justifyContent: 'center',
        marginTop: 14,
    },
    goalLabel: {
        marginTop: 6,
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        fontFamily: Fonts.rounded,
    },
    changeBadge: {
        marginTop: 10,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: withOpacity(palette.primary, 0.14),
    },
    changeBadgeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
    },
    changeBadgeText: {
        width: 72,
        color: palette.primary,
        fontSize: 10,
        lineHeight: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        textAlign: 'left',
        includeFontPadding: false,
        fontFamily: Fonts.rounded,
    },
    ringWrap: {
        marginTop: 10,
        marginBottom: 12,
    },
    ringInner: {
        width: 96,
        height: 96,
        borderRadius: 999,
        backgroundColor: palette.ringCenter,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringValue: {
        color: palette.text,
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.6,
        fontFamily: Fonts.rounded,
    },
    ringLabel: {
        marginTop: 2,
        color: palette.textSecondary,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: Fonts.rounded,
    },
    progressCaption: {
        marginTop: 2,
        color: palette.textMuted,
        fontSize: 11,
        fontWeight: '700',
        fontFamily: Fonts.rounded,
    },
    macroRow: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 6,
        gap: 10,
    },
    macroChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
    },
    macroDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    macroText: {
        color: palette.text,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.4,
        fontFamily: Fonts.rounded,
    },
    logSection: {
        paddingHorizontal: 24,
        paddingTop: 14,
        gap: 12,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    logTitle: {
        color: palette.text,
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.4,
        fontFamily: Fonts.rounded,
    },
    logCount: {
        color: palette.primary,
        fontSize: 13,
        fontWeight: '700',
        fontFamily: Fonts.rounded,
    },
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 20,
        backgroundColor: palette.cardBackground,
        borderWidth: 1,
        borderColor: palette.cardBorder,
    },
    logIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logCopy: {
        flex: 1,
    },
    logItemTitle: {
        color: palette.text,
        fontSize: 16,
        fontWeight: '700',
        fontFamily: Fonts.rounded,
    },
    logItemMeta: {
        marginTop: 3,
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '500',
        fontFamily: Fonts.rounded,
    },
    logValues: {
        alignItems: 'flex-end',
    },
    logMetric: {
        color: palette.text,
        fontSize: 18,
        fontWeight: '800',
        fontFamily: Fonts.rounded,
    },
    logMetricLabel: {
        color: palette.textMuted,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        fontFamily: Fonts.rounded,
    },
    logPrice: {
        marginTop: 6,
        color: palette.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        fontFamily: Fonts.rounded,
    },
    emptyState: {
        minHeight: 140,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: palette.cardBackground,
        borderWidth: 1,
        borderColor: palette.cardBorder,
    },
    emptyText: {
        color: palette.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        fontFamily: Fonts.rounded,
    },
});
