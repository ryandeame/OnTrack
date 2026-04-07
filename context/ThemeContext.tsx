import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import {
  DEFAULT_BASE_THEME,
  DEFAULT_THEME,
  resolveThemeName,
  type BaseThemeName,
  type ThemeAppearance,
  type ThemeAppearanceMode,
  type ThemeName,
} from '@/constants/theme';

interface ThemeContextType {
  theme: BaseThemeName;
  setTheme: (theme: BaseThemeName) => void;
  appearanceMode: ThemeAppearanceMode;
  setAppearanceMode: (appearanceMode: ThemeAppearanceMode) => void;
  resolvedAppearance: ThemeAppearance;
  resolvedTheme: ThemeName;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_BASE_THEME,
  setTheme: () => {},
  appearanceMode: 'system',
  setAppearanceMode: () => {},
  resolvedAppearance: 'dark',
  resolvedTheme: DEFAULT_THEME,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useNativeColorScheme();
  const [theme, setTheme] = useState<BaseThemeName>(DEFAULT_BASE_THEME);
  const [appearanceMode, setAppearanceMode] = useState<ThemeAppearanceMode>('system');

  const resolvedAppearance = useMemo<ThemeAppearance>(() => {
    if (appearanceMode !== 'system') {
      return appearanceMode;
    }

    return systemColorScheme === 'light' ? 'light' : 'dark';
  }, [appearanceMode, systemColorScheme]);

  const resolvedTheme = useMemo<ThemeName>(
    () => resolveThemeName(theme, resolvedAppearance),
    [resolvedAppearance, theme]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        appearanceMode,
        setAppearanceMode,
        resolvedAppearance,
        resolvedTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
