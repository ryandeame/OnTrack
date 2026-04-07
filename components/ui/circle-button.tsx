import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

type Props = {
  onPress: () => void;
  icon?: keyof typeof ICONS;
  accessibilityLabel?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
};

const ICONS = {
  menu: 'menu',
  close: 'close',
} as const;

export default function CircleButton({ onPress, icon = 'menu', accessibilityLabel, size = 40, color, backgroundColor }: Props) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme;
  const bg = backgroundColor ?? Colors[theme].background;
  const tint = color ?? Colors[theme].tint;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (icon === 'menu' ? 'Open menu' : 'Close menu')}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name={ICONS[icon]} size={Math.round(size * 0.55)} color={tint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
      default: {},
    }),
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

