import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryForm, Field, TextField } from '@/components/EntryForm';
import { WorkoutRow } from '@/components/WorkoutRow';
import { ChipGroup, EmptyState } from '@/components/ui';
import { useWorkouts } from '@/hooks/useWorkouts';
import { today } from '@/lib/dates';
import { WORKOUT_TYPES, type WorkoutType } from '@/lib/types';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export default function WorkoutsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { workouts, addWorkout, removeWorkout } = useWorkouts();

  const [workoutType, setWorkoutType] = useState<WorkoutType>('cardio');
  const [duration, setDuration] = useState('');
  const [text, setText] = useState('');

  const parsedDuration = Number.parseInt(duration, 10);
  const durationValue = Number.isFinite(parsedDuration) ? parsedDuration : 0;

  const submit = async () => {
    await addWorkout({
      date: today(),
      workoutType,
      duration: durationValue,
      text,
    });
    setDuration('');
    setText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={workouts}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => (
          <WorkoutRow workout={item} onDelete={removeWorkout} />
        )}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.md,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            <EntryForm
              accent={colors.plum}
              onSubmit={submit}
              disabled={durationValue <= 0 && !text.trim()}
            >
              <Field label="Type">
                <ChipGroup
                  options={WORKOUT_TYPES}
                  value={workoutType}
                  accent={colors.plum}
                  onChange={setWorkoutType}
                />
              </Field>
              <Field label="Duration (min)">
                <TextField
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="e.g. 30"
                  keyboardType="number-pad"
                />
              </Field>
              <Field label="Notes (optional)">
                <TextField
                  value={text}
                  onChangeText={setText}
                  placeholder="e.g. 5k easy pace"
                  multiline
                />
              </Field>
            </EntryForm>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No workouts logged yet"
            subtitle="Log a session above to build your streak."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
