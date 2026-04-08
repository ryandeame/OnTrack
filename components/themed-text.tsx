import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const flattenedStyle = StyleSheet.flatten([
    { color },
    type === 'default' ? styles.default : undefined,
    type === 'title' ? styles.title : undefined,
    type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
    type === 'subtitle' ? styles.subtitle : undefined,
    type === 'link' ? styles.link : undefined,
    style,
  ]);
  const resolvedStyle = resolveNativeFontWeight(flattenedStyle);

  return (
    <Text
      style={resolvedStyle}
      {...rest}
    />
  );
}

function resolveNativeFontWeight(style: TextStyle): TextStyle {
  if (Platform.OS === 'web') {
    return style;
  }

  const fontFamily = style.fontFamily;
  if (!fontFamily || !isSpaceGroteskFamily(fontFamily)) {
    return style;
  }

  const numericWeight = normalizeFontWeight(style.fontWeight);
  const weightedFamily =
    numericWeight >= 700
      ? 'SpaceGrotesk-Bold'
      : numericWeight >= 600
        ? 'SpaceGrotesk-SemiBold'
        : numericWeight >= 500
          ? 'SpaceGrotesk-Medium'
          : 'SpaceGrotesk-Regular';

  return {
    ...style,
    fontFamily: weightedFamily,
    fontWeight: undefined,
  };
}

function isSpaceGroteskFamily(fontFamily: string) {
  return fontFamily === Fonts.sans
    || fontFamily === Fonts.rounded
    || fontFamily.startsWith('SpaceGrotesk-');
}

function normalizeFontWeight(fontWeight: TextStyle['fontWeight']) {
  if (fontWeight === 'bold') {
    return 700;
  }

  if (fontWeight === 'normal' || fontWeight === undefined) {
    return 400;
  }

  const parsed = Number.parseInt(String(fontWeight), 10);
  return Number.isFinite(parsed) ? parsed : 400;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    fontFamily: Fonts.rounded,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 'bold',
    fontFamily: Fonts.rounded,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
    fontFamily: Fonts.sans,
  },
});
