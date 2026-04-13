import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export default function ExerciseTabLayout() {
  const { resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[resolvedTheme];
  const isWeb = Platform.OS === 'web';
  const baseTabBarHeight = isWeb ? 78 : 64;
  const baseBottomPadding = isWeb ? 8 : 6;
  const resolvedBottomPadding = Math.max(insets.bottom, baseBottomPadding);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: colors.navBackground,
          borderTopColor: colors.navBorder,
          height: baseTabBarHeight + resolvedBottomPadding,
          paddingTop: isWeb ? 8 : 6,
          paddingBottom: resolvedBottomPadding,
        },
        tabBarIconStyle: {
          marginTop: isWeb ? 2 : 0,
          marginBottom: isWeb ? 4 : 2,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
          lineHeight: 14,
          fontFamily: Fonts.rounded,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Exercise',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="figure.strengthtraining.traditional" color={color} />,
        }}
      />
      <Tabs.Screen
        name="exercise-dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
    </Tabs>
  );
}
