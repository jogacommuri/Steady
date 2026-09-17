import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailHeader } from '@/components/DetailHeader';
import { GoalStepper } from '@/components/GoalStepper';
import { PrimaryButton, RuleLight } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { isNutritionApiConfigured } from '@/lib/nutrition';
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

        <View style={styles.toggleSection}>
          <Text style={[weight('semibold'), styles.toggleLabel]}>Estimate calories automatically</Text>
          <Text style={[weight('medium'), styles.toggleHint]}>
            {isNutritionApiConfigured
              ? 'When you log a meal with no calories entered, its text is sent to OpenAI (via a Supabase function — no key in the app) to estimate one. Type a value yourself on any entry to skip that lookup.'
              : 'Needs Supabase configured, with the estimate-calories function deployed (see docs/supabase-setup.md), before this can turn on.'}
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <OnOffToggle
              value={goals.autoCalories}
              disabled={!isNutritionApiConfigured}
              onChange={(v) => saveGoals({ ...goals, autoCalories: v })}
            />
          </View>
        </View>
        <RuleLight />

        <View style={styles.saveWrap}>
          <PrimaryButton label="Save targets" onPress={save} />
        </View>
      </ScrollView>
    </View>
  );
}

function OnOffToggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.toggle, disabled && { opacity: 0.4 }]}>
      {([false, true] as const).map((v, i) => {
        const on = v === value;
        return (
          <Pressable
            key={String(v)}
            disabled={disabled}
            onPress={() => onChange(v)}
            style={[
              styles.toggleOption,
              i === 0 && styles.toggleOptionDivider,
              { backgroundColor: on ? theme.colors.text : 'transparent' },
            ]}
          >
            <Text
              style={[
                weight('semibold'),
                styles.toggleOptionLabel,
                { color: on ? theme.colors.textInverse : theme.colors.text },
              ]}
            >
              {v ? 'On' : 'Off'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  intro: { fontSize: 12, lineHeight: 18, color: theme.colors.textMuted, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  toggleSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: 5 },
  toggleLabel: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.colors.text },
  toggleHint: { fontSize: 11, lineHeight: 16, color: theme.colors.textMuted },
  toggle: { flexDirection: 'row', borderWidth: 2, borderColor: theme.colors.text, alignSelf: 'flex-start' },
  toggleOption: { paddingHorizontal: 14, paddingVertical: 8, minWidth: 52, alignItems: 'center' },
  toggleOptionDivider: { borderRightWidth: 2, borderRightColor: theme.colors.text },
  toggleOptionLabel: { fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  saveWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
});
