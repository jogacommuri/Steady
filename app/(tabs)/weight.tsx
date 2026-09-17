import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryForm, Field, TextField } from '@/components/EntryForm';
import { WeightRow } from '@/components/WeightRow';
import { EmptyState } from '@/components/ui';
import { useWeights } from '@/hooks/useWeights';
import { today } from '@/lib/dates';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export default function WeightScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { weights, addWeight, removeWeight } = useWeights();

  const [value, setValue] = useState('');
  const [note, setNote] = useState('');

  const parsed = Number.parseFloat(value.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0;

  const submit = async () => {
    if (!valid) return;
    await addWeight({ date: today(), value: parsed, note });
    setValue('');
    setNote('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={weights}
        keyExtractor={(w) => w.id}
        renderItem={({ item, index }) => (
          <WeightRow
            weight={item}
            delta={
              index < weights.length - 1
                ? item.value - weights[index + 1].value
                : null
            }
            onDelete={removeWeight}
          />
        )}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.md,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            <EntryForm accent={colors.clay} onSubmit={submit} disabled={!valid}>
              <Field label="Weight (kg)">
                <TextField
                  value={value}
                  onChangeText={setValue}
                  placeholder="e.g. 72.4"
                  keyboardType="decimal-pad"
                />
              </Field>
              <Field label="Note (optional)">
                <TextField
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. morning, after run"
                />
              </Field>
            </EntryForm>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No weigh-ins yet"
            subtitle="Log a weight above to start tracking your trend."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
