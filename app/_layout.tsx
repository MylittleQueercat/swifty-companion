import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { color } from '@/src/theme';

export default function Layout() {
  return <><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.background }, animation: 'slide_from_right' }} /></>;
}
