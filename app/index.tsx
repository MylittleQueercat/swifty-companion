// This file shows the student search screen.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lookup } from '@/src/api';
import { useTheme } from '@/src/theme';

export default function SearchScreen() {
  const { theme, mode, toggle } = useTheme();
  const styles = makeStyles(theme);
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [entrance] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0.45));

  // Start the screen animation and the light animation.
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 750, useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.45, duration: 1500, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [entrance, pulse]);

  // Get the student profile and open the profile screen.
  async function search() {
    if (loading) return;
    setError(''); setLoading(true); Keyboard.dismiss();
    try { const profile = await lookup(login); router.push({ pathname: '/profile', params: { login: profile.login } }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  // Show an error below the input if the search fails.
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.scanLine, { opacity: pulse }]} />
        <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }] }}>
        <View style={styles.topline}><Text style={styles.mark}>42<Text style={styles.markDot}>.</Text></Text><Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} style={styles.themeButton}><Text style={styles.themeButtonText}>{mode === 'dark' ? '☀ LIGHT' : '☾ DARK'}</Text></Pressable></View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>◈  SWIFTY COMPANION</Text>
          <Text style={styles.title}>Find your{ '\n' }next <Text style={styles.titleAccent}>ally.</Text></Text>
          <Text style={styles.description}>Jack into the 42 network. Scan a login to reveal their profile, skills and mission history.</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>⌁  ENTER NETWORK ID</Text>
          <View style={[styles.inputWrap, error ? styles.inputError : null]}><Text style={styles.at}>@</Text><TextInput
            style={styles.input} placeholder="e.g. jdoe" placeholderTextColor={theme.muted} value={login}
            onChangeText={(text) => { setLogin(text); if (error) setError(''); }} autoCapitalize="none" autoCorrect={false}
            returnKeyType="search" onSubmitEditing={search} accessibilityLabel="42 student login" maxLength={32}
          /></View>
          {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : <Text style={styles.hint}>Enter an exact login to open a student profile.</Text>}
          <Pressable onPress={search} disabled={loading} accessibilityRole="button" accessibilityLabel="Find student" style={({ pressed }) => [styles.button, pressed && styles.pressed, loading && styles.disabled]}>
            {loading ? <ActivityIndicator color={theme.black} /> : <><Text style={styles.buttonText}>Explore profile</Text><Text style={styles.arrow}>↗</Text></>}
          </Pressable>
        </View>
        <View style={styles.footer}><View style={styles.footerLine} /><Text style={styles.footerText}>SIGNAL  /  SKILLS  /  MISSIONS</Text><Text style={styles.footerNumber}>● LIVE</Text></View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const makeStyles = (theme: ReturnType<typeof useTheme>["theme"]) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background }, fill: { flex: 1 }, content: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 18, paddingBottom: 28 }, scanLine: { position: 'absolute', top: 75, right: 25, width: 7, height: 7, borderRadius: 4, backgroundColor: theme.accent, shadowColor: theme.accent, shadowRadius: 12, shadowOpacity: 1 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, mark: { color: theme.text, fontSize: 38, fontWeight: '900', letterSpacing: -3 }, markDot: { color: theme.accent }, topLabel: { color: theme.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  themeButton: { minHeight: 42, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.accent, borderRadius: 4, justifyContent: 'center', backgroundColor: theme.panel }, themeButtonText: { color: theme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  hero: { marginTop: 84, marginBottom: 64 }, eyebrow: { color: theme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2.3, marginBottom: 22 },
  title: { color: theme.text, fontSize: 57, lineHeight: 61, fontWeight: '800', letterSpacing: -3 }, titleAccent: { color: theme.accent, fontStyle: 'italic' }, description: { color: theme.muted, fontSize: 16, lineHeight: 25, marginTop: 22, maxWidth: 320 },
  form: { marginBottom: 50 }, fieldLabel: { color: theme.text, fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 13 },
  inputWrap: { minHeight: 62, borderRadius: 4, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.panel, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, shadowColor: theme.accent, shadowRadius: 12, shadowOpacity: 0.12, elevation: 3 }, inputError: { borderColor: theme.danger },
  at: { color: theme.accent, fontSize: 24, fontWeight: '700', marginRight: 9 }, input: { flex: 1, color: theme.text, fontSize: 18, paddingVertical: 14 },
  hint: { color: theme.muted, fontSize: 12, marginTop: 10, minHeight: 36 }, error: { color: theme.danger, fontSize: 13, marginTop: 10, minHeight: 36 },
  button: { backgroundColor: theme.accent, minHeight: 62, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginTop: 12, shadowColor: theme.accent, shadowRadius: 18, shadowOpacity: 0.4, elevation: 8 }, buttonText: { color: theme.black, fontWeight: '900', fontSize: 16, letterSpacing: 1 }, arrow: { color: theme.black, fontSize: 27 }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] }, disabled: { opacity: 0.65 },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 12 }, footerLine: { height: 1, backgroundColor: theme.line, flex: 1 }, footerText: { color: theme.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }, footerNumber: { color: theme.teal, fontSize: 20, fontWeight: '800' },
});
