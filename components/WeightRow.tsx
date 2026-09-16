import { StyleSheet, Text, View } from 'react-native';

import { formatDay } from '@/lib/dates';
import type { Weight } from '@/lib/types';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { Card, DeleteButton } from './ui';

export function WeightRow({
  weight,
  delta,
  onDelete,
}: {
  weight: Weight;
  /** Change vs. the next-older entry, if any. */
  delta?: number | null;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();
  const deltaColor =
    delta == null || delta === 0
      ? colors.textMuted
      : delta < 0
        ? colors.sage
        : colors.gold;
  const deltaLabel =
    delta == null || delta === 0
      ? null
      : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`;

  return (
    <Card style={styles.card}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.value, { color: colors.clay }]}>
            {weight.value.toFixed(1)}
            <Text style={[styles.unit, { color: colors.textMuted }]}> kg</Text>
          </Text>
          {deltaLabel ? (
            <Text style={[styles.delta, { color: deltaColor }]}>
              {deltaLabel}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {formatDay(weight.date)}
          {weight.note ? ` · ${weight.note}` : ''}
        </Text>
      </View>
      <DeleteButton onPress={() => onDelete(weight.id)} />
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
    gap: spacing.md,
  },
  value: { fontSize: 22, fontWeight: '700' },
  unit: { fontSize: 14, fontWeight: '500' },
  delta: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12 },
});
