import { useColorScheme } from 'react-native';
import { create } from 'zustand';

import { darkColors, lightColors, type ColorScheme } from '@/theme/colors';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>()((set) => ({
  mode: 'system',
  setMode: (mode: ThemeMode) => {
    set({ mode });
  },
}));

// Hook to get current theme colors with system detection
export const useTheme = () => {
  const systemScheme = useColorScheme() ?? 'dark';
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  // Compute effective mode and colors dynamically
  const effectiveMode = mode === 'system' ? systemScheme : mode;
  const colors: ColorScheme =
    effectiveMode === 'dark' ? darkColors : lightColors;

  return {
    colors,
    mode,
    effectiveMode,
    setMode,
    isDark: effectiveMode === 'dark',
  };
};

