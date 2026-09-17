import { StyleSheet, Text, View } from 'react-native';

import { formatDay } from '@/lib/dates';
import type { Meal } from '@/lib/types';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { Card, DeleteButton } from './ui';

export function MealRow({
  meal,
  onDelete,
}: {
  meal: Meal;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.type, { color: colors.sage }]}>
            {meal.mealType}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {formatDay(meal.date)} · {meal.time}
          </Text>
        </View>
        {meal.text ? (
          <Text style={[styles.text, { color: colors.text }]}>{meal.text}</Text>
        ) : null}
      </View>
      <DeleteButton onPress={() => onDelete(meal.id)} />
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
  type: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  meta: { fontSize: 12 },
  text: { fontSize: 15, lineHeight: 20 },
});
