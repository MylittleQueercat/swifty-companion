// This file defines the colors and gives the current colors to screens.
import { createContext, useContext } from 'react';

// Use these colors for the dark mode and the light mode.
export const themes = {
  dark: {
    background: '#080B16', panel: '#101629', raised: '#19233C', line: '#263550',
    text: '#F3F5FF', muted: '#8492B2', accent: '#42F5E9', teal: '#B65CFF',
    danger: '#FF4F91', amber: '#FFC857', black: '#080B16',
  },
  light: {
    background: '#F2F5FA', panel: '#FFFFFF', raised: '#E4EAF4', line: '#CAD4E4',
    text: '#12182B', muted: '#65718A', accent: '#008F98', teal: '#8B36C7',
    danger: '#D62863', amber: '#A66A00', black: '#FFFFFF',
  },
} as const;

export type Theme = { [K in keyof typeof themes.dark]: string };
// Give each screen the current theme and the mode control.
export const ThemeContext = createContext<{ theme: Theme; mode: 'dark' | 'light'; toggle: () => void }>({
  theme: themes.dark, mode: 'dark', toggle: () => undefined,
});
export const useTheme = () => useContext(ThemeContext);
