import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField } from '@/components/DateField';
import { DetailHeader } from '@/components/DetailHeader';
import { EntryForm, Field, TextField } from '@/components/EntryForm';
import { OptionChips, SegmentedRow } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { useMeals } from '@/hooks/useMeals';
import { useSteps } from '@/hooks/useSteps';
import { useWeights } from '@/hooks/useWeights';
import { useWorkouts } from '@/hooks/useWorkouts';
import { nowTime, today } from '@/lib/dates';
import { showToast } from '@/lib/toastBus';
import { MEAL_TYPES, WORKOUT_TYPES, type MealType, type WorkoutType } from '@/lib/types';
import { displayToKg } from '@/lib/units';
import { spacing, theme } from '@/theme/colors';

type Kind = 'meal' | 'weight' | 'workout' | 'steps';
const KINDS: Kind[] = ['meal', 'weight', 'workout', 'steps'];

export default function AddScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kind?: Kind }>();

  const { addMeal } = useMeals();
  const { addWeight } = useWeights();
  const { addWorkout } = useWorkouts();
  const { setSteps } = useSteps();
  const { goals } = useGoals();
  const unit = goals.weightUnit;

  const [kind, setKind] = useState<Kind>(params.kind && KINDS.includes(params.kind) ? params.kind : 'meal');
  const [date, setDate] = useState(today());
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [text, setText] = useState('');
  const [calories, setCalories] = useState('');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [workoutType, setWorkoutType] = useState<WorkoutType>('cardio');
  const [duration, setDuration] = useState('');
  const [stepsCount, setStepsCount] = useState('');

  const parsedWeight = Number.parseFloat(value.replace(',', '.'));
  const weightValid = Number.isFinite(parsedWeight) && parsedWeight > 0;
  const parsedDuration = Number.parseInt(duration, 10);
  const durationValue = Number.isFinite(parsedDuration) ? parsedDuration : 0;
  const parsedSteps = Number.parseInt(stepsCount, 10);
  const stepsValid = Number.isFinite(parsedSteps) && parsedSteps > 0;

  const disabled =
    kind === 'meal'
      ? !text.trim()
      : kind === 'weight'
        ? !weightValid
        : kind === 'steps'
          ? !stepsValid
          : durationValue <= 0 && !text.trim();

  const submit = async () => {
    if (kind === 'meal') {
      if (!text.trim()) return;
      const parsedCalories = Number.parseFloat(calories);
      await addMeal({
        date,
        mealType,
        time: nowTime(),
        text,
        calories: Number.isFinite(parsedCalories) && parsedCalories > 0 ? Math.round(parsedCalories) : null,
      });
      showToast('Meal logged');
      router.replace('/meals');
    } else if (kind === 'weight') {
      if (!weightValid) return;
      await addWeight({ date, value: displayToKg(parsedWeight, unit), note });
      showToast('Weigh-in saved');
      router.replace('/weight');
    } else if (kind === 'steps') {
      if (!stepsValid) return;
      await setSteps(date, parsedSteps);
      showToast('Steps logged');
      router.replace('/workouts');
    } else {
      await addWorkout({ date, workoutType, duration: durationValue, text });
      showToast('Workout logged');
      router.replace('/workouts');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'android' ? 'height' : undefined}
    >
      <DetailHeader title="Log entry" backLabel="Cancel" onBack={() => router.back()} />
      <SegmentedRow options={KINDS} value={kind} onChange={setKind} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <View style={{ marginBottom: spacing.lg }}>
          <DateField value={date} onChange={setDate} />
        </View>

        {kind === 'meal' ? (
          <EntryForm
            onSubmit={submit}
            disabled={disabled}
            footnote={
              goals.autoCalories && !calories.trim()
                ? 'Saved to the on-device database first. No calories entered — an estimate will fill in shortly if one can be found.'
                : 'Saved to the on-device database first — it works with no connection.'
            }
          >
            <Field label="Meal">
              <OptionChips options={MEAL_TYPES} value={mealType} onChange={setMealType} />
            </Field>
            <Field label="What did you eat?">
              <TextField value={text} onChangeText={setText} placeholder="e.g. oats, berries, coffee" />
            </Field>
            <Field label="Calories (optional)">
              <TextField value={calories} onChangeText={setCalories} placeholder="e.g. 420" keyboardType="number-pad" />
            </Field>
          </EntryForm>
        ) : null}

        {kind === 'weight' ? (
          <EntryForm
            onSubmit={submit}
            disabled={disabled}
            footnote="Saved to the on-device database first — it works with no connection."
          >
            <Field label={`Weight (${unit})`}>
              <TextField
                value={value}
                onChangeText={setValue}
                placeholder={unit === 'kg' ? 'e.g. 75.4' : 'e.g. 166.4'}
                keyboardType="decimal-pad"
                big
              />
            </Field>
            <Field label="Note (optional)">
              <TextField value={note} onChangeText={setNote} placeholder="e.g. morning, after run" />
            </Field>
          </EntryForm>
        ) : null}

        {kind === 'workout' ? (
          <EntryForm
            onSubmit={submit}
            disabled={disabled}
            footnote="Saved to the on-device database first — it works with no connection."
          >
            <Field label="Type">
              <OptionChips options={WORKOUT_TYPES} value={workoutType} onChange={setWorkoutType} />
            </Field>
            <Field label="Duration (min)">
              <TextField value={duration} onChangeText={setDuration} placeholder="e.g. 30" keyboardType="number-pad" big />
            </Field>
            <Field label="Notes (optional)">
              <TextField value={text} onChangeText={setText} placeholder="e.g. 5k easy pace" />
            </Field>
          </EntryForm>
        ) : null}

        {kind === 'steps' ? (
          <EntryForm
            onSubmit={submit}
            disabled={disabled}
            footnote="One total per day — logging again for the same date updates it instead of adding a duplicate."
          >
            <Field label="Steps">
              <TextField
                value={stepsCount}
                onChangeText={setStepsCount}
                placeholder="e.g. 8500"
                keyboardType="number-pad"
                big
              />
            </Field>
          </EntryForm>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
