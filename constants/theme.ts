import { Platform } from 'react-native';

export type BaseThemeName =
  | 'aurora'
  | 'cobalt'
  | 'amethyst'
  | 'inferno';

export type InverseThemeName =
  | 'auroraInverse'
  | 'cobaltInverse'
  | 'amethystInverse'
  | 'infernoInverse';

export type ThemeName = BaseThemeName | InverseThemeName;
export type ThemeAppearance = 'light' | 'dark';
export type ThemeAppearanceMode = 'system' | ThemeAppearance;

export type ThemeColors = {
  text: string;
  textSecondary: string;
  textMuted: string;
  background: string;
  navBackground: string;
  menuBackground: string;
  card: string;
  cardBorder: string;
  navBorder: string;
  accent: string;
  accentMuted: string;
  accentSecondary: string;
  warning: string;
  danger: string;
  success: string;
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  menuIcon: string;
  buttonText: string;
  modalBackdrop: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  chartLine: string;
  chartAxis: string;
  chartButton: string;
  foodLogBtnBg: string;
  foodLogBtnText: string;
  calculatorCancelBtn: string;
  calculatorCancelText: string;
  calculatorCancelBorder: string;
  dashboardToggleActiveBg: string;
  dashboardToggleActiveText: string;
  dashboardToggleInactiveBg: string;
  dashboardToggleInactiveText: string;
};

type ThemeSeed = {
  background: string;
  navBackground: string;
  menuBackground: string;
  card?: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted?: string;
  accent: string;
  accentSecondary: string;
  accentMuted: string;
  warning: string;
  danger: string;
  success?: string;
  buttonText: string;
  modalBackdrop: string;
};

export type ThemeListItem = {
  name: BaseThemeName;
  label: string;
  swatch: string;
};

const buildTheme = (seed: ThemeSeed): ThemeColors => {
  const card = seed.card ?? seed.navBackground;
  const muted = seed.textMuted ?? seed.textSecondary;
  const success = seed.success ?? seed.accent;

  return {
    text: seed.text,
    textSecondary: seed.textSecondary,
    textMuted: muted,
    background: seed.background,
    navBackground: seed.navBackground,
    menuBackground: seed.menuBackground,
    card,
    cardBorder: seed.border,
    navBorder: seed.border,
    accent: seed.accent,
    accentMuted: seed.accentMuted,
    accentSecondary: seed.accentSecondary,
    warning: seed.warning,
    danger: seed.danger,
    success,
    inputBackground: seed.menuBackground,
    inputText: seed.text,
    inputPlaceholder: muted,
    menuIcon: seed.text,
    buttonText: seed.buttonText,
    modalBackdrop: seed.modalBackdrop,
    tint: seed.accent,
    icon: seed.accent,
    tabIconDefault: muted,
    tabIconSelected: seed.accent,
    chartLine: seed.accent,
    chartAxis: muted,
    chartButton: seed.accent,
    foodLogBtnBg: seed.accent,
    foodLogBtnText: seed.buttonText,
    calculatorCancelBtn: seed.navBackground,
    calculatorCancelText: seed.text,
    calculatorCancelBorder: seed.border,
    dashboardToggleActiveBg: seed.accent,
    dashboardToggleActiveText: seed.buttonText,
    dashboardToggleInactiveBg: seed.navBackground,
    dashboardToggleInactiveText: seed.text,
  };
};

export const Colors: Record<ThemeName, ThemeColors> = {
  aurora: buildTheme({
    background: '#0D0A1A',
    navBackground: '#141123',
    menuBackground: '#19152B',
    border: 'rgba(0, 229, 255, 0.14)',
    text: '#F4F3FF',
    textSecondary: '#A9A8C8',
    textMuted: '#7D7AA2',
    accent: '#00E5FF',
    accentSecondary: '#9C27B0',
    accentMuted: 'rgba(0, 229, 255, 0.14)',
    warning: '#FBBF24',
    danger: '#FB7185',
    buttonText: '#0D0A1A',
    modalBackdrop: 'rgba(8, 5, 19, 0.58)',
  }),
  cobalt: buildTheme({
    background: '#08111B',
    navBackground: '#101B2A',
    menuBackground: '#162538',
    border: 'rgba(96, 165, 250, 0.18)',
    text: '#F5FAFF',
    textSecondary: '#C6D7EE',
    textMuted: '#93A9C7',
    accent: '#3B82F6',
    accentSecondary: '#D1D5DB',
    accentMuted: 'rgba(59, 130, 246, 0.18)',
    warning: '#F59E0B',
    danger: '#F87171',
    buttonText: '#07101D',
    modalBackdrop: 'rgba(2, 6, 23, 0.56)',
  }),
  amethyst: buildTheme({
    background: '#120B1B',
    navBackground: '#1A1327',
    menuBackground: '#241738',
    border: 'rgba(192, 132, 252, 0.18)',
    text: '#FAF5FF',
    textSecondary: '#D8C7EA',
    textMuted: '#B69DCC',
    accent: '#A855F7',
    accentSecondary: '#F8FAFF',
    accentMuted: 'rgba(168, 85, 247, 0.18)',
    warning: '#FBBF24',
    danger: '#FB7185',
    buttonText: '#13091D',
    modalBackdrop: 'rgba(12, 8, 20, 0.56)',
  }),
  inferno: buildTheme({
    background: '#170C07',
    navBackground: '#25140C',
    menuBackground: '#341C11',
    border: 'rgba(249, 115, 22, 0.18)',
    text: '#FFF7F0',
    textSecondary: '#EBC9AF',
    textMuted: '#C89B7B',
    accent: '#F97316',
    accentSecondary: '#FF453A',
    accentMuted: 'rgba(249, 115, 22, 0.18)',
    warning: '#FACC15',
    danger: '#EF4444',
    buttonText: '#1A0D04',
    modalBackdrop: 'rgba(17, 9, 4, 0.58)',
  }),
  auroraInverse: buildTheme({
    background: '#F5F8F8',
    navBackground: '#FFFFFF',
    menuBackground: '#EEF4FA',
    border: 'rgba(19, 127, 236, 0.18)',
    text: '#161B33',
    textSecondary: '#4F5F7A',
    textMuted: '#71829D',
    accent: '#137FEC',
    accentSecondary: '#7A3DF0',
    accentMuted: 'rgba(19, 127, 236, 0.12)',
    warning: '#D97706',
    danger: '#DC2626',
    buttonText: '#F5F8F8',
    modalBackdrop: 'rgba(13, 10, 26, 0.18)',
  }),
  cobaltInverse: buildTheme({
    background: '#F6FAFF',
    navBackground: '#FFFFFF',
    menuBackground: '#E8F1FF',
    border: 'rgba(59, 130, 246, 0.18)',
    text: '#11233A',
    textSecondary: '#38506F',
    textMuted: '#5E7696',
    accent: '#2563EB',
    accentSecondary: '#BFC7D5',
    accentMuted: 'rgba(37, 99, 235, 0.12)',
    warning: '#D97706',
    danger: '#DC2626',
    buttonText: '#F6FAFF',
    modalBackdrop: 'rgba(8, 17, 27, 0.18)',
  }),
  amethystInverse: buildTheme({
    background: '#FCF8FF',
    navBackground: '#FFFFFF',
    menuBackground: '#F2E9FF',
    border: 'rgba(168, 85, 247, 0.18)',
    text: '#29143D',
    textSecondary: '#5A3F73',
    textMuted: '#7A5B98',
    accent: '#9333EA',
    accentSecondary: '#FFFFFF',
    accentMuted: 'rgba(147, 51, 234, 0.12)',
    warning: '#D97706',
    danger: '#DC2626',
    buttonText: '#FCF8FF',
    modalBackdrop: 'rgba(18, 11, 27, 0.18)',
  }),
  infernoInverse: buildTheme({
    background: '#FFF8F2',
    navBackground: '#FFFFFF',
    menuBackground: '#FEECDC',
    border: 'rgba(249, 115, 22, 0.18)',
    text: '#3A1C0E',
    textSecondary: '#7E563F',
    textMuted: '#9B7259',
    accent: '#EA580C',
    accentSecondary: '#FF3B30',
    accentMuted: 'rgba(234, 88, 12, 0.12)',
    warning: '#CA8A04',
    danger: '#DC2626',
    buttonText: '#FFF8F2',
    modalBackdrop: 'rgba(23, 12, 7, 0.18)',
  }),
};

export const ThemeList: ThemeListItem[] = [
  { name: 'aurora', label: 'Aurora', swatch: Colors.aurora.accent },
  { name: 'cobalt', label: 'Cobalt', swatch: Colors.cobalt.accent },
  { name: 'amethyst', label: 'Amethyst', swatch: Colors.amethyst.accent },
  { name: 'inferno', label: 'Inferno', swatch: Colors.inferno.accent },
];

export const InverseThemeMap: Record<BaseThemeName, InverseThemeName> = {
  aurora: 'auroraInverse',
  cobalt: 'cobaltInverse',
  amethyst: 'amethystInverse',
  inferno: 'infernoInverse',
};

export const DEFAULT_BASE_THEME: BaseThemeName = 'aurora';
export const SYSTEM_DARK_THEME: ThemeName = 'aurora';
export const SYSTEM_LIGHT_THEME: ThemeName = 'auroraInverse';
export const DEFAULT_THEME: ThemeName = 'aurora';

export function isInverseTheme(themeName: ThemeName) {
  return themeName.endsWith('Inverse');
}

export function resolveThemeName(baseTheme: BaseThemeName, appearance: ThemeAppearance): ThemeName {
  return appearance === 'light' ? InverseThemeMap[baseTheme] : baseTheme;
}

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Times New Roman',
    rounded: 'System',
    mono: 'Menlo',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Space Grotesk', 'Segoe UI', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
