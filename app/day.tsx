import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailHeader } from '@/components/DetailHeader';
import { LogList } from '@/components/LogList';
import { Kicker } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { useMeals } from '@/hooks/useMeals';
import { useWeights } from '@/hooks/useWeights';
import { useWorkouts } from '@/hooks/useWorkouts';
import { formatDay, today } from '@/lib/dates';
import { buildDayLog } from '@/lib/insights';
import { formatWeight } from '@/lib/units';
import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

export default function DayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const { meals } = useMeals();
  const { weights } = useWeights();
  const { workouts } = useWorkouts();
  const { goals } = useGoals();

  const todayStr = today();
  const day = date ?? todayStr;

  const { label, weightLabel, minutes, log } = useMemo(() => {
    const dayWeight = weights.find((w) => w.date === day);
    const dayMinutes = workouts.filter((w) => w.date === day).reduce((sum, w) => sum + w.duration, 0);
    return {
      label: day === todayStr ? 'Today' : formatDay(day),
      weightLabel: dayWeight ? `${formatWeight(dayWeight.value, goals.weightUnit)} ${goals.weightUnit}` : '—',
      minutes: dayMinutes,
      log: buildDayLog(day, meals, weights, workouts, goals.weightUnit),
    };
  }, [day, todayStr, meals, weights, workouts, goals.weightUnit]);

  return (
    <View style={styles.container}>
      <DetailHeader title={label} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <Kicker size={9.5}>Weight</Kicker>
            <Text style={[weight('bold'), styles.statValue]}>{weightLabel}</Text>
          </View>
          <View style={[styles.statCol, styles.statColRight]}>
            <Kicker size={9.5}>Active</Kicker>
            <Text style={[weight('bold'), styles.statValue]}>{minutes} min</Text>
          </View>
        </View>
        <View style={styles.logBody}>
          <LogList entries={log} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  statsGrid: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: theme.colors.border },
  statCol: { flex: 1, padding: 14, paddingHorizontal: 16, borderRightWidth: 2, borderRightColor: theme.colors.border },
  statColRight: { borderRightWidth: 0 },
  statValue: { fontSize: 28, letterSpacing: -0.8, color: theme.colors.text, marginTop: 10 },
  logBody: { paddingHorizontal: spacing.lg },
});
