import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text as RawText, StyleSheet, View } from 'react-native';

type Props = {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
};

function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

type CalendarColors = {
    containerBackground: string;
    borderColor: string;
    navIcon: string;
    monthTitle: string;
    weekText: string;
    dayText: string;
    daySelectedBackground: string;
    daySelectedText: string;
    dayTodayBorder: string;
    dayTodayText: string;
};

function getCalendarColors(resolvedTheme: keyof typeof Colors): CalendarColors {
    const themeColors = Colors[resolvedTheme];
    const isDarkSurfaceTheme = ['dark', 'bruins', 'patriots', 'seeingGreen'].includes(resolvedTheme);

    return {
        containerBackground: themeColors.navBackground ?? themeColors.menuBackground,
        borderColor: isDarkSurfaceTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)',
        navIcon: themeColors.tabIconDefault,
        monthTitle: themeColors.text,
        weekText: themeColors.tabIconDefault,
        dayText: themeColors.text,
        daySelectedBackground: themeColors.foodLogBtnBg,
        daySelectedText: themeColors.foodLogBtnText,
        dayTodayBorder: themeColors.tint,
        dayTodayText: themeColors.tint,
    };
}

export default function CompactCalendar({ selectedDate, onDateSelect }: Props) {
    const { resolvedTheme } = useTheme();
    const colors = useMemo(() => getCalendarColors(resolvedTheme), [resolvedTheme]);
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Determine the month to display based on selectedDate
    // We initialize viewDate state from selectedDate, but allow navigating months independently
    const [viewDate, setViewDate] = useState(new Date(selectedDate));

    // When selectedDate changes externally, optionally update viewDate to show that month
    // (This is a UX choice - usually good to jump to selection)
    useEffect(() => {
        setViewDate(new Date(selectedDate));
    }, [selectedDate]);

    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const monthName = viewDate.toLocaleString('default', { month: 'long' });

    const grid = useMemo(() => {
        const first = new Date(y, m, 1);
        const firstDow = first.getDay(); // 0-6 (Sun-Sat)
        const total = daysInMonth(y, m);
        const cells: (number | null)[] = [];

        for (let i = 0; i < firstDow; i++) cells.push(null);
        for (let i = 1; i <= total; i++) cells.push(i);
        while (cells.length % 7 !== 0) cells.push(null);

        return cells;
    }, [y, m]);

    const changeMonth = (delta: number) => {
        const next = new Date(viewDate);
        next.setMonth(m + delta);
        setViewDate(next);
    };

    const pickDay = (day: number) => {
        const next = new Date(y, m, day);
        onDateSelect(next);
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const isToday = (day: number) => {
        const today = new Date();
        return isSameDay(new Date(y, m, day), today);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn} hitSlop={8}>
                    <MaterialIcons name="chevron-left" size={24} color={colors.navIcon} />
                </Pressable>
                <ThemedText style={styles.monthTitle}>{`${monthName} ${y}`}</ThemedText>
                <Pressable onPress={() => changeMonth(1)} style={styles.navBtn} hitSlop={8}>
                    <MaterialIcons name="chevron-right" size={24} color={colors.navIcon} />
                </Pressable>
            </View>

            {/* Week Days */}
            <View style={styles.weekHeader}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
                    <ThemedText key={w} style={styles.weekCell}>{w}</ThemedText>
                ))}
            </View>

            {/* Days Grid */}
            <View style={styles.grid}>
                {grid.map((day, idx) => {
                    if (day === null) {
                        return <View key={idx} style={styles.cellEmpty} />;
                    }

                    const date = new Date(y, m, day);
                    const isSelected = isSameDay(date, selectedDate);
                    const isCurrentDay = isToday(day);

                    return (
                        <Pressable
                            key={idx}
                            onPress={() => pickDay(day)}
                            style={[
                                styles.cell,
                                isSelected && styles.cellSelected,
                                !isSelected && isCurrentDay && styles.cellToday
                            ]}
                        >
                            <View style={styles.cellTextWrapper}>
                                <RawText style={[
                                    styles.cellText,
                                    isSelected && styles.cellTextSelected,
                                    !isSelected && isCurrentDay && styles.cellTextToday
                                ]}>
                                    {day}
                                </RawText>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const createStyles = (colors: CalendarColors) => StyleSheet.create({
    container: {
        backgroundColor: colors.containerBackground,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderColor,
        marginTop: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    navBtn: {
        padding: 4,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.monthTitle,
    },
    weekHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekCell: {
        flex: 1,
        textAlign: 'center',
        color: colors.weekText,
        fontSize: 12,
        fontWeight: '500',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cellEmpty: {
        width: '14.28%',
        aspectRatio: 1,
    },
    cellSelected: {
        backgroundColor: colors.daySelectedBackground,
    },
    cellToday: {
        borderColor: colors.dayTodayBorder,
    },
    cellTextWrapper: {
        margin: 'auto',
    },
    cellText: {
        fontSize: 14,
        color: colors.dayText,
        fontWeight: '500',
        textAlign: 'center',
    },
    cellTextSelected: {
        color: colors.daySelectedText,
        fontWeight: 'bold',
    },
    cellTextToday: {
        color: colors.dayTodayText,
    },
});
