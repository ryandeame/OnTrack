import { MaterialIcons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, type Theme as NavigationTheme } from '@react-navigation/native';
import { useRouter, useSegments } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import CircleButton from '@/components/ui/circle-button';
import { Colors, DEFAULT_THEME, ThemeList, type ThemeName } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  initialRouteName: 'roi',
};

function isInverseTheme(themeName: ThemeName) {
  return themeName.endsWith('Inverse');
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

function DrawerShell() {
  const router = useRouter();
  const segments = useSegments();
  const { user, signOut } = useAuth();
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [isThemeOpen, setIsThemeOpen] = useState(true);

  const navTheme = useMemo(() => buildNavTheme(resolvedTheme), [resolvedTheme]);
  const colors = Colors[resolvedTheme];
  const isLightSurface = isInverseTheme(resolvedTheme);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  const currentSegment = segments[0] ?? 'roi';

  const navItems = [
    { label: 'Daily Summary', icon: 'insights', href: '/roi', matches: ['roi'] },
    { label: 'Food', icon: 'restaurant', href: '/', matches: ['(tabs)'] },
    { label: 'Food Dashboard', icon: 'bar-chart', href: '/dashboard', matches: ['dashboard'] },
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
        })}
        drawerContent={({ navigation }) => (
          <View style={[styles.drawerContainer, { backgroundColor: colors.menuBackground }]}> 
            <View style={styles.drawerHeader}>
              <CircleButton
                onPress={() => navigation.closeDrawer()}
                icon="close"
                accessibilityLabel="Close menu"
                color={colors.menuIcon}
                backgroundColor={colors.navBackground}
              />
              <View style={styles.drawerHeaderTextWrap}>
                <ThemedText style={styles.drawerEyebrow}>OnTrack Premium</ThemedText>
                <ThemedText type="title" style={styles.drawerTitle}>Navigation</ThemedText>
              </View>
            </View>

            {user && (
              <View
                style={[
                  styles.userCard,
                  {
                    backgroundColor: colors.navBackground,
                    borderColor: colors.navBorder,
                    shadowColor: colors.accent,
                  },
                ]}>
                <View style={[styles.userAvatar, { backgroundColor: colors.accentMuted }]}> 
                  <MaterialIcons name="person" size={22} color={colors.accent} />
                </View>
                <View style={styles.userTextWrap}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{user.email ?? 'Signed in'}</ThemedText>
                  <ThemedText style={[styles.userCaption, { color: colors.textSecondary }]}>Supabase account</ThemedText>
                </View>
              </View>
            )}

            <View style={styles.drawerSection}>
              {navItems.map((item) => {
                const isActive = item.matches.some((segment) => segment === currentSegment);

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
                      <ThemedText style={[styles.drawerItemCaption, { color: colors.textSecondary }]}> 
                        {item.label === 'Daily Summary' && 'Recovered Stitch summary screen'}
                        {item.label === 'Food' && 'Latest rebuilt log entry and history'}
                        {item.label === 'Food Dashboard' && 'Supabase trends and history'}
                        {item.label === 'Exercise' && 'Recovered exercise entry and log'}
                      </ThemedText>
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
                    <ThemedText style={[styles.themeHeaderCopy, { color: colors.textSecondary }]}>Aurora plus the recovered inverse variants</ThemedText>
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
                        backgroundColor: theme === 'system' ? colors.accentMuted : colors.navBackground,
                        borderColor: colors.navBorder,
                      },
                    ]}
                    onPress={() => setTheme('system')}>
                    <View style={styles.systemThemeLabelWrap}>
                      <View style={[styles.systemSwatch, { backgroundColor: Colors.aurora.accent }]} />
                      <View style={[styles.systemSwatch, styles.systemSwatchOffset, { backgroundColor: Colors.auroraInverse.accent }]} />
                      <View>
                        <ThemedText type="defaultSemiBold">System</ThemedText>
                        <ThemedText style={[styles.systemThemeCaption, { color: colors.textSecondary }]}>Aurora dark or inverse light automatically</ThemedText>
                      </View>
                    </View>
                    {theme === 'system' && <MaterialIcons name="check" size={18} color={colors.accent} />}
                  </Pressable>

                  <View style={styles.themeGrid}>
                    {ThemeList.map((item) => {
                      const palette = Colors[item.name];
                      const selected = theme === item.name;

                      return (
                        <Pressable
                          key={item.name}
                          style={[
                            styles.themeCard,
                            {
                              backgroundColor: selected ? palette.accentMuted : colors.navBackground,
                              borderColor: selected ? palette.accent : colors.navBorder,
                            },
                          ]}
                          onPress={() => setTheme(item.name)}>
                          <View style={[styles.themeSwatch, { backgroundColor: palette.accent }]} />
                          <View style={styles.themeCardTextWrap}>
                            <ThemedText type="defaultSemiBold" style={styles.themeCardLabel}>{item.label}</ThemedText>
                            <ThemedText style={[styles.themeCardCaption, { color: colors.textSecondary }]}> 
                              {item.inverseOf ? 'Inverse variant' : 'Stitch palette'}
                            </ThemedText>
                          </View>
                          {selected && <MaterialIcons name="check-circle" size={18} color={palette.accent} />}
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
            </View>

            <View style={[styles.signOutSection, { borderTopColor: colors.navBorder }]}> 
              <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                <MaterialIcons name="logout" size={20} color={colors.danger} />
                <ThemedText style={[styles.signOutText, { color: colors.danger }]}>Sign Out</ThemedText>
              </Pressable>
            </View>
          </View>
        )}>
        <Drawer.Screen name="roi" options={{ drawerLabel: 'Daily Summary', title: 'Daily Summary' }} />
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
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'OnTrack';
    }
  }, [segments]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/roi');
    }
  }, [loading, router, segments, user]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[resolvedTheme].background }]}> 
        <ActivityIndicator size="large" color={Colors[DEFAULT_THEME].accent} />
      </View>
    );
  }

  return <DrawerShell />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonWrap: {
    paddingLeft: 12,
  },
  drawerContainer: {
    flex: 1,
    paddingTop: 8,
  },
  drawerHeader: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerHeaderTextWrap: {
    flex: 1,
  },
  drawerEyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    opacity: 0.72,
  },
  drawerTitle: {
    fontSize: 26,
    lineHeight: 28,
  },
  userCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextWrap: {
    flex: 1,
  },
  userCaption: {
    fontSize: 13,
    marginTop: 2,
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
  themeHeaderCopy: {
    fontSize: 12,
    marginTop: 2,
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
  },
  systemSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  systemSwatchOffset: {
    marginLeft: -20,
    marginRight: 8,
  },
  systemThemeCaption: {
    fontSize: 12,
    marginTop: 2,
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
  themeCardCaption: {
    fontSize: 12,
    marginTop: 2,
  },
  signOutSection: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  signOutButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signOutText: {
    fontWeight: '700',
  },
});

