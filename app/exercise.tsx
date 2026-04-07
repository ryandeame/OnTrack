import DateTimePicker from '@/components/date-time-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useExerciseLogs, type ExerciseLog } from '@/hooks/use-exercise-logs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

type DayGroup = {
  key: string;
  date: Date;
  items: ExerciseLog[];
};

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function groupLogs(items: ExerciseLog[]): DayGroup[] {
  const map = new Map<string, DayGroup>();

  for (const item of items) {
    const date = new Date(item.occurred_at);
    const key = dayKey(date);
    const current = map.get(key) ?? {
      key,
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      items: [],
    };
    current.items.push(item);
    map.set(key, current);
  }

  for (const group of map.values()) {
    group.items.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }

  return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}

export default function ExerciseScreen() {
  const { add, list, remove, suggestNames, getLatestByName } = useExerciseLogs();

  const inputBackground = useThemeColor({}, 'inputBackground');
  const inputText = useThemeColor({}, 'inputText');
  const inputPlaceholder = useThemeColor({}, 'inputPlaceholder');
  const cardBackground = useThemeColor({}, 'menuBackground');
  const accent = useThemeColor({}, 'tint');
  const buttonText = useThemeColor({}, 'foodLogBtnText');
  const buttonBackground = useThemeColor({}, 'foodLogBtnBg');
  const muted = useThemeColor({}, 'tabIconDefault');
  const backdrop = useThemeColor({}, 'modalBackdrop');

  const [name, setName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [items, setItems] = useState<ExerciseLog[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressSuggestionsRef = useRef(false);

  const inputStyle = useMemo(() => ([
    styles.input,
    {
      backgroundColor: inputBackground,
      borderColor: inputPlaceholder,
      color: inputText,
    },
  ]), [inputBackground, inputPlaceholder, inputText]);

  const suggestionBoxStyle = useMemo(() => ([
    styles.suggestionBox,
    {
      backgroundColor: inputBackground,
      borderColor: inputPlaceholder,
      shadowColor: backdrop,
    },
  ]), [backdrop, inputBackground, inputPlaceholder]);

  const load = useCallback(async () => {
    const next = await list(500);
    setItems(next);
  }, [list]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (suppressSuggestionsRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (name.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await suggestNames(name.trim(), 5);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, suggestNames]);

  const groupedItems = useMemo(() => groupLogs(items), [items]);

  const canSubmit = useMemo(() => {
    const parsedSets = Number.parseInt(sets, 10);
    const parsedReps = Number.parseInt(reps, 10);
    return name.trim().length > 0 && Number.isFinite(parsedSets) && parsedSets > 0 && Number.isFinite(parsedReps) && parsedReps > 0;
  }, [name, reps, sets]);

  const handleSuggestionSelect = useCallback(async (selected: string) => {
    suppressSuggestionsRef.current = true;
    setName(selected);
    setShowSuggestions(false);

    try {
      const latest = await getLatestByName(selected);
      if (latest) {
        setSets(String(latest.sets));
        setReps(String(latest.reps));
      }
    } catch {
      // Leave form editable even if prefill fails.
    }
  }, [getLatestByName]);

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

      setName('');
      setSets('');
      setReps('');
      setOccurredAt(new Date());
      setSuggestions([]);
      setShowSuggestions(false);
      suppressSuggestionsRef.current = false;
      await load();
    } finally {
      setSubmitting(false);
    }
  }, [add, canSubmit, load, name, occurredAt, reps, sets, submitting]);

  const handleDelete = useCallback(async (id: number) => {
    await remove(id);
    await load();
  }, [load, remove]);

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.keyboardView}>
        <ThemedView style={styles.screen} useImageBackground>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="title" style={styles.title}>Exercise</ThemedText>
            <ThemedText style={[styles.subtitle, { color: muted }]}>Recovered from the later redesign with name suggestions, quick prefill, and Supabase-backed history.</ThemedText>

            <View style={[styles.card, { backgroundColor: cardBackground, borderColor: inputPlaceholder }]}> 
              <View style={styles.nameFieldWrap}>
                <ThemedText type="defaultSemiBold" style={styles.label}>Exercise</ThemedText>
                <TextInput
                  placeholder="e.g. Bench Press"
                  placeholderTextColor={inputPlaceholder}
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    if (suppressSuggestionsRef.current) suppressSuggestionsRef.current = false;
                  }}
                  onFocus={() => setShowSuggestions(!suppressSuggestionsRef.current && suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  autoCapitalize="words"
                  style={inputStyle}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <View style={suggestionBoxStyle}>
                    {suggestions.map((suggestion) => (
                      <Pressable key={suggestion} style={[styles.suggestionItem, { borderTopColor: inputPlaceholder }]} onPress={() => handleSuggestionSelect(suggestion)}>
                        <ThemedText>{suggestion}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.row}>
                <View style={styles.fieldBlock}>
                  <ThemedText type="defaultSemiBold" style={styles.label}>Sets</ThemedText>
                  <TextInput
                    placeholder="3"
                    placeholderTextColor={inputPlaceholder}
                    value={sets}
                    onChangeText={(value) => setSets(value.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    style={inputStyle}
                  />
                </View>
                <View style={styles.fieldBlock}>
                  <ThemedText type="defaultSemiBold" style={styles.label}>Reps</ThemedText>
                  <TextInput
                    placeholder="10"
                    placeholderTextColor={inputPlaceholder}
                    value={reps}
                    onChangeText={(value) => setReps(value.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    style={inputStyle}
                  />
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <ThemedText type="defaultSemiBold" style={styles.label}>When</ThemedText>
                <Pressable onPress={() => setPickerOpen(true)} style={inputStyle}>
                  <ThemedText>{occurredAt.toLocaleString()}</ThemedText>
                </Pressable>
              </View>

              <Pressable
                disabled={!canSubmit || submitting}
                onPress={handleSubmit}
                style={[
                  styles.submitButton,
                  { backgroundColor: buttonBackground, borderColor: inputPlaceholder },
                  (!canSubmit || submitting) && styles.submitButtonDisabled,
                ]}>
                <ThemedText style={{ color: buttonText, fontWeight: '700', textAlign: 'center' }}>
                  {submitting ? 'Adding...' : 'Add Exercise'}
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.historyHeader}>
              <ThemedText type="subtitle">History</ThemedText>
              <ThemedText style={{ color: muted }}>{items.length} total entries</ThemedText>
            </View>

            {groupedItems.map((group) => (
              <View key={group.key} style={styles.groupWrap}>
                <View style={[styles.groupHeader, { backgroundColor: accent }]}> 
                  <ThemedText style={styles.groupHeaderText}>
                    {group.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </ThemedText>
                </View>
                <View style={[styles.groupCard, { backgroundColor: cardBackground, borderColor: inputPlaceholder }]}> 
                  {group.items.map((item) => (
                    <View key={item.id} style={[styles.historyRow, { borderBottomColor: inputPlaceholder }]}> 
                      <View style={styles.historyTextWrap}>
                        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                        <ThemedText style={{ color: muted }}>{item.sets} x {item.reps}</ThemedText>
                        <ThemedText style={{ color: muted }}>{new Date(item.occurred_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</ThemedText>
                      </View>
                      <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                        <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {!groupedItems.length && (
              <View style={[styles.emptyCard, { backgroundColor: cardBackground, borderColor: inputPlaceholder }]}> 
                <ThemedText type="defaultSemiBold">No exercise logged yet.</ThemedText>
                <ThemedText style={{ color: muted }}>Your next workout will show up here as soon as it is saved to Supabase.</ThemedText>
              </View>
            )}
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
      <DateTimePicker visible={pickerOpen} value={occurredAt} onChange={setOccurredAt} onClose={() => setPickerOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  title: {
    marginTop: 16,
    lineHeight: 42,
  },
  subtitle: {
    marginTop: -4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldBlock: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 14,
  },
  nameFieldWrap: {
    gap: 6,
    zIndex: 10,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    justifyContent: 'center',
  },
  suggestionBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 4,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  submitButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  historyHeader: {
    marginTop: 8,
    gap: 2,
  },
  groupWrap: {
    gap: 8,
  },
  groupHeader: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupHeaderText: {
    color: '#102218',
    fontWeight: '700',
  },
  groupCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyTextWrap: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
});
