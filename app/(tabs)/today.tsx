import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { LogList } from '@/components/LogList';
import { GoalBar, Kicker, Rule, StatCell } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { useMeals } from '@/hooks/useMeals';
import { useWeights } from '@/hooks/useWeights';
import { useWorkouts } from '@/hooks/useWorkouts';
import { formatDay, today } from '@/lib/dates';
import { buildDayLog, weekMinutes, weekWorkoutCount } from '@/lib/insights';
import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals } = useMeals();
  const { weights } = useWeights();
  const { workouts } = useWorkouts();
  const { goals } = useGoals();

  const todayStr = today();

  const stats = useMemo(() => {
    const mealsToday = meals.filter((m) => m.date === todayStr);
    const workoutsToday = workouts.filter((w) => w.date === todayStr);
    const weightToday = weights.find((w) => w.date === todayStr);
    const latestWeight = weights[0]?.value;
    const minutes = weekMinutes(workouts, todayStr);
    const sessions = weekWorkoutCount(workouts, todayStr);
    const activeToday = workoutsToday.reduce((sum, w) => sum + w.duration, 0);
    const log = buildDayLog(todayStr, meals, weights, workouts);

    const weightPct =
      latestWeight == null
        ? 0
        : Math.max(0, Math.min(100, Math.round((1 - Math.abs(latestWeight - goals.targetWeight) / 5) * 100)));
    const workoutPct = goals.workoutsPerWeek > 0 ? Math.min(100, Math.round((sessions / goals.workoutsPerWeek) * 100)) : 0;
    const minutesPct = goals.minutesPerWeek > 0 ? Math.min(100, Math.round((minutes / goals.minutesPerWeek) * 100)) : 0;

    return {
      mealsToday,
      weightToday,
      latestWeight,
      minutes,
      sessions,
      activeToday,
      log,
      weightPct,
      workoutPct,
      minutesPct,
    };
  }, [meals, weights, workouts, goals, todayStr]);

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.titleBlock}>
          <Kicker size={10}>{formatDay(todayStr)}</Kicker>
          <Text style={[weight('bold'), styles.title]}>Today</Text>
        </View>
        <Rule />

        <View style={styles.statsRow}>
          <StatCell
            kicker="Meals"
            value={stats.mealsToday.length}
            meta={`of ${goals.mealsPerDay} today`}
            onPress={() => router.push('/meals')}
          />
          <StatCell
            kicker="Weight"
            value={stats.weightToday ? stats.weightToday.value.toFixed(1) : '—'}
            meta={stats.weightToday ? 'kg' : 'not logged'}
            onPress={() => router.push('/weight')}
          />
          <StatCell
            kicker="Active"
            value={stats.activeToday}
            meta="min today"
            onPress={() => router.push('/workouts')}
          />
        </View>
        <Rule />

        <View style={styles.goalsSection}>
          <Kicker size={10}>Goals</Kicker>
          <View style={styles.goalsList}>
            <GoalBar
              label="Weight to target"
              readout={`${(stats.latestWeight ?? goals.targetWeight).toFixed(1)} → ${goals.targetWeight.toFixed(1)} kg`}
              pct={stats.weightPct}
              fill={theme.colors.text}
            />
            <GoalBar
              label="Workouts this week"
              readout={`${stats.sessions} of ${goals.workoutsPerWeek}`}
              pct={stats.workoutPct}
              fill={theme.colors.text}
            />
            <GoalBar
              label="Active minutes"
              readout={`${stats.minutes} of ${goals.minutesPerWeek}`}
              pct={stats.minutesPct}
              fill={theme.colors.accent}
            />
          </View>
        </View>
        <Rule />

        <View style={styles.logHeader}>
          <Kicker size={10}>Today's log</Kicker>
          <Pressable onPress={() => router.push({ pathname: '/day', params: { date: todayStr } })}>
            <Text style={[weight('semibold'), styles.link]}>Full day</Text>
          </Pressable>
        </View>
        <View style={styles.logBody}>
          {stats.log.length > 0 ? (
            <LogList entries={stats.log} />
          ) : (
            <View>
              <RuleTop />
              <Text style={[weight('medium'), styles.emptyLog]}>
                Nothing logged yet today. Start with a meal — it saves offline instantly.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.quickAddWrap}>
          <QuickAddButton label="Meal" accent onPress={() => router.push({ pathname: '/add', params: { kind: 'meal' } })} />
          <QuickAddButton label="Weight" onPress={() => router.push({ pathname: '/add', params: { kind: 'weight' } })} />
          <QuickAddButton label="Workout" onPress={() => router.push({ pathname: '/add', params: { kind: 'workout' } })} />
        </View>
      </ScrollView>
    </View>
  );
}

function RuleTop() {
  return <View style={{ height: 1, backgroundColor: theme.colors.borderLight }} />;
}

function QuickAddButton({ label, accent, onPress }: { label: string; accent?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickAddBtn, { backgroundColor: accent ? theme.colors.accent : 'transparent' }]}
    >
      <Text style={[weight('semibold'), styles.quickAddLabel, { color: accent ? '#fff' : theme.colors.text }]}>
        + {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  titleBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 40, letterSpacing: -1.2, textTransform: 'uppercase', color: theme.colors.text, marginTop: spacing.xs },
  statsRow: { flexDirection: 'row' },
  goalsSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  goalsList: { gap: 14 },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  link: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: theme.colors.accentText },
  logBody: { paddingHorizontal: spacing.lg },
  emptyLog: { fontSize: 13, lineHeight: 19, color: theme.colors.textMuted, paddingVertical: 22 },
  quickAddWrap: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: theme.colors.border, marginTop: spacing.lg },
  quickAddBtn: { flex: 1, borderLeftWidth: 2, borderLeftColor: theme.colors.border, minHeight: 56, padding: 14, justifyContent: 'center' },
  quickAddLabel: { fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
});
