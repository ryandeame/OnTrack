import { FoodLogDaysList } from '@/components/food-log-days-list';
import { FoodLogEntryForm } from '@/components/food-log-entry-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function FoodScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSubmitSuccess = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.keyboardView}>
      <ThemedView style={styles.container} useImageBackground>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title" style={styles.title}>Log Food</ThemedText>

          <FoodLogEntryForm onSubmitSuccess={handleFormSubmitSuccess} />

          <View style={styles.historyHeader}>
            <ThemedText type="subtitle">Food Log History</ThemedText>
          </View>
          <FoodLogDaysList refreshTrigger={refreshKey} />
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
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
