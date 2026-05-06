import { MaterialIcons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, type Theme as NavigationTheme } from '@react-navigation/native';
import { useRouter, useSegments } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { deactivateKeepAwake } from 'expo-keep-awake';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, Easing, Platform, Pressable, StyleSheet, View, useColorScheme as useNativeColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import CircleButton from '@/components/ui/circle-button';
import { Colors, DEFAULT_THEME, ThemeList, isInverseTheme, type ThemeName } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  initialRouteName: 'daily-summary',
};

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildNavTheme(themeName: ThemeName): NavigationTheme {
  const colors = Colors[themeName];
  const baseTheme = isInverseTheme(themeName) ? DefaultTheme : DarkTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.navBackground,
      text: colors.text,
      border: colors.navBorder,
      notification: colors.accentSecondary,
    },
  };
}

function InlineAppearanceToggle({
  resolvedAppearance,
  textColor,
  onToggle,
}: {
  resolvedAppearance: 'light' | 'dark';
  textColor: string;
  onToggle: () => void;
}) {
  const translateX = useRef(new Animated.Value(resolvedAppearance === 'light' ? 0 : 32)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: resolvedAppearance === 'light' ? 0 : 32,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [resolvedAppearance, translateX]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: resolvedAppearance === 'dark' }}
      accessibilityLabel={`Use ${resolvedAppearance === 'light' ? 'dark' : 'light'} theme mode`}
      style={[styles.inlineAppearanceSwitch, { borderColor: withAlpha(textColor, 0.12) }]}
      onPress={onToggle}>
      <View style={styles.inlineAppearanceTrack} />
      <Animated.View
        style={[
          styles.inlineAppearanceThumb,
          {
            backgroundColor: resolvedAppearance === 'light' ? '#FFFFFF' : '#000000',
            transform: [{ translateX }, { translateY: -11 }],
          },
        ]}
      />
    </Pressable>
  );
}

function DrawerShell() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const systemColorScheme = useNativeColorScheme();
  const { user, signOut } = useAuth();
  const { resolvedTheme, resolvedAppearance, appearanceMode, setAppearanceMode, theme, setTheme } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = useState(true);

  const navTheme = useMemo(() => buildNavTheme(resolvedTheme), [resolvedTheme]);
  const colors = Colors[resolvedTheme];
  const isLightSurface = isInverseTheme(resolvedTheme);
  const isSystemAppearance = appearanceMode === 'system';
  const systemIconName = systemColorScheme === 'dark' ? 'dark-mode' : 'light-mode';
  const drawerViewportInset = Platform.OS === 'android'
    ? Math.max(insets.bottom, 28)
    : Math.max(insets.bottom, 12);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  const activeSegments = segments.length ? segments : ['daily-summary'];

  const navItems = [
    { label: 'Daily Summary', icon: 'insights', href: '/daily-summary', matches: ['daily-summary'] },
    { label: 'Food', icon: 'restaurant', href: '/food', matches: ['(tabs)', 'food', 'food-dashboard'] },
    { label: 'Exercise', icon: 'fitness-center', href: '/exercise', matches: ['exercise'] },
  ] as const;

  return (
    <NavThemeProvider value={navTheme}>
      <Drawer
        screenOptions={({ navigation }) => ({
          headerTitle: '',
          drawerType: 'front',
          headerStyle: { backgroundColor: colors.navBackground },
          headerTintColor: colors.text,
          sceneContainerStyle: { backgroundColor: colors.background },
          drawerStyle: { backgroundColor: colors.menuBackground, width: 332 },
          drawerActiveTintColor: colors.accent,
          drawerInactiveTintColor: colors.text,
          headerLeft: () => (
            <View style={styles.menuButtonWrap}>
              <CircleButton
                onPress={() => navigation.openDrawer()}
                icon="menu"
                accessibilityLabel="Open menu"
                color={colors.menuIcon}
                backgroundColor={colors.menuBackground}
              />
            </View>
          ),
          headerRight: () => (
            <View style={styles.userHeaderWrap}>
              <View
                style={[
                  styles.userHeaderIcon,
                  {
                    backgroundColor: colors.menuBackground,
                    borderColor: colors.navBorder,
                  },
                ]}>
                <MaterialIcons
                  name="person"
                  size={22}
                  color={user ? colors.accent : colors.textSecondary}
                />
              </View>
            </View>
          ),
        })}
        drawerContent={({ navigation }) => (
          <View
            style={[
              styles.drawerViewport,
              {
                backgroundColor: colors.menuBackground,
                paddingBottom: drawerViewportInset,
              },
            ]}>
          <DrawerContentScrollView
            contentContainerStyle={[
              styles.drawerContainer,
              {
                backgroundColor: colors.menuBackground,
              },
            ]}
            style={styles.drawerScroll}
            showsVerticalScrollIndicator={false}>
            <View style={[styles.drawerHeader, { paddingTop: insets.top + 8 }]}>
              <CircleButton
                onPress={() => navigation.closeDrawer()}
                icon="close"
                accessibilityLabel="Close menu"
                color={colors.menuIcon}
                backgroundColor={colors.navBackground}
              />
              <View style={styles.drawerHeaderTextWrap}>
                <ThemedText type="title" style={styles.drawerTitle}>OnTrack</ThemedText>
              </View>
            </View>

            <View style={styles.drawerSection}>
              {navItems.map((item) => {
                const isActive = item.matches.some((segment) => activeSegments.includes(segment));

                return (
                  <Pressable
                    key={item.label}
                    style={({ pressed }) => [
                      styles.drawerItem,
                      {
                        backgroundColor: isActive ? colors.accentMuted : 'transparent',
                        borderColor: isActive ? colors.navBorder : 'transparent',
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                    onPress={() => {
                      navigation.closeDrawer();
                      router.push(item.href as never);
                    }}>
                    <View
                      style={[
                        styles.drawerItemIcon,
                        { backgroundColor: isActive ? colors.accent : colors.navBackground },
                      ]}>
                      <MaterialIcons
                        name={item.icon}
                        size={18}
                        color={isActive ? colors.buttonText : colors.textSecondary}
                      />
                    </View>
                    <View style={styles.drawerItemTextWrap}>
                      <ThemedText type="defaultSemiBold">{item.label}</ThemedText>
                      {item.label !== 'Daily Summary' && (
                        <ThemedText style={[styles.drawerItemCaption, { color: colors.textSecondary }]}> 
                          {item.label === 'Food' && 'Meal tracking and nutrition insights'}
                          {item.label === 'Exercise' && 'Workout tracking and training history'}
                        </ThemedText>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.themeSection, { borderTopColor: colors.navBorder }]}> 
              <Pressable style={styles.themeHeader} onPress={() => setIsThemeOpen((current) => !current)}>
                <View style={styles.themeHeaderLeft}>
                  <MaterialIcons name="palette" size={20} color={colors.text} />
                  <View>
                    <ThemedText type="defaultSemiBold">Theme Studio</ThemedText>
                  </View>
                </View>
                <MaterialIcons
                  name={isThemeOpen ? 'keyboard-arrow-down' : 'keyboard-arrow-right'}
                  size={20}
                  color={colors.text}
                />
              </Pressable>

              {isThemeOpen && (
                <>
                  <Pressable
                    style={[
                      styles.systemThemeRow,
                      {
                        backgroundColor: isSystemAppearance ? colors.accentMuted : colors.navBackground,
                        borderColor: colors.navBorder,
                      },
                    ]}
                    onPress={() => setAppearanceMode('system')}>
                    <View style={styles.systemThemeLabelWrap}>
                      <View style={[styles.systemIconWrap, { backgroundColor: colors.navBackground }]}>
                        <MaterialIcons
                          name={systemIconName}
                          size={14}
                          color={systemColorScheme === 'dark' ? colors.text : '#FDB813'}
                        />
                      </View>
                      <ThemedText type="defaultSemiBold">System</ThemedText>
                    </View>
                  </Pressable>

                  <View style={styles.themeGrid}>
                    {ThemeList.map((item) => {
                      const palette = Colors[item.name];
                      const selected = !isSystemAppearance && theme === item.name;

                      return (
                        <View
                          key={item.name}
                          style={[
                            styles.themeCard,
                            {
                              backgroundColor: selected ? palette.accentMuted : colors.navBackground,
                              borderColor: selected ? palette.accent : colors.navBorder,
                            },
                          ]}>
                          <Pressable
                            style={styles.themeCardMain}
                            onPress={() => {
                              setTheme(item.name);
                              if (isSystemAppearance) {
                                setAppearanceMode(resolvedAppearance);
                              }
                            }}>
                            <View style={[styles.themeSwatch, { backgroundColor: palette.accent }]} />
                            <View style={styles.themeCardTextWrap}>
                              <ThemedText type="defaultSemiBold" style={styles.themeCardLabel}>{item.label}</ThemedText>
                            </View>
                          </Pressable>
                          {selected && (
                            <InlineAppearanceToggle
                              resolvedAppearance={resolvedAppearance}
                              textColor={colors.text}
                              onToggle={() => setAppearanceMode(resolvedAppearance === 'light' ? 'dark' : 'light')}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>

            <View
              style={[
                styles.signOutSection,
                {
                  borderTopColor: colors.navBorder,
                },
              ]}>
              <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                <MaterialIcons name="logout" size={20} color={colors.danger} />
                <ThemedText style={[styles.signOutText, { color: colors.danger }]}>Sign Out</ThemedText>
              </Pressable>
            </View>
          </DrawerContentScrollView>
          </View>
        )}>
        <Drawer.Screen name="daily-summary" options={{ drawerLabel: 'Daily Summary', title: 'Daily Summary' }} />
        <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Food', title: 'Food' }} />
        <Drawer.Screen name="exercise" options={{ drawerLabel: 'Exercise', title: 'Exercise' }} />
        <Drawer.Screen name="(auth)" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
        <Drawer.Screen name="modal" options={{ drawerItemStyle: { display: 'none' }, title: 'Modal' }} />
      </Drawer>
      <StatusBar style={isLightSurface ? 'dark' : 'light'} />
    </NavThemeProvider>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const releaseKeepAwake = () => {
      void deactivateKeepAwake().catch((error) => {
        if (__DEV__) {
          console.warn('Failed to release Android keep-awake lock', error);
        }
      });
    };

    releaseKeepAwake();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        releaseKeepAwake();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'OnTrack';

      if (!document.getElementById('ontrack-space-grotesk-font')) {
        const link = document.createElement('link');
        link.id = 'ontrack-space-grotesk-font';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap';
        document.head.appendChild(link);
      }
    }
  }, [segments]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    void SystemUI.setBackgroundColorAsync(Colors[resolvedTheme].background).catch(() => {});
  }, [resolvedTheme]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/daily-summary');
    }
  }, [loading, router, segments, user]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[resolvedTheme].background }]}> 
        <ActivityIndicator size="large" color={Colors[DEFAULT_THEME].accent} />
      </View>
    );
  }

  return (
    <View style={[styles.navigatorRoot, { backgroundColor: Colors[resolvedTheme].background }]}>
      <DrawerShell />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    'SpaceGrotesk-SemiBold': SpaceGrotesk_600SemiBold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigatorRoot: {
    flex: 1,
  },
  menuButtonWrap: {
    paddingLeft: 12,
  },
  userHeaderWrap: {
    paddingRight: 12,
  },
  userHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
      default: {},
    }),
  },
  drawerViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContainer: {
    paddingTop: 0,
    paddingBottom: 12,
    flexGrow: 1,
  },
  drawerHeader: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerHeaderTextWrap: {
    flex: 1,
  },
  drawerTitle: {
    fontSize: 26,
    lineHeight: 28,
  },
  drawerSection: {
    paddingHorizontal: 12,
    gap: 8,
  },
  drawerItem: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  drawerItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemTextWrap: {
    flex: 1,
  },
  drawerItemCaption: {
    fontSize: 12,
    marginTop: 2,
  },
  themeSection: {
    marginTop: 18,
    marginHorizontal: 18,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  themeHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  systemThemeRow: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemThemeLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  systemIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardMain: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineAppearanceSwitch: {
    width: 64,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  inlineAppearanceTrack: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: '50%',
    height: 3,
    marginTop: -1.5,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.28)',
  },
  inlineAppearanceThumb: {
    position: 'absolute',
    left: 5,
    top: '50%',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  themeGrid: {
    marginTop: 12,
    gap: 8,
  },
  themeCard: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  themeSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeCardTextWrap: {
    flex: 1,
  },
  themeCardLabel: {
    fontSize: 15,
  },
  signOutSection: {
    marginTop: 18,
    marginHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  signOutButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 2,
  },
  signOutText: {
    fontWeight: '700',
  },
});

