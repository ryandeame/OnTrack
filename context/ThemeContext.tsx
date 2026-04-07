import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import {
  DEFAULT_THEME,
  SYSTEM_DARK_THEME,
  SYSTEM_LIGHT_THEME,
  type ThemeName,
} from '@/constants/theme';

export type ThemeType = 'system' | ThemeName;

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  resolvedTheme: ThemeName;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: DEFAULT_THEME,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useNativeColorScheme();
  const [theme, setTheme] = useState<ThemeType>(DEFAULT_THEME);

  const resolvedTheme = useMemo<ThemeName>(() => {
    if (theme !== 'system') {
      return theme;
    }

    if (systemColorScheme === 'light') {
      return SYSTEM_LIGHT_THEME;
    }

    if (systemColorScheme === 'dark') {
      return SYSTEM_DARK_THEME;
    }

    return DEFAULT_THEME;
  }, [systemColorScheme, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
