import { CostCalculatorModal } from '@/components/cost-calculator-modal';
import DateTimePicker from '@/components/date-time-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { FoodLogFormData, useFoodLogSubmit } from '@/hooks/use-food-log-submit';
import { useFoodLogs } from '@/hooks/use-food-logs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

type FoodLogEntryFormProps = {
    /** Called after a successful submission */
    onSubmitSuccess?: () => void;
};

/**
 * Food log entry form with name suggestions and prefill modal.
 * Uses servings-based entry only.
 */
export function FoodLogEntryForm({ onSubmitSuccess }: FoodLogEntryFormProps) {
    const { suggestNames, getLatestByName } = useFoodLogs();
    const { submitting, submitFoodLog } = useFoodLogSubmit(onSubmitSuccess);
    const { resolvedTheme } = useTheme();
    const themeColors = Colors[resolvedTheme];

    // Dynamic input styles based on theme
    const inputStyle = useMemo(() => ({
        ...styles.input,
        backgroundColor: themeColors.inputBackground,
        color: themeColors.inputText,
        borderColor: themeColors.inputPlaceholder,
    }), [themeColors]);

    // Dynamic suggestion box styles based on theme
    const suggestBoxStyle = useMemo(() => ({
        ...styles.suggestBox,
        backgroundColor: themeColors.inputBackground,
        borderColor: themeColors.inputPlaceholder,
    }), [themeColors]);

    // Common fields
    const [name, setName] = useState('');
    const [eatenAt, setEatenAt] = useState<Date>(new Date());
    const [pickerOpen, setPickerOpen] = useState(false);

    // Servings mode inputs
    const [servings, setServings] = useState('');
    const [gramsPerServing, setGramsPerServing] = useState('');
    const [caloriesPerServing, setCaloriesPerServing] = useState('');
    const [carbsPerServing, setCarbsPerServing] = useState('');
    const [proteinPerServing, setProteinPerServing] = useState('');
    const [costPerServing, setCostPerServing] = useState('');

    // Name suggestions
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suppressSuggestionsRef = useRef(false);
    const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Prefill modal
    const [servingsPromptOpen, setServingsPromptOpen] = useState(false);
    const [servingsInput, setServingsInput] = useState('1');
    const [gramsPerServInput, setGramsPerServInput] = useState('');

    // Cost calculator modal
    const [costCalcOpen, setCostCalcOpen] = useState(false);

    // Suggest names as user types (debounced)
    useEffect(() => {
        if (suppressSuggestionsRef.current) return;
        if (nameDebounce.current) clearTimeout(nameDebounce.current);
        if (name.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        nameDebounce.current = setTimeout(async () => {
            try {
                const list = await suggestNames(name.trim(), 5);
                setSuggestions(list);
                setShowSuggestions(list.length > 0);
            } catch { }
        }, 150);
        return () => {
            if (nameDebounce.current) clearTimeout(nameDebounce.current);
        };
    }, [name, suggestNames]);

    // Validation - cost is optional
    const canSubmit = useMemo(() => {
        if (name.trim().length === 0) return false;
        return (
            servings.trim().length > 0 &&
            gramsPerServing.trim().length > 0 &&
            caloriesPerServing.trim().length > 0 &&
            carbsPerServing.trim().length > 0 &&
            proteinPerServing.trim().length > 0
        );
    }, [name, servings, gramsPerServing, caloriesPerServing, carbsPerServing, proteinPerServing]);

    // Reset form after successful submission
    const resetForm = useCallback(() => {
        setName('');
        setServings('');
        setGramsPerServing('');
        setCaloriesPerServing('');
        setCarbsPerServing('');
        setProteinPerServing('');
        setCostPerServing('');
        setEatenAt(new Date());
    }, []);

    // Submit handler
    const handleSubmit = useCallback(async () => {
        if (!canSubmit || submitting) return;

        const formData: FoodLogFormData = {
            name,
            eatenAt,
            servings,
            gramsPerServing,
            caloriesPerServing,
            carbsPerServing,
            proteinPerServing,
            costPerServing,
        };

        const success = await submitFoodLog(formData);
        if (success) {
            resetForm();
        }
    }, [canSubmit, submitting, submitFoodLog, resetForm, name, eatenAt, servings, gramsPerServing, caloriesPerServing, carbsPerServing, proteinPerServing, costPerServing]);

    // Handle suggestion selection
    const handleSuggestionSelect = useCallback((selectedName: string) => {
        setName(selectedName);
        suppressSuggestionsRef.current = true;
        setShowSuggestions(false);
        Keyboard.dismiss();
        setServingsPromptOpen(true);
        setServingsInput('1');
        setGramsPerServInput('');
    }, []);

    // Handle prefill modal confirm
    const handlePrefillConfirm = useCallback(async () => {
        const s = parseFloat(servingsInput);
        const gps = parseFloat(gramsPerServInput);
        if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(gps) || gps <= 0) {
            return;
        }
        try {
            const latest = await getLatestByName(name.trim());
            if (latest) {
                const calps = latest.calories_per_gram * gps;
                const carbps = latest.carbs_per_gram * gps;
                const protps = (latest as any).protein_per_gram * gps;
                const round3 = (n: number) => String(Math.round(n * 1000) / 1000);
                setServings(String(s));
                setGramsPerServing(round3(gps));
                setCaloriesPerServing(round3(calps));
                setCarbsPerServing(round3(carbps));
                setProteinPerServing(round3(protps));
                if (latest.cost_usd_per_gram != null && latest.cost_usd_per_gram > 0) {
                    setCostPerServing(`$${(latest.cost_usd_per_gram * gps).toFixed(2)}`);
                } else {
                    setCostPerServing('');
                }
            }
        } finally {
            setServingsPromptOpen(false);
            Keyboard.dismiss();
            setTimeout(() => {
                Keyboard.dismiss();
            }, 0);
        }
    }, [servingsInput, gramsPerServInput, name, getLatestByName]);

    return (
        <>
            {/* Name Field with Suggestions */}
            <View style={styles.nameFieldContainer}>
                <View>
                    <TextInput
                        placeholder="Name"
                        placeholderTextColor={themeColors.inputPlaceholder}
                        value={name}
                        onChangeText={(t) => {
                            setName(t);
                            if (suppressSuggestionsRef.current) suppressSuggestionsRef.current = false;
                        }}
                        style={[inputStyle, { flex: 0 }]}
                        autoCapitalize="words"
                        onFocus={() => setShowSuggestions(!suppressSuggestionsRef.current && suggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                    />
                </View>
                {showSuggestions && suggestions.length > 0 && (
                    <View style={suggestBoxStyle}>
                        {suggestions.map((s) => (
                            <Pressable key={s} onPress={() => handleSuggestionSelect(s)} style={[styles.suggestItem, { borderTopColor: themeColors.inputPlaceholder }]}>
                                <ThemedText style={{ color: themeColors.inputText }}>{s}</ThemedText>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>

            {/* Servings Row */}
            <View style={styles.formRow}>
                <TextInput placeholder="Servings" placeholderTextColor={themeColors.inputPlaceholder} value={servings} onChangeText={setServings} keyboardType="decimal-pad" style={inputStyle} />
                <TextInput placeholder="g/serv" placeholderTextColor={themeColors.inputPlaceholder} value={gramsPerServing} onChangeText={setGramsPerServing} keyboardType="decimal-pad" style={inputStyle} />
                <TextInput placeholder="Cal/serv" placeholderTextColor={themeColors.inputPlaceholder} value={caloriesPerServing} onChangeText={setCaloriesPerServing} keyboardType="decimal-pad" style={inputStyle} />
            </View>

            {/* Macros Row */}
            <View style={styles.formRow}>
                <TextInput placeholder="Carbs/serv" placeholderTextColor={themeColors.inputPlaceholder} value={carbsPerServing} onChangeText={setCarbsPerServing} keyboardType="decimal-pad" style={inputStyle} />
                <TextInput placeholder="Prot/serv" placeholderTextColor={themeColors.inputPlaceholder} value={proteinPerServing} onChangeText={setProteinPerServing} keyboardType="decimal-pad" style={inputStyle} />
            </View>

            {/* Cost Row */}
            <View style={styles.formRow}>
                <TextInput
                    placeholder="Cost/serv"
                    placeholderTextColor={themeColors.inputPlaceholder}
                    value={costPerServing}
                    onChangeText={(text) => {
                        // Strip any existing $ and non-numeric chars except decimal
                        const numericValue = text.replace(/[^0-9.]/g, '');
                        // Prepend $ if there's a value
                        setCostPerServing(numericValue ? `$${numericValue}` : '');
                    }}
                    keyboardType="decimal-pad"
                    style={[inputStyle, { flex: 1 }]}
                />
                <Pressable
                    onPress={() => setCostCalcOpen(true)}
                    style={[styles.calcBtn, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputPlaceholder }]}
                >
                    <ThemedText style={{ fontSize: 16 }}>🧮</ThemedText>
                </Pressable>
            </View>

            {/* Date/Time Picker */}
            <View style={styles.formRow}>
                <Pressable onPress={() => setPickerOpen(true)} style={[inputStyle, { flex: 1, justifyContent: 'center' }]}>
                    <ThemedText style={{ color: themeColors.inputText }}>
                        {new Intl.DateTimeFormat(undefined, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        }).format(eatenAt)}
                    </ThemedText>
                </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit || submitting}
                style={[
                    styles.addBtn,
                    {
                        backgroundColor: themeColors.foodLogBtnBg,
                        borderColor: themeColors.inputPlaceholder,
                        borderWidth: 1,
                    },
                    (!canSubmit || submitting) && { opacity: 0.5 }
                ]}
            >
                <ThemedText style={{ color: themeColors.foodLogBtnText, textAlign: 'center', fontWeight: '600' }}>
                    {submitting ? 'Adding...' : 'Add Item'}
                </ThemedText>
            </Pressable>

            {/* Prefill Modal */}
            <Modal transparent animationType="fade" visible={servingsPromptOpen} onRequestClose={() => setServingsPromptOpen(false)}>
                <View style={styles.promptBackdrop}>
                    <ThemedView style={styles.promptCard}>
                        <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Prefill Servings</ThemedText>
                        <View style={[styles.formRow, { marginBottom: 8 }]}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={{ marginBottom: 4 }}>Servings</ThemedText>
                                <TextInput
                                    placeholder="e.g. 1.5"
                                    placeholderTextColor={themeColors.inputPlaceholder}
                                    value={servingsInput}
                                    onChangeText={setServingsInput}
                                    keyboardType="decimal-pad"
                                    style={inputStyle}
                                    autoFocus
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={{ marginBottom: 4 }}>Grams/serv</ThemedText>
                                <TextInput
                                    placeholder="e.g. 30"
                                    placeholderTextColor={themeColors.inputPlaceholder}
                                    value={gramsPerServInput}
                                    onChangeText={setGramsPerServInput}
                                    keyboardType="decimal-pad"
                                    style={inputStyle}
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                            <Pressable
                                onPress={() => setServingsPromptOpen(false)}
                                style={[
                                    styles.modalBtn,
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
                                onPress={handlePrefillConfirm}
                                style={[
                                    styles.modalBtn,
                                    {
                                        backgroundColor: themeColors.foodLogBtnBg,
                                        borderColor: themeColors.inputPlaceholder,
                                        borderWidth: 1,
                                    }
                                ]}
                            >
                                <ThemedText style={{ color: themeColors.foodLogBtnText, fontWeight: '600' }}>OK</ThemedText>
                            </Pressable>
                        </View>
                    </ThemedView>
                </View>
            </Modal>

            {/* DateTime Picker Component */}
            <DateTimePicker visible={pickerOpen} value={eatenAt} onChange={setEatenAt} onClose={() => setPickerOpen(false)} />

            {/* Cost Calculator Modal */}
            <CostCalculatorModal
                visible={costCalcOpen}
                onClose={() => setCostCalcOpen(false)}
                onApply={(cost) => {
                    setCostPerServing(cost);
                    setCostCalcOpen(false);
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    nameFieldContainer: {
        position: 'relative',
        zIndex: 20,
    },
    suggestBox: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '100%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderTopWidth: 0,
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
        marginTop: 4,
        zIndex: 30,
        elevation: 4,
        maxHeight: 220,
    },
    suggestItem: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    formRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        minHeight: 44,
        textAlignVertical: 'center',
        fontSize: 16,
        minWidth: 90,
        backgroundColor: '#fff',
    },
    addBtn: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
    },
    promptBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    promptCard: {
        width: '100%',
        maxWidth: 420,
        padding: 16,
        borderRadius: 12,
    },
    modalBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
    calcBtn: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

