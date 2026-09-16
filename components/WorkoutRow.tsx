import { StyleSheet, Text, View } from 'react-native';

import { formatDay } from '@/lib/dates';
import type { Workout } from '@/lib/types';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { Card, DeleteButton } from './ui';

export function WorkoutRow({
  workout,
  onDelete,
}: {
  workout: Workout;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.type, { color: colors.plum }]}>
            {workout.workoutType}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {formatDay(workout.date)}
            {workout.duration ? ` · ${workout.duration} min` : ''}
          </Text>
        </View>
        {workout.text ? (
          <Text style={[styles.text, { color: colors.text }]}>
            {workout.text}
          </Text>
        ) : null}
      </View>
      <DeleteButton onPress={() => onDelete(workout.id)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  body: { flex: 1, gap: spacing.xs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  type: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  meta: { fontSize: 12 },
  text: { fontSize: 15, lineHeight: 20 },
});
