import { StyleSheet, Text, View } from 'react-native';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';
import { formatDay } from '@/lib/dates';
import type { Workout } from '@/lib/types';

import { DeleteButton, RuleLight } from './ui';

export function WorkoutRow({ workout, onDelete }: { workout: Workout; onDelete: (id: string) => void }) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.metaCol}>
          <Text style={[weight('semibold'), styles.type]}>{workout.workoutType}</Text>
          <Text style={[weight('medium'), styles.meta]}>
            {formatDay(workout.date)}
            {workout.duration ? ` · ${workout.duration} min` : ''}
          </Text>
        </View>
        <Text style={[weight('medium'), styles.text]}>{workout.text}</Text>
        <DeleteButton onPress={() => onDelete(workout.id)} />
      </View>
      <RuleLight />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: 14, alignItems: 'flex-start' },
  metaCol: { width: 74 },
  type: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: theme.colors.accentText },
  meta: { fontSize: 11, color: theme.colors.textFaint, marginTop: 6 },
  text: { flex: 1, fontSize: 14, lineHeight: 19, color: theme.colors.text },
});
