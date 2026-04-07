import { ExerciseEntryForm } from '@/components/exercise-entry-form';
import { ExerciseLogDaysList } from '@/components/exercise-log-days-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function ExerciseScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSubmitSuccess = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.keyboardView}>
      <ThemedView style={styles.screen} useImageBackground>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title" style={styles.title}>Exercise</ThemedText>

          <ExerciseEntryForm onSubmitSuccess={handleFormSubmitSuccess} />

          <View style={styles.historyHeader}>
            <ThemedText type="subtitle">Exercise Log History</ThemedText>
          </View>
          <ExerciseLogDaysList refreshTrigger={refreshKey} />
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
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
    gap: 12,
  },
  title: {
    marginTop: 16,
    lineHeight: 42,
  },
  historyHeader: {
    marginTop: 20,
    marginBottom: 10,
  },
});
