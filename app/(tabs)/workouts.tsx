import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { StepRow } from '@/components/StepRow';
import { WorkoutRow } from '@/components/WorkoutRow';
import { EmptyState, Kicker, Rule } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { useSteps } from '@/hooks/useSteps';
import { useWorkouts } from '@/hooks/useWorkouts';
import { today } from '@/lib/dates';
import { last5WeekTotals, weekAvgSteps, weekMinutes, weekWorkoutCount } from '@/lib/insights';
import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const { workouts, removeWorkout } = useWorkouts();
  const { steps, removeSteps } = useSteps();
  const { goals } = useGoals();
  const todayStr = today();

  const sessions = weekWorkoutCount(workouts, todayStr);
  const minutes = weekMinutes(workouts, todayStr);
  const bars = useMemo(() => last5WeekTotals(workouts, todayStr), [workouts, todayStr]);
  const maxWeek = Math.max(...bars.map((b) => b.minutes), goals.minutesPerWeek, 1);
  const avgSteps = weekAvgSteps(steps, todayStr);

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.titleBlock}>
          <Text style={[weight('bold'), styles.title]}>Workouts</Text>
          <Text style={[weight('medium'), styles.subtitle]}>
            {sessions} sessions · {minutes} min this week
          </Text>
        </View>
        <Rule />

        <View style={styles.barsSection}>
          <Kicker size={9.5}>Minutes by week</Kicker>
          <View style={styles.barsRow}>
            {bars.map((b, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={[weight('semibold'), styles.barValue]}>{b.minutes}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.round((b.minutes / maxWeek) * 100)}%`,
                      backgroundColor: b.isCurrent ? theme.colors.accent : theme.colors.text,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.labelsRow}>
            {bars.map((b, i) => (
              <Text key={i} style={[weight('medium'), styles.barLabel]}>
                {b.label}
              </Text>
            ))}
          </View>
        </View>
        <Rule />

        <View style={styles.stepsSection}>
          <Kicker size={9.5}>Steps</Kicker>
          <Text style={[weight('medium'), styles.subtitle, { marginTop: spacing.xs }]}>
            {avgSteps != null ? `${avgSteps.toLocaleString()} avg/day this week` : 'No steps logged this week'}
          </Text>
        </View>
        {steps.length > 0 ? (
          <View style={styles.list}>
            {steps.slice(0, 7).map((s) => (
              <StepRow key={s.id} steps={s} onDelete={removeSteps} />
            ))}
          </View>
        ) : null}
        <Rule />

        {workouts.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <EmptyState title="No workouts logged yet" subtitle="Log one from the + button below." />
          </View>
        ) : (
          <View style={styles.list}>
            {workouts.slice(0, 16).map((w) => (
              <WorkoutRow key={w.id} workout={w} onDelete={removeWorkout} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  titleBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 32, letterSpacing: -0.9, textTransform: 'uppercase', color: theme.colors.text },
  subtitle: { fontSize: 12, color: theme.colors.textMuted, marginTop: spacing.xs },
  barsSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  stepsSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 96, marginTop: spacing.md, borderBottomWidth: 2, borderBottomColor: theme.colors.border },
  labelsRow: { flexDirection: 'row', gap: 10, marginTop: 7 },
  barCol: { flex: 1, alignItems: 'center' },
  barValue: { fontSize: 10, color: theme.colors.textMuted, marginBottom: 5 },
  bar: { width: '100%' },
  barLabel: { flex: 1, fontSize: 9.5, letterSpacing: 0.4, textTransform: 'uppercase', color: theme.colors.textFaint },
  list: { paddingHorizontal: spacing.lg },
});
