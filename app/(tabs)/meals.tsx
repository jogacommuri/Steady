import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryForm, Field, TextField } from '@/components/EntryForm';
import { MealRow } from '@/components/MealRow';
import { ChipGroup, EmptyState } from '@/components/ui';
import { useMeals } from '@/hooks/useMeals';
import { nowTime, today } from '@/lib/dates';
import { MEAL_TYPES, type MealType } from '@/lib/types';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export default function MealsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { meals, addMeal, removeMeal } = useMeals();

  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [text, setText] = useState('');

  const submit = async () => {
    await addMeal({
      date: today(),
      mealType,
      time: nowTime(),
      text,
    });
    setText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={meals}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MealRow meal={item} onDelete={removeMeal} />
        )}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.md,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            <EntryForm accent={colors.sage} onSubmit={submit} disabled={!text.trim()}>
              <Field label="Meal">
                <ChipGroup
                  options={MEAL_TYPES}
                  value={mealType}
                  accent={colors.sage}
                  onChange={setMealType}
                />
              </Field>
              <Field label="What did you eat?">
                <TextField
                  value={text}
                  onChangeText={setText}
                  placeholder="e.g. oats, berries, coffee"
                  multiline
                />
              </Field>
            </EntryForm>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No meals logged yet"
            subtitle="Add your first meal above — it saves offline instantly."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
