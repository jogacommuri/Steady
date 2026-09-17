import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailHeader } from '@/components/DetailHeader';
import { GoalStepper } from '@/components/GoalStepper';
import { PrimaryButton } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { showToast } from '@/lib/toastBus';
import type { Goals } from '@/lib/types';
import { displayToKg, formatWeight, kgToDisplay } from '@/lib/units';
import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

type NumericGoalKey = 'targetWeight' | 'workoutsPerWeek' | 'minutesPerWeek' | 'mealsPerDay';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, +v.toFixed(1)));

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goals, saveGoals } = useGoals();
  const unit = goals.weightUnit;

  const bump = (key: NumericGoalKey, step: number, min: number, max: number) => () => {
    saveGoals({ ...goals, [key]: clamp(goals[key] + step, min, max) });
  };

  /** Target weight steps by a fixed amount in the *display* unit, converted back to kg for storage. */
  const bumpTargetWeight = (stepDisplay: number) => () => {
    const [min, max] = unit === 'kg' ? [40, 200] : [88, 440];
    const nextDisplay = clamp(kgToDisplay(goals.targetWeight, unit) + stepDisplay, min, max);
    saveGoals({ ...goals, targetWeight: displayToKg(nextDisplay, unit) });
  };

  const save = () => {
    showToast('Targets saved');
    router.back();
  };

  return (
    <View style={styles.container}>
      <DetailHeader title="Goals" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <Text style={[weight('medium'), styles.intro]}>
          Targets are stored on this device.
        </Text>

        <GoalStepper
          label="Target weight"
          hint={`In ${unit}, adjusted in 0.5 steps`}
          value={`${formatWeight(goals.targetWeight, unit)} ${unit}`}
          onDecrease={bumpTargetWeight(-0.5)}
          onIncrease={bumpTargetWeight(0.5)}
        />
        <GoalStepper
          label="Workouts per week"
          hint="Counts any logged session"
          value={`${goals.workoutsPerWeek} / week`}
          onDecrease={bump('workoutsPerWeek', -1, 0, 14)}
          onIncrease={bump('workoutsPerWeek', 1, 0, 14)}
        />
        <GoalStepper
          label="Active minutes per week"
          hint="Sum of session durations"
          value={`${goals.minutesPerWeek} min`}
          onDecrease={bump('minutesPerWeek', -15, 0, 900)}
          onIncrease={bump('minutesPerWeek', 15, 0, 900)}
        />
        <GoalStepper
          label="Meals logged per day"
          hint="Keeps the streak honest"
          value={`${goals.mealsPerDay} / day`}
          onDecrease={bump('mealsPerDay', -1, 1, 8)}
          onIncrease={bump('mealsPerDay', 1, 1, 8)}
        />

        <View style={styles.saveWrap}>
          <PrimaryButton label="Save targets" onPress={save} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  intro: { fontSize: 12, lineHeight: 18, color: theme.colors.textMuted, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  saveWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
});
