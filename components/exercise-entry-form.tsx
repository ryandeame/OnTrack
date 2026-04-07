import DateTimePicker from '@/components/date-time-picker';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useExerciseLogs } from '@/hooks/use-exercise-logs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

type ExerciseEntryFormProps = {
    onSubmitSuccess?: () => void;
};

export function ExerciseEntryForm({ onSubmitSuccess }: ExerciseEntryFormProps) {
    const { add, suggestNames, getLatestByName } = useExerciseLogs();
    const { resolvedTheme } = useTheme();
    const themeColors = Colors[resolvedTheme];

    const inputStyle = useMemo(() => ({
        ...styles.input,
        backgroundColor: themeColors.inputBackground,
        color: themeColors.inputText,
        borderColor: themeColors.inputPlaceholder,
    }), [themeColors]);

    const suggestBoxStyle = useMemo(() => ({
        ...styles.suggestBox,
        backgroundColor: themeColors.inputBackground,
        borderColor: themeColors.inputPlaceholder,
    }), [themeColors]);

    const [name, setName] = useState('');
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [occurredAt, setOccurredAt] = useState<Date>(new Date());
    const [pickerOpen, setPickerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [prefillOpen, setPrefillOpen] = useState(false);
    const [prefillSets, setPrefillSets] = useState('');
    const [prefillReps, setPrefillReps] = useState('');

    const suppressSuggestionsRef = useRef(false);
    const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            } catch {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 150);

        return () => {
            if (nameDebounce.current) clearTimeout(nameDebounce.current);
        };
    }, [name, suggestNames]);

    const canSubmit = useMemo(() => {
        const parsedSets = Number.parseInt(sets, 10);
        const parsedReps = Number.parseInt(reps, 10);

        return (
            name.trim().length > 0 &&
            Number.isFinite(parsedSets) &&
            parsedSets > 0 &&
            Number.isFinite(parsedReps) &&
            parsedReps > 0
        );
    }, [name, reps, sets]);

    const resetForm = useCallback(() => {
        setName('');
        setSets('');
        setReps('');
        setOccurredAt(new Date());
        setSuggestions([]);
        setShowSuggestions(false);
        suppressSuggestionsRef.current = false;
    }, []);

    const handleSuggestionSelect = useCallback(async (selectedName: string) => {
        suppressSuggestionsRef.current = true;
        setName(selectedName);
        setShowSuggestions(false);
        Keyboard.dismiss();

        try {
            const latest = await getLatestByName(selectedName);
            setPrefillSets(latest ? String(latest.sets) : '');
            setPrefillReps(latest ? String(latest.reps) : '');
        } catch {
            setPrefillSets('');
            setPrefillReps('');
        }

        setPrefillOpen(true);
    }, [getLatestByName]);

    const handlePrefillConfirm = useCallback(() => {
        const parsedSets = Number.parseInt(prefillSets, 10);
        const parsedReps = Number.parseInt(prefillReps, 10);

        if (Number.isFinite(parsedSets) && parsedSets > 0) {
            setSets(String(parsedSets));
        }

        if (Number.isFinite(parsedReps) && parsedReps > 0) {
            setReps(String(parsedReps));
        }

        setPrefillOpen(false);
        Keyboard.dismiss();
        setTimeout(() => {
            Keyboard.dismiss();
        }, 0);
    }, [prefillReps, prefillSets]);

    const handleSubmit = useCallback(async () => {
        if (!canSubmit || submitting) return;

        const parsedSets = Number.parseInt(sets, 10);
        const parsedReps = Number.parseInt(reps, 10);
        if (!Number.isFinite(parsedSets) || !Number.isFinite(parsedReps)) return;

        setSubmitting(true);
        try {
            await add({
                name: name.trim(),
                sets: parsedSets,
                reps: parsedReps,
                occurredAt,
            });

            resetForm();
            onSubmitSuccess?.();
        } finally {
            setSubmitting(false);
        }
    }, [add, canSubmit, name, occurredAt, onSubmitSuccess, reps, resetForm, sets, submitting]);

    return (
        <>
            <View style={styles.nameFieldContainer}>
                <View>
                    <TextInput
                        placeholder="Exercise"
                        placeholderTextColor={themeColors.inputPlaceholder}
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
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
                        {suggestions.map((suggestion) => (
                            <Pressable
                                key={suggestion}
                                onPress={() => handleSuggestionSelect(suggestion)}
                                style={[styles.suggestItem, { borderTopColor: themeColors.inputPlaceholder }]}>
                                <ThemedText style={{ color: themeColors.inputText }}>{suggestion}</ThemedText>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.formRow}>
                <TextInput
                    placeholder="Sets"
                    placeholderTextColor={themeColors.inputPlaceholder}
                    value={sets}
                    onChangeText={(text) => setSets(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    style={inputStyle}
                />
                <TextInput
                    placeholder="Reps"
                    placeholderTextColor={themeColors.inputPlaceholder}
                    value={reps}
                    onChangeText={(text) => setReps(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    style={inputStyle}
                />
            </View>

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
                        }).format(occurredAt)}
                    </ThemedText>
                </Pressable>
            </View>

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
                    (!canSubmit || submitting) && { opacity: 0.5 },
                ]}>
                <ThemedText style={{ color: themeColors.foodLogBtnText, textAlign: 'center', fontWeight: '600' }}>
                    {submitting ? 'Adding...' : 'Add Exercise'}
                </ThemedText>
            </Pressable>

            <Modal transparent animationType="fade" visible={prefillOpen} onRequestClose={() => setPrefillOpen(false)}>
                <View style={styles.promptBackdrop}>
                    <View style={[styles.promptCard, { backgroundColor: themeColors.navBackground, borderColor: themeColors.navBorder }]}>
                        <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Prefill Exercise</ThemedText>
                        <View style={[styles.formRow, { marginBottom: 8 }]}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={{ marginBottom: 4 }}>Sets</ThemedText>
                                <TextInput
                                    placeholder="e.g. 3"
                                    placeholderTextColor={themeColors.inputPlaceholder}
                                    value={prefillSets}
                                    onChangeText={(text) => setPrefillSets(text.replace(/[^0-9]/g, ''))}
                                    keyboardType="number-pad"
                                    style={inputStyle}
                                    autoFocus
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={{ marginBottom: 4 }}>Reps</ThemedText>
                                <TextInput
                                    placeholder="e.g. 10"
                                    placeholderTextColor={themeColors.inputPlaceholder}
                                    value={prefillReps}
                                    onChangeText={(text) => setPrefillReps(text.replace(/[^0-9]/g, ''))}
                                    keyboardType="number-pad"
                                    style={inputStyle}
                                />
                            </View>
                        </View>
                        <View style={styles.promptActions}>
                            <Pressable
                                onPress={() => setPrefillOpen(false)}
                                style={[
                                    styles.modalBtn,
                                    {
                                        backgroundColor: themeColors.calculatorCancelBtn,
                                        borderColor: themeColors.calculatorCancelBorder,
                                        borderWidth: 1,
                                    },
                                ]}>
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
                                    },
                                ]}>
                                <ThemedText style={{ color: themeColors.foodLogBtnText, fontWeight: '600' }}>OK</ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <DateTimePicker visible={pickerOpen} value={occurredAt} onChange={setOccurredAt} onClose={() => setPickerOpen(false)} />
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
        borderWidth: 1,
    },
    promptActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 12,
    },
    modalBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
});
