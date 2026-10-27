import { useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lookup } from '@/src/api';
import { color } from '@/src/theme';

export default function SearchScreen() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function search() {
    if (loading) return;
    setError(''); setLoading(true); Keyboard.dismiss();
    try { const profile = await lookup(login); router.push({ pathname: '/profile', params: { login: profile.login } }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topline}><Text style={styles.mark}>42<Text style={styles.markDot}>.</Text></Text><Text style={styles.topLabel}>STUDENT DIRECTORY  /  01</Text></View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SWIFTY COMPANION</Text>
          <Text style={styles.title}>Find your{ '\n' }next <Text style={styles.titleAccent}>peer.</Text></Text>
          <Text style={styles.description}>A clear view of the people, progress, and projects behind every 42 login.</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>42 LOGIN</Text>
          <View style={[styles.inputWrap, error ? styles.inputError : null]}><Text style={styles.at}>@</Text><TextInput
            style={styles.input} placeholder="e.g. jdoe" placeholderTextColor="#718883" value={login}
            onChangeText={(text) => { setLogin(text); if (error) setError(''); }} autoCapitalize="none" autoCorrect={false}
            returnKeyType="search" onSubmitEditing={search} accessibilityLabel="42 student login" maxLength={32}
          /></View>
          {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : <Text style={styles.hint}>Enter an exact login to open a student profile.</Text>}
          <Pressable onPress={search} disabled={loading} accessibilityRole="button" accessibilityLabel="Find student" style={({ pressed }) => [styles.button, pressed && styles.pressed, loading && styles.disabled]}>
            {loading ? <ActivityIndicator color={color.black} /> : <><Text style={styles.buttonText}>Explore profile</Text><Text style={styles.arrow}>↗</Text></>}
          </Pressable>
        </View>
        <View style={styles.footer}><View style={styles.footerLine} /><Text style={styles.footerText}>PEOPLE  /  SKILLS  /  PROJECTS</Text><Text style={styles.footerNumber}>42°</Text></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.background }, fill: { flex: 1 }, content: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 18, paddingBottom: 28 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, mark: { color: color.text, fontSize: 38, fontWeight: '900', letterSpacing: -3 }, markDot: { color: color.accent }, topLabel: { color: color.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  hero: { marginTop: 84, marginBottom: 64 }, eyebrow: { color: color.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2.3, marginBottom: 22 },
  title: { color: color.text, fontSize: 57, lineHeight: 61, fontWeight: '800', letterSpacing: -3 }, titleAccent: { color: color.accent, fontStyle: 'italic' }, description: { color: color.muted, fontSize: 16, lineHeight: 25, marginTop: 22, maxWidth: 320 },
  form: { marginBottom: 50 }, fieldLabel: { color: color.text, fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 13 },
  inputWrap: { minHeight: 62, borderRadius: 14, borderWidth: 1, borderColor: color.line, backgroundColor: color.panel, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 }, inputError: { borderColor: color.danger },
  at: { color: color.accent, fontSize: 24, fontWeight: '700', marginRight: 9 }, input: { flex: 1, color: color.text, fontSize: 18, paddingVertical: 14 },
  hint: { color: color.muted, fontSize: 12, marginTop: 10, minHeight: 36 }, error: { color: color.danger, fontSize: 13, marginTop: 10, minHeight: 36 },
  button: { backgroundColor: color.accent, minHeight: 62, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginTop: 12 }, buttonText: { color: color.black, fontWeight: '800', fontSize: 16 }, arrow: { color: color.black, fontSize: 27 }, pressed: { opacity: 0.75 }, disabled: { opacity: 0.65 },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 12 }, footerLine: { height: 1, backgroundColor: color.line, flex: 1 }, footerText: { color: color.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 }, footerNumber: { color: color.teal, fontSize: 20, fontWeight: '800' },
});
