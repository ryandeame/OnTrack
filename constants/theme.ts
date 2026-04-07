import { Platform } from 'react-native';

export type ThemeName =
  | 'aurora'
  | 'cobalt'
  | 'amethyst'
  | 'inferno'
  | 'auroraInverse'
  | 'cobaltInverse'
  | 'amethystInverse'
  | 'infernoInverse';

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
  name: ThemeName;
  label: string;
  swatch: string;
  inverseOf?: ThemeName;
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
    background: '#0A0F0D',
    navBackground: '#111A15',
    menuBackground: '#17231C',
    border: 'rgba(19, 236, 109, 0.14)',
    text: '#F5FFF8',
    textSecondary: '#B7CDC0',
    textMuted: '#8FA89A',
    accent: '#13EC6D',
    accentSecondary: '#5FF6A3',
    accentMuted: 'rgba(19, 236, 109, 0.16)',
    warning: '#FBBF24',
    danger: '#FB7185',
    buttonText: '#07110B',
    modalBackdrop: 'rgba(0, 0, 0, 0.52)',
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
    accentSecondary: '#60A5FA',
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
    accentSecondary: '#C084FC',
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
    accentSecondary: '#FB923C',
    accentMuted: 'rgba(249, 115, 22, 0.18)',
    warning: '#FACC15',
    danger: '#EF4444',
    buttonText: '#1A0D04',
    modalBackdrop: 'rgba(17, 9, 4, 0.58)',
  }),
  auroraInverse: buildTheme({
    background: '#F5FFF8',
    navBackground: '#FFFFFF',
    menuBackground: '#E7F7ED',
    border: 'rgba(19, 236, 109, 0.18)',
    text: '#102218',
    textSecondary: '#416252',
    textMuted: '#5A7B6A',
    accent: '#13C962',
    accentSecondary: '#0F9F4D',
    accentMuted: 'rgba(19, 201, 98, 0.12)',
    warning: '#D97706',
    danger: '#DC2626',
    buttonText: '#F5FFF8',
    modalBackdrop: 'rgba(10, 15, 13, 0.18)',
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
    accentSecondary: '#1D4ED8',
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
    accentSecondary: '#7E22CE',
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
    accentSecondary: '#C2410C',
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
  { name: 'auroraInverse', label: 'Aurora Inverse', swatch: Colors.auroraInverse.accent, inverseOf: 'aurora' },
  { name: 'cobaltInverse', label: 'Cobalt Inverse', swatch: Colors.cobaltInverse.accent, inverseOf: 'cobalt' },
  { name: 'amethystInverse', label: 'Amethyst Inverse', swatch: Colors.amethystInverse.accent, inverseOf: 'amethyst' },
  { name: 'infernoInverse', label: 'Inferno Inverse', swatch: Colors.infernoInverse.accent, inverseOf: 'inferno' },
];

export const SYSTEM_DARK_THEME: ThemeName = 'aurora';
export const SYSTEM_LIGHT_THEME: ThemeName = 'auroraInverse';
export const DEFAULT_THEME: ThemeName = 'aurora';

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
