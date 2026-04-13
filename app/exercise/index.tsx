import { ExerciseEntryForm } from '@/components/exercise-entry-form';
import { ExerciseLogDaysList } from '@/components/exercise-log-days-list';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, type ThemeName } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

type ExercisePagePalette = {
  background: string;
  backgroundAlt: string;
  cardBackground: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  secondary: string;
};

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

function getExercisePagePalette(themeName: ThemeName): ExercisePagePalette {
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
  };
}

function formatDateHeadline(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ExerciseScreen() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { resolvedTheme } = useTheme();
  const palette = useMemo(() => getExercisePagePalette(resolvedTheme), [resolvedTheme]);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const handleFormSubmitSuccess = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const todayLabel = useMemo(() => formatDateHeadline(new Date()), []);

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.keyboardView}>
      <View style={styles.container}>
        <LinearGradient
          colors={[palette.background, palette.backgroundAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <ThemedText style={styles.pageTitle}>Exercise Log</ThemedText>
              <ThemedText style={styles.dateText}>{todayLabel}</ThemedText>
            </View>
          </View>

          <View style={styles.glassCard}>
            <LinearGradient
              colors={[palette.primary, palette.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardStrip}
            />
            <ThemedText style={styles.sectionTitle}>Log an exercise</ThemedText>

            <View style={styles.formWrap}>
              <ExerciseEntryForm onSubmitSuccess={handleFormSubmitSuccess} />
            </View>
          </View>

          <View style={styles.glassCard}>
            <LinearGradient
              colors={[palette.secondary, palette.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardStrip}
            />
            <View style={styles.historyHeader}>
              <View style={styles.historyHeaderTextWrap}>
                <ThemedText style={styles.eyebrow}>History</ThemedText>
                <ThemedText style={styles.sectionTitle}>Recent days</ThemedText>
              </View>
            </View>

            <View style={styles.historyListWrap}>
              <ExerciseLogDaysList refreshTrigger={refreshKey} />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (palette: ExercisePagePalette) => StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    paddingTop: 32,
    paddingBottom: 36,
    gap: 18,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    color: palette.text,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontFamily: Fonts.rounded,
  },
  dateText: {
    marginTop: 4,
    color: palette.primary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: Fonts.rounded,
  },
  glassCard: {
    marginHorizontal: 24,
    padding: 18,
    borderRadius: 24,
    backgroundColor: palette.cardBackground,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
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
    lineHeight: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontFamily: Fonts.rounded,
  },
  sectionTitle: {
    marginTop: 10,
    color: palette.text,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Fonts.rounded,
  },
  formWrap: {
    marginTop: 18,
    gap: 12,
  },
  historyHeader: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  historyHeaderTextWrap: {
    flex: 1,
  },
  historyListWrap: {
    marginTop: 18,
  },
});
