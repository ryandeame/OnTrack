import DateTimePicker from '@/components/date-time-picker';
import { CurrencySelectorDropdown } from '@/components/currency-selector-dropdown';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useFoodLogs, type NewFoodLog } from '@/hooks/use-food-logs';
import { calculateCostPerServing, parseCurrencyValue } from '@/lib/cost-calculator';
import {
    type CostCalculatorSourceCurrency,
    getSourceCurrencySymbol,
    getStoredSourceCurrency,
    setStoredSourceCurrency,
    subscribeToSourceCurrency,
} from '@/lib/cost-calculator-currency';
import { divStr, mulStr, toNum, trimZeros } from '@/lib/decimal-math';
import type { FoodLog } from '@/types/food';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Keyboard, LayoutAnimation, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, UIManager, View, useWindowDimensions } from 'react-native';

/**
 * Represents a single day's worth of food log entries, grouped together
 * with aggregated nutritional totals.
 */
export type FoodLogDayGroup = {
    /** Unique key in YYYY-MM-DD format */
    key: string;
    /** The calendar date represented by this group */
    date: Date;
    /** Sum of all calories consumed this day */
    totalCalories: number;
    /** Sum of all protein consumed this day (in grams) */
    totalProtein: number;
    /** Individual food log entries for this day */
    entries: FoodLog[];
};

type FoodLogDaysListProps = {
    /** Value that triggers a reload when changed (e.g. timestamp or incrementing counter) */
    refreshTrigger?: number;
};

/**
 * Displays a collapsible list of food log entries grouped by day.
 * Fetches data automatically on mount and when refreshTrigger changes.
 * Handles deletion of entries internally.
 */
export function FoodLogDaysList({ refreshTrigger }: FoodLogDaysListProps) {
    const { list, remove, edit } = useFoodLogs();
    const { resolvedTheme } = useTheme();
    const themeColors = Colors[resolvedTheme];
    const [dayGroups, setDayGroups] = useState<FoodLogDayGroup[]>([]);
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

    // Edit modal state (servings-based, matching entry form)
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState<FoodLog | null>(null);
    const [editName, setEditName] = useState('');
    const [editServings, setEditServings] = useState('');
    const [editGramsPerServing, setEditGramsPerServing] = useState('');
    const [editCaloriesPerServing, setEditCaloriesPerServing] = useState('');
    const [editCarbsPerServing, setEditCarbsPerServing] = useState('');
    const [editProteinPerServing, setEditProteinPerServing] = useState('');
    const [editCostPerServing, setEditCostPerServing] = useState('');
    const [editEatenAt, setEditEatenAt] = useState<Date>(new Date());
    const [editPickerOpen, setEditPickerOpen] = useState(false);

    // Calculator slide animation state
    const { width: screenWidth } = useWindowDimensions();
    // Modal container: 95% width, max 600px
    const modalWidth = Math.min(screenWidth * 0.95, 600);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Calculator form state
    const [calcSourceCurrency, setCalcSourceCurrency] = useState<CostCalculatorSourceCurrency>('ARS');
    const [calcTotalUSD, setCalcTotalUSD] = useState('');
    const [calcTotalLocal, setCalcTotalLocal] = useState('');
    const [calcItemCostLocal, setCalcItemCostLocal] = useState('');
    const [calcItemDiscountLocal, setCalcItemDiscountLocal] = useState('');
    const [calcItemServings, setCalcItemServings] = useState('');

    // Keyboard visibility state for dynamic padding
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const themedInputStyle = useMemo(() => ({
        ...styles.textInput,
        backgroundColor: themeColors.inputBackground,
        borderColor: themeColors.inputPlaceholder,
        color: themeColors.inputText,
    }), [themeColors]);

    const themedLabelStyle = useMemo(() => ({
        ...styles.inputLabel,
        color: themeColors.text,
    }), [themeColors]);

    const themedCancelButtonStyle = useMemo(() => ({
        ...styles.cancelButton,
        backgroundColor: themeColors.calculatorCancelBtn,
        borderColor: themeColors.calculatorCancelBorder,
        borderWidth: 1,
    }), [themeColors]);

    const themedCancelButtonTextStyle = useMemo(() => ({
        ...styles.cancelButtonText,
        color: themeColors.calculatorCancelText,
        fontWeight: '600' as const,
    }), [themeColors]);

    const themedSaveButtonStyle = useMemo(() => ({
        ...styles.saveButton,
        backgroundColor: themeColors.foodLogBtnBg,
        borderColor: themeColors.inputPlaceholder,
        borderWidth: 1,
    }), [themeColors]);

    const themedSaveButtonTextStyle = useMemo(() => ({
        ...styles.saveButtonText,
        color: themeColors.foodLogBtnText,
    }), [themeColors]);

    const themedCalcButtonStyle = useMemo(() => ({
        ...styles.calcButton,
        backgroundColor: themeColors.inputBackground,
        borderColor: themeColors.inputPlaceholder,
    }), [themeColors]);

    const calcSourceCurrencySymbol = useMemo(
        () => getSourceCurrencySymbol(calcSourceCurrency),
        [calcSourceCurrency]
    );

    // Listen for keyboard show/hide events

    // Listen for keyboard show/hide events
    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }

        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => {
            // Animate layout changes automatically (adjustResize triggers layout change)
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsKeyboardVisible(true);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsKeyboardVisible(false);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        void getStoredSourceCurrency().then((savedCurrency) => {
            if (isMounted) {
                setCalcSourceCurrency(savedCurrency);
            }
        });

        const unsubscribe = subscribeToSourceCurrency((updatedCurrency) => {
            if (isMounted) {
                setCalcSourceCurrency(updatedCurrency);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const handleCalcSourceCurrencyChange = useCallback((currency: CostCalculatorSourceCurrency) => {
        setCalcSourceCurrency(currency);
        void setStoredSourceCurrency(currency);
    }, []);

    const withCurrencyPrefix = useCallback((value: string, symbol: string): string => {
        const numeric = value.replace(/[^0-9.]/g, '');
        return numeric ? `${symbol}${numeric}` : '';
    }, []);

    useEffect(() => {
        setCalcTotalLocal((prev) => withCurrencyPrefix(prev, calcSourceCurrencySymbol));
        setCalcItemCostLocal((prev) => withCurrencyPrefix(prev, calcSourceCurrencySymbol));
        setCalcItemDiscountLocal((prev) => withCurrencyPrefix(prev, calcSourceCurrencySymbol));
    }, [calcSourceCurrencySymbol, withCurrencyPrefix]);

    const loadFoodLogs = useCallback(async () => {
        try {
            const rows = await list();
            const normalizedFoodLogs = rows.map((r) => ({
                ...r,
            }));

            // Group food logs by day
            const foodLogsByDay = new Map<string, FoodLogDayGroup>();
            for (const foodLog of normalizedFoodLogs) {
                const logDate = new Date(foodLog.eaten_at);
                const year = logDate.getFullYear();
                const month = String(logDate.getMonth() + 1).padStart(2, '0');
                const day = String(logDate.getDate()).padStart(2, '0');
                const dayKey = `${year}-${month}-${day}`;

                let dayGroup = foodLogsByDay.get(dayKey);
                if (!dayGroup) {
                    dayGroup = {
                        key: dayKey,
                        date: new Date(year, Number(month) - 1, Number(day)),
                        totalCalories: 0,
                        totalProtein: 0,
                        entries: [],
                    };
                    foodLogsByDay.set(dayKey, dayGroup);
                }
                dayGroup.entries.push(foodLog);
                dayGroup.totalCalories += foodLog.grams * foodLog.calories_per_gram;
                dayGroup.totalProtein += foodLog.grams * (foodLog as any).protein_per_gram;
            }

            // Sort food entries within each day group (newest first)
            for (const dayGroup of foodLogsByDay.values()) {
                dayGroup.entries.sort((a, b) => new Date(b.eaten_at).getTime() - new Date(a.eaten_at).getTime());
            }

            // Sort day groups by date (newest first)
            const sortedDayGroups = Array.from(foodLogsByDay.values()).sort(
                (a, b) => b.date.getTime() - a.date.getTime()
            );
            setDayGroups(sortedDayGroups);
        } catch (e) {
            console.error('Failed to load food logs', e);
        }
    }, [list]);

    useEffect(() => {
        loadFoodLogs();
    }, [loadFoodLogs, refreshTrigger]);

    const handleDeleteFoodEntry = useCallback(async (foodLogId: number) => {
        const doDelete = async () => {
            await remove(foodLogId);
            await loadFoodLogs();
        };

        if (Platform.OS === 'web') {
            // Web: use window.confirm
            const confirmed = window.confirm('Are you sure you want to delete this food entry?');
            if (confirmed) {
                await doDelete();
            }
        } else {
            // Native: use Alert.alert
            Alert.alert(
                'Delete Entry',
                'Are you sure you want to delete this food entry?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: doDelete,
                    },
                ]
            );
        }
    }, [remove, loadFoodLogs]);

    const openEditModal = useCallback((entry: FoodLog) => {
        setEditingEntry(entry);
        setEditName(entry.name);
        const parsedEatenAt = new Date(entry.eaten_at);
        setEditEatenAt(Number.isNaN(parsedEatenAt.getTime()) ? new Date() : parsedEatenAt);

        // Check if servings data is available
        const servings = entry.servings;
        if (servings && servings > 0) {
            // Use decimal-safe math to calculate per-serving values from stored data
            const gramsStr = entry.grams.toString();
            const servingsStr = servings.toString();
            const gramsPerServingStr = divStr(gramsStr, servingsStr);

            // Calculate per-serving values: calories/carbs/protein_per_gram * grams_per_serving
            // Match list formatting: Calories (1 decimal), Carbs (1 decimal), Protein (1 decimal)
            // AND remove trailing zeros (e.g. 150.0 -> 150)
            const caloriesPerServingStr = trimZeros(parseFloat(mulStr(entry.calories_per_gram.toString(), gramsPerServingStr)).toFixed(1));
            const carbsPerServingStr = trimZeros(parseFloat(mulStr(entry.carbs_per_gram.toString(), gramsPerServingStr)).toFixed(1));
            const proteinPerServingStr = trimZeros(parseFloat(mulStr(entry.protein_per_gram.toString(), gramsPerServingStr)).toFixed(1));

            setEditServings(trimZeros(servingsStr));
            setEditGramsPerServing(trimZeros(gramsPerServingStr));
            setEditCaloriesPerServing(caloriesPerServingStr);
            setEditCarbsPerServing(carbsPerServingStr);
            setEditProteinPerServing(proteinPerServingStr);

            // Calculate cost per serving if available
            // Round to 2 decimal places for stable display (cost is currency)
            if (entry.cost_usd_per_gram != null && entry.cost_usd_per_gram > 0) {
                const costPerServingStr = mulStr(entry.cost_usd_per_gram.toString(), gramsPerServingStr);
                const costRounded = parseFloat(costPerServingStr).toFixed(2);
                setEditCostPerServing(`$${costRounded}`);
            } else {
                setEditCostPerServing('');
            }
        } else {
            // No servings data - show blank fields
            setEditServings('');
            setEditGramsPerServing('');
            setEditCaloriesPerServing('');
            setEditCarbsPerServing('');
            setEditProteinPerServing('');
            setEditCostPerServing('');
        }
        setEditModalVisible(true);
    }, []);

    const closeEditModal = useCallback(() => {
        setEditModalVisible(false);
        setEditingEntry(null);
        // Reset calculator state
        slideAnim.setValue(0);
        setCalcTotalUSD('');
        setCalcTotalLocal('');
        setCalcItemCostLocal('');
        setCalcItemDiscountLocal('');
        setCalcItemServings('');
        setEditPickerOpen(false);
        setEditEatenAt(new Date());
    }, [slideAnim]);

    // Slide to calculator panel
    const slideToCalculator = useCallback(() => {
        Animated.timing(slideAnim, {
            toValue: -modalWidth,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [slideAnim, modalWidth]);

    // Slide back to edit form
    const slideToEditForm = useCallback((newCost?: string) => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            if (newCost) {
                setEditCostPerServing(newCost);
            }
        });
    }, [slideAnim]);

    // Calculator input handlers
    const handleCalcUSDChange = useCallback((text: string) => {
        const numeric = text.replace(/[^0-9.]/g, '');
        const parts = numeric.split('.');
        let formatted = parts[0];
        if (parts.length > 1) {
            formatted += '.' + parts[1].slice(0, 2);
        }
        setCalcTotalUSD(formatted ? `$${formatted}` : '');
    }, []);

    const handleCalcLocalChange = useCallback((setter: (val: string) => void) => (text: string) => {
        const numeric = text.replace(/[^0-9.]/g, '');
        const parts = numeric.split('.');
        let formatted = parts[0];
        if (parts.length > 1) {
            formatted += '.' + parts[1].slice(0, 2);
        }
        setter(formatted ? `${calcSourceCurrencySymbol}${formatted}` : '');
    }, [calcSourceCurrencySymbol]);

    // Format on blur to ensure 2 decimal places
    const formatCurrencyOnBlur = useCallback((
        value: string,
        setter: (val: string) => void,
        symbol: string = '$'
    ) => {
        if (!value) return;
        const numeric = value.replace(/[^0-9.]/g, '');
        if (!numeric) return;

        const parts = numeric.split('.');
        let formatted = parts[0];
        if (formatted === '') formatted = '0';

        if (parts.length === 1) {
            formatted += '.00';
        } else if (parts.length > 1) {
            let cents = parts[1];
            if (cents.length === 0) cents = '00';
            else if (cents.length === 1) cents += '0';
            else cents = cents.slice(0, 2);
            formatted += '.' + cents;
        }

        setter(`${symbol}${formatted}`);
    }, []);

    // Calculator validation
    const canApplyCalculator =
        parseCurrencyValue(calcTotalUSD) > 0 &&
        parseCurrencyValue(calcTotalLocal) > 0 &&
        parseCurrencyValue(calcItemCostLocal) > 0 &&
        parseFloat(calcItemServings) > 0;

    // Calculate result using shared utility
    const calculatedCostPerServing = (() => {
        if (!canApplyCalculator) return null;
        return calculateCostPerServing(
            parseCurrencyValue(calcTotalUSD),
            parseCurrencyValue(calcTotalLocal),
            parseCurrencyValue(calcItemCostLocal),
            parseCurrencyValue(calcItemDiscountLocal),
            parseFloat(calcItemServings)
        );
    })();

    const handleApplyCalculator = useCallback(() => {
        if (calculatedCostPerServing) {
            slideToEditForm(`$${calculatedCostPerServing}`);
        }
    }, [calculatedCostPerServing, slideToEditForm]);

    const handleSaveEdit = useCallback(async () => {
        if (!editingEntry) return;

        // Parse values for validation
        const servingsNum = toNum(editServings);
        const gramsPerServingNum = toNum(editGramsPerServing);
        const caloriesPerServingNum = toNum(editCaloriesPerServing);
        const carbsPerServingNum = toNum(editCarbsPerServing);
        const proteinPerServingNum = toNum(editProteinPerServing);
        const costPerServingNum = toNum(editCostPerServing);

        // Validation: all fields except cost must be filled and > 0
        if (servingsNum <= 0 || gramsPerServingNum <= 0 ||
            caloriesPerServingNum <= 0 || carbsPerServingNum < 0 || proteinPerServingNum < 0) {
            if (Platform.OS === 'web') {
                window.alert('Please fill in Servings, Grams/serving, Calories/serving, Carbs/serving, and Protein/serving to proceed.');
            } else {
                Alert.alert(
                    'Missing Information',
                    'Please fill in Servings, Grams/serving, Calories/serving, Carbs/serving, and Protein/serving to proceed.'
                );
            }
            return;
        }

        // Convert to per-gram values for storage using decimal-safe math
        const totalGramsStr = mulStr(editServings, editGramsPerServing);
        const caloriesPerGramStr = divStr(editCaloriesPerServing, editGramsPerServing);
        const carbsPerGramStr = divStr(editCarbsPerServing, editGramsPerServing);
        const proteinPerGramStr = divStr(editProteinPerServing, editGramsPerServing);

        // Cost is optional - only calculate if provided
        // Round to 6 decimal places for stable round-trip calculations
        let costUsdPerGram: number | null = null;
        if (!Number.isNaN(costPerServingNum) && costPerServingNum > 0) {
            costUsdPerGram = parseFloat(divStr(editCostPerServing, editGramsPerServing, 6));
        }

        const updatedEntry: NewFoodLog = {
            name: editName.trim(),
            grams: parseFloat(totalGramsStr),
            caloriesPerGram: parseFloat(caloriesPerGramStr),
            carbsPerGram: parseFloat(carbsPerGramStr),
            proteinPerGram: parseFloat(proteinPerGramStr),
            costUsdPerGram,
            servings: servingsNum,
            eatenAt: editEatenAt,
        };

        try {
            await edit(editingEntry.id, updatedEntry);
            closeEditModal();
            await loadFoodLogs();
        } catch (e) {
            console.error('Failed to edit food entry', e);
            if (Platform.OS === 'web') {
                window.alert('Failed to save changes. Please try again.');
            } else {
                Alert.alert('Error', 'Failed to save changes. Please try again.');
            }
        }
    }, [editingEntry, editName, editServings, editGramsPerServing, editCaloriesPerServing, editCarbsPerServing, editProteinPerServing, editCostPerServing, editEatenAt, edit, closeEditModal, loadFoodLogs]);

    const dayHeaderGradient = useMemo(() => [
        themeColors.navBackground,
        themeColors.menuBackground,
        themeColors.accentMuted,
    ] as const, [themeColors]);

    /** Returns a theme-aware color based on daily calorie totals for visual feedback */
    const getCalorieStatusColor = useCallback((totalCalories: number) => {
        if (totalCalories <= 2000) return themeColors.success;
        if (totalCalories <= 2500) return themeColors.warning;
        return themeColors.danger;
    }, [themeColors]);

    /** Formats the date for display in day headers */
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
            if (next.has(dayKey)) next.delete(dayKey); else next.add(dayKey);
            return next;
        });
    }, []);

    const renderFoodLogDay = useCallback(({ item: dayGroup }: { item: FoodLogDayGroup }) => {
        const isDayExpanded = expandedDays.has(dayGroup.key);
        const calorieStatusColor = getCalorieStatusColor(dayGroup.totalCalories);
        const entryCountLabel = `${dayGroup.entries.length} ${dayGroup.entries.length === 1 ? 'entry' : 'entries'}`;

        return (
            <View style={styles.dayContainer}>
                <Pressable
                    onPress={() => toggleDayExpanded(dayGroup.key)}
                    style={({ pressed }) => [styles.dayHeaderPressable, pressed && styles.dayHeaderPressed]}
                >
                    <LinearGradient
                        colors={dayHeaderGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0.8 }}
                        style={[styles.dayHeader, { borderColor: themeColors.navBorder }]}
                    >
                        <View style={styles.dayHeaderLeft}>
                            <View style={[styles.dayDateIconWrap, { backgroundColor: themeColors.accentMuted }]}>
                                <MaterialIcons name="calendar-today" size={14} color={themeColors.accent} />
                            </View>
                            <View>
                                <ThemedText style={[styles.dayHeaderText, { color: themeColors.text }]}>{formatDayHeaderDate(dayGroup.date)}</ThemedText>
                                <ThemedText style={[styles.dayHeaderMeta, { color: themeColors.textSecondary }]}>{entryCountLabel}</ThemedText>
                            </View>
                        </View>

                        <View style={styles.dayHeaderRight}>
                            <View>
                                <ThemedText style={[styles.dayHeaderSummary, { color: themeColors.text }]}>{`${Math.round(dayGroup.totalCalories)} cal`}</ThemedText>
                                <ThemedText style={[styles.dayHeaderSummaryMuted, { color: themeColors.textSecondary }]}>{`${(dayGroup.totalProtein ?? 0).toFixed(1)}g protein`}</ThemedText>
                            </View>
                            <View style={[styles.dayStatusCircle, { backgroundColor: calorieStatusColor }]}>
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
                    <View style={styles.foodEntriesContainer}>
                        {dayGroup.entries.map((foodEntry) => (
                            <ThemedView
                                key={foodEntry.id}
                                style={[
                                    styles.foodEntryRow,
                                    { backgroundColor: themeColors.card, borderColor: themeColors.navBorder },
                                ]}
                            >
                                <View style={styles.foodEntryDetails}>
                                    <ThemedText type="defaultSemiBold">{foodEntry.name}</ThemedText>
                                    <ThemedText style={[styles.foodEntryBodyText, { color: themeColors.textSecondary }]}>
                                        {`${foodEntry.grams.toFixed(0)} g · ${(foodEntry.grams * foodEntry.calories_per_gram).toFixed(0)} cal`}
                                    </ThemedText>
                                    <ThemedText style={[styles.foodEntryBodyText, { color: themeColors.textSecondary }]}>
                                        {`${(foodEntry.grams * foodEntry.carbs_per_gram).toFixed(1)} g carbs · ${(foodEntry.grams * (foodEntry as any).protein_per_gram).toFixed(1)} g protein`}
                                    </ThemedText>
                                    <ThemedText style={[styles.foodEntryTime, { color: themeColors.textMuted }]}>
                                        {new Date(foodEntry.eaten_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </ThemedText>
                                </View>
                                <View style={styles.foodEntryActions}>
                                    <Pressable
                                        onPress={() => openEditModal(foodEntry)}
                                        style={({ pressed }) => [
                                            styles.entryActionButton,
                                            {
                                                backgroundColor: themeColors.accentMuted,
                                                borderColor: themeColors.navBorder,
                                                opacity: pressed ? 0.82 : 1,
                                            },
                                        ]}
                                        accessibilityLabel={`Edit ${foodEntry.name}`}
                                    >
                                        <MaterialIcons name="edit" size={18} color={themeColors.accent} />
                                    </Pressable>
                                    <Pressable
                                        onPress={() => handleDeleteFoodEntry(foodEntry.id)}
                                        style={({ pressed }) => [
                                            styles.entryActionButton,
                                            {
                                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                                borderColor: themeColors.navBorder,
                                                opacity: pressed ? 0.82 : 1,
                                            },
                                        ]}
                                        accessibilityLabel={`Delete ${foodEntry.name}`}
                                    >
                                        <MaterialIcons name="delete-outline" size={18} color={themeColors.danger} />
                                    </Pressable>
                                </View>
                            </ThemedView>
                        ))}
                    </View>
                )}
            </View>
        );
    }, [dayHeaderGradient, expandedDays, formatDayHeaderDate, getCalorieStatusColor, handleDeleteFoodEntry, openEditModal, themeColors, toggleDayExpanded]);

    return (
        <>
            <FlatList
                data={dayGroups}
                keyExtractor={(dayGroup) => dayGroup.key}
                renderItem={renderFoodLogDay}
                contentContainerStyle={styles.listContent}
                style={styles.list}
            />

            {/* Edit Modal with Sliding Calculator */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeEditModal}
            >
                <View style={[styles.modalOverlay, { backgroundColor: themeColors.modalBackdrop }]}>
                    <ThemedView style={[
                        styles.modalContent,
                        {
                            width: modalWidth,
                            maxHeight: isKeyboardVisible ? '100%' : '88%',
                            minHeight: 360,
                            marginTop: isKeyboardVisible ? 0 : 20,
                            marginBottom: isKeyboardVisible ? 0 : 20,
                            borderBottomLeftRadius: isKeyboardVisible ? 0 : 12,
                            borderBottomRightRadius: isKeyboardVisible ? 0 : 12,
                        }
                    ]}>
                        <Animated.View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                width: modalWidth * 2,
                                transform: [{ translateX: slideAnim }],
                            }}
                        >
                            <ScrollView
                                style={{ width: modalWidth, flex: 1 }}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: isKeyboardVisible ? 0 : 20, flexGrow: 1 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={true}
                            >
                                <ThemedText type="subtitle" style={styles.modalTitle}>Edit Food Entry</ThemedText>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Name</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={editName}
                                        onChangeText={setEditName}
                                        placeholder="Food name"
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Servings</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={editServings}
                                        onChangeText={setEditServings}
                                        keyboardType="numeric"
                                        placeholder="e.g. 1.5"
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Grams per serving</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={editGramsPerServing}
                                        onChangeText={setEditGramsPerServing}
                                        keyboardType="numeric"
                                        placeholder="e.g. 30"
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Calories per serving</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={editCaloriesPerServing}
                                        onChangeText={setEditCaloriesPerServing}
                                        keyboardType="numeric"
                                        placeholder="e.g. 150"
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Carbs per serving</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={editCarbsPerServing}
                                        onChangeText={setEditCarbsPerServing}
                                        keyboardType="numeric"
                                        placeholder="e.g. 20"
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Protein per serving</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={editProteinPerServing}
                                        onChangeText={setEditProteinPerServing}
                                        keyboardType="numeric"
                                        placeholder="e.g. 5"
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Cost per serving (optional)</ThemedText>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TextInput
                                            style={[themedInputStyle, { flex: 1 }]}
                                            value={editCostPerServing}
                                            onChangeText={(text) => {
                                                const numericValue = text.replace(/[^0-9.]/g, '');
                                                setEditCostPerServing(numericValue ? `$${numericValue}` : '');
                                            }}
                                            keyboardType="numeric"
                                            placeholder="Cost/serv"
                                            placeholderTextColor={themeColors.inputPlaceholder}
                                        />
                                        <Pressable onPress={slideToCalculator} style={themedCalcButtonStyle}>
                                            <ThemedText style={{ fontSize: 16 }}>🧮</ThemedText>
                                        </Pressable>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Date & time</ThemedText>
                                    <Pressable
                                        style={[themedInputStyle, { justifyContent: 'center' }]}
                                        onPress={() => setEditPickerOpen(true)}
                                    >
                                        <ThemedText style={{ color: themeColors.inputText }}>
                                            {new Intl.DateTimeFormat(undefined, {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                            }).format(editEatenAt)}
                                        </ThemedText>
                                    </Pressable>
                                </View>

                                <View style={[styles.modalButtons, isKeyboardVisible && { marginTop: 8 }]}>
                                    <Pressable onPress={closeEditModal} style={themedCancelButtonStyle}>
                                        <ThemedText style={themedCancelButtonTextStyle}>Cancel</ThemedText>
                                    </Pressable>
                                    <Pressable onPress={handleSaveEdit} style={themedSaveButtonStyle}>
                                        <ThemedText style={themedSaveButtonTextStyle}>Save</ThemedText>
                                    </Pressable>
                                </View>
                            </ScrollView>

                            <ScrollView
                                style={{ width: modalWidth, flex: 1 }}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: isKeyboardVisible ? 0 : 20, flexGrow: 1 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={true}
                            >
                                <CurrencySelectorDropdown
                                    value={calcSourceCurrency}
                                    onChange={handleCalcSourceCurrencyChange}
                                />

                                <ThemedText type="subtitle" style={styles.modalTitle}>
                                    {calcSourceCurrency} → USD Calculator
                                </ThemedText>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Total Charged (USD)</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={calcTotalUSD}
                                        onChangeText={handleCalcUSDChange}
                                        onBlur={() => formatCurrencyOnBlur(calcTotalUSD, setCalcTotalUSD, '$')}
                                        keyboardType="decimal-pad"
                                        placeholder="$0.00"
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Total Paid ({calcSourceCurrency})</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={calcTotalLocal}
                                        onChangeText={handleCalcLocalChange(setCalcTotalLocal)}
                                        onBlur={() => formatCurrencyOnBlur(calcTotalLocal, setCalcTotalLocal, calcSourceCurrencySymbol)}
                                        keyboardType="decimal-pad"
                                        placeholder={`${calcSourceCurrencySymbol}0.00`}
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Item Cost ({calcSourceCurrency})</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={calcItemCostLocal}
                                        onChangeText={handleCalcLocalChange(setCalcItemCostLocal)}
                                        onBlur={() => formatCurrencyOnBlur(calcItemCostLocal, setCalcItemCostLocal, calcSourceCurrencySymbol)}
                                        keyboardType="decimal-pad"
                                        placeholder={`${calcSourceCurrencySymbol}0.00`}
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Item Discount ({calcSourceCurrency}) - optional</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={calcItemDiscountLocal}
                                        onChangeText={handleCalcLocalChange(setCalcItemDiscountLocal)}
                                        onBlur={() => formatCurrencyOnBlur(calcItemDiscountLocal, setCalcItemDiscountLocal, calcSourceCurrencySymbol)}
                                        keyboardType="decimal-pad"
                                        placeholder={`${calcSourceCurrencySymbol}0.00`}
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={themedLabelStyle}>Item Servings</ThemedText>
                                    <TextInput
                                        style={themedInputStyle}
                                        value={calcItemServings}
                                        onChangeText={setCalcItemServings}
                                        keyboardType="decimal-pad"
                                        placeholder="1"
                                        placeholderTextColor={themeColors.inputPlaceholder}
                                    />
                                </View>

                                {calculatedCostPerServing && (
                                    <View style={styles.calcResult}>
                                        <ThemedText type="defaultSemiBold">Cost/Serv (USD): </ThemedText>
                                        <ThemedText type="defaultSemiBold" style={{ color: '#22c55e' }}>${calculatedCostPerServing}</ThemedText>
                                    </View>
                                )}

                                <View style={[styles.modalButtons, isKeyboardVisible && { marginTop: 8 }]}>
                                    <Pressable onPress={() => slideToEditForm()} style={themedCancelButtonStyle}>
                                        <ThemedText style={themedCancelButtonTextStyle}>Cancel</ThemedText>
                                    </Pressable>
                                    <Pressable
                                        onPress={handleApplyCalculator}
                                        disabled={!canApplyCalculator}
                                        style={[themedSaveButtonStyle, !canApplyCalculator && { opacity: 0.5 }]}
                                    >
                                        <ThemedText style={themedSaveButtonTextStyle}>Apply</ThemedText>
                                    </Pressable>
                                </View>
                            </ScrollView>
                        </Animated.View>
                    </ThemedView>
                </View>
            </Modal>

            <DateTimePicker
                visible={editPickerOpen}
                value={editEatenAt}
                onChange={setEditEatenAt}
                onClose={() => setEditPickerOpen(false)}
            />
        </>
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
    foodEntriesContainer: {
        paddingHorizontal: 8,
        paddingTop: 10,
    },
    foodEntryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
        gap: 12,
    },
    foodEntryDetails: {
        flex: 1,
    },
    foodEntryBodyText: {
        fontSize: 14,
        marginTop: 2,
    },
    foodEntryTime: {
        fontSize: 12,
        marginTop: 4,
    },
    foodEntryActions: {
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    modalContent: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalTitle: {
        marginBottom: 16,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputLabel: {
        marginBottom: 4,
        opacity: 0.7,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#e5e5e5',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#333',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#22c55e',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    calcButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
    },
    calcResult: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        padding: 12,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 8,
    },
});

