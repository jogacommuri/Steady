import { StyleSheet, Text, View } from 'react-native';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';
import { formatDay } from '@/lib/dates';
import type { Weight, WeightUnit } from '@/lib/types';
import { formatWeight, kgToDisplay } from '@/lib/units';

import { DeleteButton, RuleLight } from './ui';

export function WeightRow({
  weightEntry,
  delta,
  unit,
  onDelete,
}: {
  weightEntry: Weight;
  /** Change vs. the next-older entry (kg), if any. */
  delta?: number | null;
  unit: WeightUnit;
  onDelete: (id: string) => void;
}) {
  const deltaDisplay = delta == null ? null : kgToDisplay(delta, unit);
  const deltaLabel =
    deltaDisplay == null || Math.abs(delta ?? 0) < 0.05
      ? '—'
      : `${deltaDisplay > 0 ? '+' : ''}${deltaDisplay.toFixed(1)}`;
  const deltaColor = delta != null && delta < 0 ? theme.colors.accentText : theme.colors.textMuted;

  return (
    <View>
      <View style={styles.row}>
        <Text style={[weight('bold'), styles.value]}>{formatWeight(weightEntry.value, unit)}</Text>
        <Text style={[weight('semibold'), styles.delta, { color: deltaColor }]}>{deltaLabel}</Text>
        <Text style={[weight('medium'), styles.meta]}>
          {formatDay(weightEntry.date)}
          {weightEntry.note ? ` · ${weightEntry.note}` : ''}
        </Text>
        <DeleteButton onPress={() => onDelete(weightEntry.id)} />
      </View>
      <RuleLight />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: 14, alignItems: 'baseline' },
  value: { fontSize: 20, letterSpacing: -0.4, width: 74, color: theme.colors.text },
  delta: { fontSize: 12, width: 48 },
  meta: { flex: 1, fontSize: 12, color: theme.colors.textMuted },
});
