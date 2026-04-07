import Collapsible from '@/components/collapsible';
import CompactCalendar from '@/components/compact-calendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, type ThemeName } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useDailyCalories, useYesterdaySpend } from '@/hooks/use-daily-calories';
import { formatTime, useTodayFoodLogs } from '@/hooks/use-today-food-logs';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

type DailySummaryColors = {
    primary: string;
    backgroundDark: string;
    cardDark: string;
    surfaceDark: string;
    textPrimary: string;
    textSecondary: string;
    orange: string;
    red: string;
    yellow: string;
    cardBorder: string;
};

function getDailySummaryColors(resolvedTheme: ThemeName): DailySummaryColors {
    const themeColors = Colors[resolvedTheme];

    return {
        primary: themeColors.accent,
        backgroundDark: themeColors.background,
        cardDark: themeColors.card,
        surfaceDark: themeColors.menuBackground,
        textPrimary: themeColors.text,
        textSecondary: themeColors.textSecondary,
        orange: themeColors.warning,
        red: themeColors.danger,
        yellow: '#eab308',
        cardBorder: themeColors.cardBorder,
    };
}

// Calorie goal (can be made configurable later)
const CALORIE_GOAL = 2200;

// Daily spend goal in USD
const SPEND_GOAL = 10;

// Format number with commas (e.g., 1850 -> "1,850")
function formatNumber(num: number): string {
    return num.toLocaleString();
}

// Check if two dates are the same day
function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

// Format date for headline (e.g., "Dec 27, 2024" or "Today, Dec 27")
function formatDateHeadline(date: Date): string {
    const today = new Date();
    const dateString = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    if (isSameDay(date, today)) {
        return dateString;
    }
    return dateString;
}

export default function ROIScreen() {
    const { resolvedTheme } = useTheme();
    const colors = useMemo(() => getDailySummaryColors(resolvedTheme), [resolvedTheme]);
    const styles = useMemo(() => createStyles(colors), [colors]);

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

    const handleDateSelect = (date: Date) => {
        setCalendarVisible(false);
        setTimeout(() => {
            setSelectedDate(date);
        }, 500);
    };

    const toggleCalendar = () => {
        setCalendarVisible(!calendarVisible);
    };

    const progressPercent = Math.round((summary.totalCalories / CALORIE_GOAL) * 100);
    const isOverGoal = progressPercent > 100;

    const spendPercentChange = yesterdaySpend > 0
        ? Math.round(((summary.totalSpend - yesterdaySpend) / yesterdaySpend) * 100)
        : 0;
    const isSpendHigher = spendPercentChange > 0;

    const isToday = isSameDay(selectedDate, new Date());
    const logTitle = isToday ? "Today's Log" : `${formatDateHeadline(selectedDate)} Log`;

    return (
        <ThemedView style={styles.container} useImageBackground>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.dateHeadline}>
                    <View>
                        <ThemedText style={styles.pageTitle}>Daily Summary</ThemedText>
                        <ThemedText style={styles.dateText}>{formatDateHeadline(selectedDate)}</ThemedText>
                    </View>
                    <Pressable
                        style={styles.calendarButton}
                        onPress={toggleCalendar}
                    >
                        <ThemedText style={styles.calendarButtonText}>
                            {calendarVisible ? 'Hide Calendar' : 'View Calendar'}
                        </ThemedText>
                        <MaterialIcons name={calendarVisible ? "keyboard-arrow-up" : "calendar-month"} size={16} color={colors.textSecondary} />
                    </Pressable>
                </View>

                <Collapsible expanded={calendarVisible} duration={500}>
                    <View style={styles.calendarContainer}>
                        <CompactCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
                    </View>
                </Collapsible>

                <View style={styles.cardsContainer}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(19, 236, 109, 0.1)' }]}>
                                <MaterialIcons name="attach-money" size={24} color={colors.primary} />
                            </View>
                            {yesterdaySpend > 0 && spendPercentChange !== 0 && (
                                <View style={isSpendHigher ? styles.changeBadgeRed : styles.changeBadgeGreen}>
                                    <ThemedText style={isSpendHigher ? styles.changeBadgeTextRed : styles.changeBadgeTextGreen}>
                                        {isSpendHigher ? '+' : ''}{spendPercentChange}% vs previous day
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                        <View style={styles.cardContent}>
                            <ThemedText style={styles.cardLabel}>Daily Spend</ThemedText>
                            <View style={styles.valueRow}>
                                {loading ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <>
                                        <ThemedText style={styles.cardValue}>${summary.totalSpend.toFixed(2)}</ThemedText>
                                        <ThemedText style={styles.cardSubvalue}> / ${SPEND_GOAL.toFixed(2)} goal</ThemedText>
                                    </>
                                )}
                            </View>
                            {!loading && (
                                <View style={styles.dollarIndicator}>
                                    {(() => {
                                        const spendRatio = summary.totalSpend / SPEND_GOAL;
                                        if (spendRatio <= 0.5) {
                                            return <ThemedText style={[styles.dollarSign, { color: colors.primary }]}>$</ThemedText>;
                                        } else if (spendRatio <= 1.0) {
                                            return <ThemedText style={[styles.dollarSign, { color: colors.yellow }]}>$$</ThemedText>;
                                        } else if (spendRatio <= 1.1) {
                                            return <ThemedText style={[styles.dollarSign, { color: '#f87171' }]}>$$$</ThemedText>;
                                        } else {
                                            return <ThemedText style={[styles.dollarSign, { color: colors.red }]}>$$$$</ThemedText>;
                                        }
                                    })()}
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={[styles.card, styles.caloriesCard]}>
                        <View style={styles.caloriesContent}>
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                                <MaterialIcons name="local-fire-department" size={24} color={colors.orange} />
                            </View>
                            <ThemedText style={styles.cardLabel}>Calories</ThemedText>
                            {loading ? (
                                <ActivityIndicator size="small" color={colors.orange} style={{ marginVertical: 8 }} />
                            ) : (
                                <>
                                    <View style={styles.valueRow}>
                                        <ThemedText style={styles.cardValue}>{formatNumber(summary.totalCalories)}</ThemedText>
                                        <ThemedText style={[styles.cardSubvalue, { color: colors.orange }]}>kcal</ThemedText>
                                    </View>
                                    <ThemedText style={styles.goalText}>Goal: {formatNumber(CALORIE_GOAL)} kcal</ThemedText>
                                </>
                            )}
                        </View>
                        <View style={styles.donutContainer}>
                            <View style={[styles.donutOuter, isOverGoal && { borderColor: colors.red }]}>
                                <View style={styles.donutInner}>
                                    <ThemedText style={[styles.donutText, isOverGoal && { color: colors.red }]}>
                                        {loading ? '...' : `${progressPercent}%`}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.macrosScroll}>
                    <View style={styles.macroChip}>
                        <View style={[styles.macroDot, { backgroundColor: colors.primary }]} />
                        <View>
                            <ThemedText style={styles.macroLabel}>PROTEIN</ThemedText>
                            <ThemedText style={styles.macroValue}>{loading ? '...' : `${summary.totalProtein}g`}</ThemedText>
                        </View>
                    </View>
                    <View style={styles.macroChip}>
                        <View style={[styles.macroDot, { backgroundColor: colors.yellow }]} />
                        <View>
                            <ThemedText style={styles.macroLabel}>CARBS</ThemedText>
                            <ThemedText style={styles.macroValue}>{loading ? '...' : `${summary.totalCarbs}g`}</ThemedText>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.activitySection}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>{logTitle}</ThemedText>
                        <ThemedText style={styles.seeAllButton}>{foodItems.length} items</ThemedText>
                    </View>

                    {foodLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : foodItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="lunch-dining" size={48} color={colors.textSecondary} />
                            <ThemedText style={styles.emptyText}>No food logged {isToday ? 'today' : 'on this day'}</ThemedText>
                        </View>
                    ) : (
                        foodItems.map((item) => (
                            <View key={item.id} style={styles.logItem}>
                                <View style={styles.logItemIconContainer}>
                                    <MaterialIcons name="lunch-dining" size={24} color={colors.textSecondary} />
                                </View>
                                <View style={styles.logItemInfo}>
                                    <ThemedText style={styles.logItemTitle} numberOfLines={2}>{item.name}</ThemedText>
                                    <ThemedText style={styles.logItemSubtitle}>{item.grams}g • {formatTime(item.eatenAt)}</ThemedText>
                                </View>
                                <View style={styles.logItemValues}>
                                    <ThemedText style={styles.logItemPrice}>
                                        {item.cost !== null ? `$${item.cost.toFixed(2)}` : '-'}
                                    </ThemedText>
                                    <View style={styles.badgeRow}>
                                        {item.hasProtein ? (
                                            <View style={styles.proteinBadge}>
                                                <ThemedText style={styles.proteinBadgeText}>
                                                    {item.costPer10gProtein !== null
                                                        ? `$${item.costPer10gProtein.toFixed(2)}/10g`
                                                        : '-/10g'}
                                                </ThemedText>
                                                <ThemedText style={styles.proteinBadgeText}>protein</ThemedText>
                                            </View>
                                        ) : (
                                            <View style={styles.noProteinBadge}>
                                                <ThemedText style={styles.noProteinBadgeText}>no protein</ThemedText>
                                            </View>
                                        )}
                                        <View style={styles.caloriesBadge}>
                                            <ThemedText style={styles.caloriesBadgeText}>{item.calories} kcal</ThemedText>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const createStyles = (colors: DailySummaryColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundDark,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 24,
        paddingBottom: 32,
    },
    dateHeadline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    dateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 4,
    },
    calendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surfaceDark,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    calendarButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    calendarContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    cardsContainer: {
        paddingHorizontal: 16,
        gap: 16,
    },
    card: {
        backgroundColor: colors.cardDark,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    changeBadgeRed: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        maxWidth: 140,
    },
    changeBadgeTextRed: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#f87171',
    },
    changeBadgeGreen: {
        backgroundColor: 'rgba(19, 236, 109, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        maxWidth: 140,
    },
    changeBadgeTextGreen: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.primary,
    },
    dollarIndicator: {
        marginTop: 8,
    },
    dollarSign: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    cardContent: {
        marginBottom: 24,
    },
    cardLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
        marginBottom: 4,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    cardValue: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -1,
    },
    cardSubvalue: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    progressContainer: {
        gap: 8,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabelLeft: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    progressLabelRight: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.primary,
    },
    progressBar: {
        height: 10,
        backgroundColor: colors.surfaceDark,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 5,
    },
    caloriesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    caloriesContent: {
        flex: 1,
        gap: 4,
    },
    goalText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    donutContainer: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surfaceDark,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 10,
        borderColor: colors.primary,
    },
    donutInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    macrosScroll: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    macroChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.cardDark,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        marginRight: 12,
    },
    macroDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    macroLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    macroValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    activitySection: {
        marginTop: 24,
        paddingHorizontal: 16,
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    seeAllButton: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: colors.cardDark,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    logItemImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: colors.surfaceDark,
    },
    logItemIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: colors.surfaceDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logItemInfo: {
        flex: 1,
    },
    logItemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    logItemSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
        marginTop: 2,
    },
    logItemValues: {
        alignItems: 'flex-end',
        gap: 4,
    },
    logItemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'flex-start',
    },
    proteinBadge: {
        backgroundColor: 'rgba(19, 236, 109, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignItems: 'center',
    },
    proteinBadgeText: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.primary,
        lineHeight: 13,
    },
    noProteinBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    noProteinBadgeText: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.red,
    },
    caloriesBadge: {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    caloriesBadgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.orange,
    },
    loadingContainer: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
});
