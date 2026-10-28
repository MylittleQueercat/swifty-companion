import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, themes, Theme } from '@/src/theme';

export default function Layout() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('swifty-theme').then((saved) => {
      if (active && (saved === 'light' || saved === 'dark')) setMode(saved);
    }).catch(() => undefined).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const toggle = () => setMode((current) => {
    const next = current === 'dark' ? 'light' : 'dark';
    AsyncStorage.setItem('swifty-theme', next).catch(() => undefined);
    return next;
  });
  const theme: Theme = themes[mode];
  if (!ready) return null;
  return <ThemeContext.Provider value={{ theme, mode, toggle }}><StatusBar style={mode === 'dark' ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background }, animation: 'slide_from_right' }} /></ThemeContext.Provider>;
}
