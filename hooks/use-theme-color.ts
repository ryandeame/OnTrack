/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, SYSTEM_DARK_THEME, SYSTEM_LIGHT_THEME, type ThemeColors, type ThemeName } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type ThemeColorOverrides = Partial<Record<ThemeName | 'light' | 'dark', string>>;

export function useThemeColor(
  props: ThemeColorOverrides,
  colorName: keyof ThemeColors
) {
  const { resolvedTheme } = useTheme();
  const colorFromTheme = props[resolvedTheme];

  if (colorFromTheme) {
    return colorFromTheme;
  }

  const fallbackKey = resolvedTheme.endsWith('Inverse') ? 'light' : 'dark';
  const fallbackColor = props[fallbackKey];

  if (fallbackColor) {
    return fallbackColor;
  }

  const systemTheme = fallbackKey === 'light' ? SYSTEM_LIGHT_THEME : SYSTEM_DARK_THEME;
  return Colors[systemTheme][colorName];
}
