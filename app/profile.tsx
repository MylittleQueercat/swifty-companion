// This file shows a student's profile, skills, and projects.
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cachedProfile, lookup } from '@/src/api';
import { Profile, projectState, skillPercent } from '@/src/profile';
import { useTheme } from '@/src/theme';

export default function ProfileScreen() {
  const { theme, mode, toggle } = useTheme();
  const styles = makeStyles(theme);
  const router = useRouter();
  const { login: routeLogin } = useLocalSearchParams<{ login: string }>();
  const login = typeof routeLogin === 'string' ? routeLogin : '';
  const [profile, setProfile] = useState<Profile | null>(() => cachedProfile(login));
  const [error, setError] = useState('');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [reveal] = useState(() => new Animated.Value(0));

  // Show the profile with a short animation.
  useEffect(() => {
    if (profile) Animated.spring(reveal, { toValue: 1, useNativeDriver: true, tension: 45, friction: 8 }).start();
  }, [profile, reveal]);

  // Get the profile if it is not in memory.
  useEffect(() => {
    let active = true;
    if (cachedProfile(login)) return;
    lookup(login).then((result) => { if (active) setProfile(result); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load this profile.'); });
    return () => { active = false; };
  }, [login]);

  // Use the first cursus until the user selects a different cursus.
  const selected = useMemo(() => profile?.cursus.find((course) => course.id === courseId) || profile?.cursus[0], [profile, courseId]);
  // Show projects for the selected cursus. Put the newest projects first.
  const projects = useMemo(() => {
    if (!profile) return [];
    const filtered = selected ? profile.projects.filter((project) => project.cursusIds.length === 0 || project.cursusIds.includes(selected.id)) : profile.projects;
    return [...filtered].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [profile, selected]);

  // Show the profile, a load message, or an error message.
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.nav}><Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back to search" style={styles.back}><Text style={styles.backArrow}>←</Text><Text style={styles.backText}>DIRECTORY</Text></Pressable><Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} style={styles.themeButton}><Text style={styles.themeButtonText}>{mode === 'dark' ? '☀ LIGHT' : '☾ DARK'}</Text></Pressable></View>
      {!profile ? <View style={styles.center}>{error ? <><Text style={styles.emptyTitle}>SIGNAL LOST</Text><Text style={styles.emptyText}>{error}</Text><Pressable onPress={() => router.back()} style={styles.returnButton}><Text style={styles.returnText}>Back to search</Text></Pressable></> : <><ActivityIndicator color={theme.accent} size="large" /><Text style={styles.emptyText}>Decrypting profile…</Text></>}</View> : <Animated.View style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
        <View style={styles.profileHeader}>
          <Avatar key={profile.login} profile={profile} />
          <View style={styles.profileIntro}><Text style={styles.kicker}>◈ OPERATOR PROFILE  /  {profile.login.toUpperCase()}</Text><Text style={styles.name}>{profile.name}</Text><Text style={styles.handle}>@{profile.login}  {'//'}  CONNECTED</Text></View>
        </View>
        <View style={styles.rule} />
        <View style={styles.stats}>
          <Stat label="LOGIN" value={profile.login} />
          <Stat label="EMAIL" value={profile.email || 'Not available'} wide />
          <Stat label="MOBILE" value={profile.mobile || 'Not available'} />
          <Stat label="LOCATION" value={profile.location || 'Unavailable'} />
          <Stat label="WALLET" value={profile.wallet === null ? '—' : `${profile.wallet} ₳`} />
          <Stat label="EVAL POINTS" value={profile.evaluationPoints === null ? '—' : String(profile.evaluationPoints)} />
          <Stat label="CURSUS LEVEL" value={selected ? selected.level.toFixed(2) : '—'} accent />
        </View>
        <SectionHeading index="01" title="Learning path" />
        {profile.cursus.length > 0 ? <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cursusRow}>
          {profile.cursus.map((course) => <Pressable key={course.id} onPress={() => setCourseId(course.id)} style={[styles.cursusChip, selected?.id === course.id && styles.cursusSelected]} accessibilityRole="button" accessibilityState={{ selected: selected?.id === course.id }}><Text style={[styles.cursusText, selected?.id === course.id && styles.cursusTextSelected]}>{course.name}</Text></Pressable>)}
        </ScrollView><View style={styles.levelCard}><Text style={styles.levelLabel}>CURRENT LEVEL</Text><Text style={styles.levelValue}>{selected?.level.toFixed(2)}<Text style={styles.levelSuffix}> / 21</Text></Text><View style={styles.levelTrack}><View style={[styles.levelFill, { width: `${skillPercent(selected?.level || 0)}%` }]} /></View><Text style={styles.levelCaption}>{skillPercent(selected?.level || 0)}% to next level</Text></View></> : <Text style={styles.sectionEmpty}>No cursus information is available for this student.</Text>}
        <SectionHeading index="02" title="Skills" count={selected?.skills.length} />
        {selected?.skills.length ? <View style={styles.list}>{[...selected.skills].sort((a, b) => b.level - a.level).map((skill, index) => <View key={`${skill.id}-${index}`} style={styles.skillRow}><View style={styles.skillTop}><Text style={styles.skillName}>{skill.name}</Text><Text style={styles.skillNumber}>{skill.level.toFixed(2)}</Text></View><View style={styles.skillTrack}><View style={[styles.skillFill, { width: `${skillPercent(skill.level)}%` }]} /></View><Text style={styles.skillPercent}>{skillPercent(skill.level)}% of level {Math.floor(skill.level) + 1}</Text></View>)}</View> : <Text style={styles.sectionEmpty}>No skills are recorded for this cursus.</Text>}
        <SectionHeading index="03" title="Projects" count={projects.length} />
        {projects.length ? <View style={styles.projectList}>{projects.map((project, index) => { const state = projectState(project); return <View key={`${project.id}-${index}`} style={styles.projectRow}><View style={styles.projectMain}><Text style={styles.projectName} numberOfLines={2}>{project.name}</Text><Text style={[styles.projectStatus, state === 'passed' ? styles.passed : state === 'failed' ? styles.failed : styles.unfinished]}>{state.toUpperCase()}</Text></View><Text style={[styles.grade, state === 'passed' ? styles.passed : state === 'failed' ? styles.failed : styles.unfinished]}>{project.finalMark === null ? '—' : project.finalMark}</Text></View>; })}</View> : <Text style={styles.sectionEmpty}>No projects are recorded for this cursus.</Text>}
        <Text style={styles.endNote}>END OF PROFILE  /  42</Text>
      </Animated.View>}
    </ScrollView>
  </SafeAreaView>;
}

// Try each photo. Show the login letters if no photo works.
function Avatar({ profile }: { profile: Profile }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [imageIndex, setImageIndex] = useState(0);
  return <View style={styles.avatarWrap}>{profile.imageUrls[imageIndex] ? <Image key={profile.imageUrls[imageIndex]} source={{ uri: profile.imageUrls[imageIndex] }} style={styles.avatar} resizeMode="cover" accessibilityLabel={`${profile.name} profile picture`} onError={() => setImageIndex((index) => index + 1)} /> : <Text style={styles.avatarFallback}>{profile.login.slice(0, 2).toUpperCase()}</Text>}</View>;
}

function Stat({ label, value, wide, accent }: { label: string; value: string; wide?: boolean; accent?: boolean }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return <View style={[styles.stat, wide && styles.statWide]}><Text style={styles.statLabel}>{label}</Text><Text style={[styles.statValue, accent && styles.accentText]} numberOfLines={2}>{value}</Text></View>;
}
function SectionHeading({ index, title, count }: { index: string; title: string; count?: number }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return <View style={styles.sectionHead}><Text style={styles.sectionIndex}>{index}</Text><Text style={styles.sectionTitle}>{title}</Text>{count !== undefined && <Text style={styles.sectionCount}>{String(count).padStart(2, '0')}</Text>}</View>;
}

const makeStyles = (theme: ReturnType<typeof useTheme>["theme"]) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 23, paddingTop: 12, paddingBottom: 42 }, nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingRight: 14 }, backArrow: { color: theme.accent, fontSize: 25 }, backText: { color: theme.text, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, navMark: { color: theme.text, fontSize: 29, fontWeight: '900', letterSpacing: -2 },
  themeButton: { minHeight: 42, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.accent, borderRadius: 4, justifyContent: 'center', backgroundColor: theme.panel }, themeButtonText: { color: theme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  center: { minHeight: 450, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 20 }, emptyTitle: { color: theme.text, fontSize: 28, fontWeight: '800', textAlign: 'center' }, emptyText: { color: theme.muted, fontSize: 15, lineHeight: 23, textAlign: 'center' }, returnButton: { backgroundColor: theme.accent, padding: 16, borderRadius: 12, minHeight: 48 }, returnText: { color: theme.black, fontWeight: '800' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 42, marginBottom: 31 }, avatarWrap: { width: 104, height: 104, borderRadius: 8, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.raised, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: theme.accent, shadowRadius: 12, shadowOpacity: 0.3, elevation: 5 }, avatar: { width: '100%', height: '100%' }, avatarFallback: { color: theme.accent, fontSize: 30, fontWeight: '900' }, profileIntro: { flex: 1 }, kicker: { color: theme.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 }, name: { color: theme.text, fontSize: 28, lineHeight: 32, fontWeight: '800', letterSpacing: -1, marginTop: 8 }, handle: { color: theme.teal, fontSize: 12, marginTop: 5, letterSpacing: 1 }, rule: { height: 1, backgroundColor: theme.teal },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 }, stat: { width: '48%', flexGrow: 1, minHeight: 88, backgroundColor: theme.panel, borderRadius: 5, borderLeftWidth: 2, borderLeftColor: theme.teal, padding: 15, justifyContent: 'space-between' }, statWide: { width: '100%' }, statLabel: { color: theme.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 }, statValue: { color: theme.text, fontSize: 17, fontWeight: '700' }, accentText: { color: theme.accent },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 42, marginBottom: 18 }, sectionIndex: { color: theme.accent, fontSize: 12, fontWeight: '800' }, sectionTitle: { color: theme.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.7, flex: 1 }, sectionCount: { color: theme.muted, fontSize: 14, fontWeight: '700' }, sectionEmpty: { color: theme.muted, fontSize: 14, lineHeight: 22, paddingVertical: 12 },
  cursusRow: { gap: 9, paddingBottom: 3 }, cursusChip: { borderWidth: 1, borderColor: theme.line, borderRadius: 100, paddingVertical: 12, paddingHorizontal: 18, minHeight: 45 }, cursusSelected: { backgroundColor: theme.accent, borderColor: theme.accent }, cursusText: { color: theme.text, fontSize: 13, fontWeight: '700' }, cursusTextSelected: { color: theme.black }, levelCard: { backgroundColor: theme.panel, padding: 20, borderRadius: 15, marginTop: 15 }, levelLabel: { color: theme.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }, levelValue: { color: theme.accent, fontSize: 46, fontWeight: '800', letterSpacing: -2, marginVertical: 9 }, levelSuffix: { color: theme.muted, fontSize: 18 }, levelTrack: { height: 7, borderRadius: 7, backgroundColor: theme.line, overflow: 'hidden' }, levelFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 7 }, levelCaption: { color: theme.muted, fontSize: 11, marginTop: 8 },
  list: { backgroundColor: theme.panel, borderRadius: 15, paddingHorizontal: 17 }, skillRow: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: theme.line }, skillTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, skillName: { color: theme.text, fontSize: 15, fontWeight: '700', flex: 1 }, skillNumber: { color: theme.teal, fontSize: 15, fontWeight: '800' }, skillTrack: { height: 5, borderRadius: 6, backgroundColor: theme.line, marginTop: 12, overflow: 'hidden' }, skillFill: { height: '100%', borderRadius: 6, backgroundColor: theme.teal }, skillPercent: { color: theme.muted, fontSize: 10, marginTop: 7 },
  projectList: { borderTopWidth: 1, borderTopColor: theme.line }, projectRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: 13 }, projectMain: { flex: 1, gap: 6 }, projectName: { color: theme.text, fontSize: 15, fontWeight: '700' }, projectStatus: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 }, grade: { fontSize: 20, fontWeight: '800' }, passed: { color: theme.accent }, failed: { color: theme.danger }, unfinished: { color: theme.amber }, endNote: { color: theme.muted, fontSize: 10, letterSpacing: 1.5, textAlign: 'center', marginTop: 44 },
});
