import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailHeader } from '@/components/DetailHeader';
import { GoalStepper } from '@/components/GoalStepper';
import { PrimaryButton } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { showToast } from '@/lib/toastBus';
import type { Goals } from '@/lib/types';
import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, +v.toFixed(1)));

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goals, saveGoals } = useGoals();

  const bump = (key: keyof Goals, step: number, min: number, max: number) => () => {
    saveGoals({ ...goals, [key]: clamp(goals[key] + step, min, max) });
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
          hint="In kg, adjusted in 0.5 steps"
          value={`${goals.targetWeight.toFixed(1)} kg`}
          onDecrease={bump('targetWeight', -0.5, 40, 200)}
          onIncrease={bump('targetWeight', 0.5, 40, 200)}
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
