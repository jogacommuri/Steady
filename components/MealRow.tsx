import { StyleSheet, Text, View } from 'react-native';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';
import { formatDay } from '@/lib/dates';
import type { Meal } from '@/lib/types';

import { DeleteButton, RuleLight } from './ui';

export function MealRow({ meal, onDelete }: { meal: Meal; onDelete: (id: string) => void }) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.timeCol}>
          <Text style={[weight('semibold'), styles.type]}>{meal.mealType}</Text>
          <Text style={[weight('medium'), styles.meta]}>{formatDay(meal.date)} · {meal.time}</Text>
        </View>
        <Text style={[weight('medium'), styles.text]}>{meal.text}</Text>
        <DeleteButton onPress={() => onDelete(meal.id)} />
      </View>
      <RuleLight />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: 14, alignItems: 'flex-start' },
  timeCol: { width: 60 },
  type: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: theme.colors.accentText },
  meta: { fontSize: 11, color: theme.colors.textFaint, marginTop: 6 },
  text: { flex: 1, fontSize: 14, lineHeight: 19, color: theme.colors.text },
});
