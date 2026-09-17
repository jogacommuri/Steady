import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { LogList } from '@/components/LogList';
import { GoalBar, Kicker, Rule } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { useMeals } from '@/hooks/useMeals';
import { useWeights } from '@/hooks/useWeights';
import { useWorkouts } from '@/hooks/useWorkouts';
import { formatDay, today } from '@/lib/dates';
import { buildDayLog, weekMinutes, weekWorkoutCount } from '@/lib/insights';
import { formatWeight } from '@/lib/units';
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
    const latestWeight = weights[0]?.value;
    const minutes = weekMinutes(workouts, todayStr);
    const sessions = weekWorkoutCount(workouts, todayStr);
    const log = buildDayLog(todayStr, meals, weights, workouts, goals.weightUnit);

    const mealsPct = goals.mealsPerDay > 0 ? Math.min(100, Math.round((mealsToday.length / goals.mealsPerDay) * 100)) : 0;
    const weightPct =
      latestWeight == null
        ? 0
        : Math.max(0, Math.min(100, Math.round((1 - Math.abs(latestWeight - goals.targetWeight) / 5) * 100)));
    const workoutPct = goals.workoutsPerWeek > 0 ? Math.min(100, Math.round((sessions / goals.workoutsPerWeek) * 100)) : 0;
    const minutesPct = goals.minutesPerWeek > 0 ? Math.min(100, Math.round((minutes / goals.minutesPerWeek) * 100)) : 0;

    return {
      mealsToday,
      latestWeight,
      minutes,
      sessions,
      log,
      mealsPct,
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

        <View style={styles.goalsSection}>
          <Kicker size={10}>Goals</Kicker>
          <View style={styles.goalsList}>
            <GoalBar
              label="Meals today"
              readout={`${stats.mealsToday.length} of ${goals.mealsPerDay}`}
              pct={stats.mealsPct}
              fill={theme.colors.text}
              onPress={() => router.push('/meals')}
            />
            <GoalBar
              label="Weight to target"
              readout={`${formatWeight(stats.latestWeight ?? goals.targetWeight, goals.weightUnit)} → ${formatWeight(goals.targetWeight, goals.weightUnit)} ${goals.weightUnit}`}
              pct={stats.weightPct}
              fill={theme.colors.text}
              onPress={() => router.push('/weight')}
            />
            <GoalBar
              label="Workouts this week"
              readout={`${stats.sessions} of ${goals.workoutsPerWeek}`}
              pct={stats.workoutPct}
              fill={theme.colors.text}
              onPress={() => router.push('/workouts')}
            />
            <GoalBar
              label="Active minutes this week"
              readout={`${stats.minutes} of ${goals.minutesPerWeek}`}
              pct={stats.minutesPct}
              fill={theme.colors.accent}
              onPress={() => router.push('/workouts')}
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
      </ScrollView>
    </View>
  );
}

function RuleTop() {
  return <View style={{ height: 1, backgroundColor: theme.colors.borderLight }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  titleBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 40, letterSpacing: -1.2, textTransform: 'uppercase', color: theme.colors.text, marginTop: spacing.xs },
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
  logBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  emptyLog: { fontSize: 13, lineHeight: 19, color: theme.colors.textMuted, paddingVertical: 22 },
});
