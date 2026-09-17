import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailHeader } from '@/components/DetailHeader';
import { ProgressGrid } from '@/components/ProgressGrid';
import { Kicker, SecondaryButton } from '@/components/ui';
import { useMeals } from '@/hooks/useMeals';
import { useWeights } from '@/hooks/useWeights';
import { useWorkouts } from '@/hooks/useWorkouts';
import { today } from '@/lib/dates';
import { computeConsistency, computeStreak, dayFullness, lastNDays } from '@/lib/insights';
import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals } = useMeals();
  const { weights } = useWeights();
  const { workouts } = useWorkouts();
  const todayStr = today();

  const { streak, consistency, grid } = useMemo(() => {
    const days = lastNDays(todayStr, 35);
    return {
      streak: computeStreak(todayStr, meals, weights, workouts),
      consistency: computeConsistency(todayStr, meals, weights, workouts),
      grid: days.map((d) => ({ tone: dayFullness(d, meals, weights, workouts), label: d })),
    };
  }, [todayStr, meals, weights, workouts]);

  return (
    <View style={styles.container}>
      <DetailHeader title="Progress" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <Kicker size={9.5}>Streak</Kicker>
            <Text style={[weight('bold'), styles.statValue]}>{streak}</Text>
            <Kicker size={10} color={theme.colors.textFaint} style={{ marginTop: 7 }}>
              Days logged
            </Kicker>
          </View>
          <View style={[styles.statCol, styles.statColRight]}>
            <Kicker size={9.5}>Consistency</Kicker>
            <Text style={[weight('bold'), styles.statValue]}>{consistency}%</Text>
            <Kicker size={10} color={theme.colors.textFaint} style={{ marginTop: 7 }}>
              Last 5 weeks
            </Kicker>
          </View>
        </View>

        <View style={styles.gridSection}>
          <Kicker size={9.5}>Every day, oldest first</Kicker>
          <View style={{ marginTop: spacing.md }}>
            <ProgressGrid days={grid} />
          </View>
        </View>

        <View style={styles.adjustWrap}>
          <SecondaryButton label="Adjust goals" onPress={() => router.push('/goals')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  statsGrid: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: theme.colors.border },
  statCol: { flex: 1, padding: 18, paddingHorizontal: 16, borderRightWidth: 2, borderRightColor: theme.colors.border },
  statColRight: { borderRightWidth: 0 },
  statValue: { fontSize: 42, letterSpacing: -1.2, color: theme.colors.text, marginTop: 10 },
  gridSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 2, borderBottomColor: theme.colors.border },
  adjustWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
});
