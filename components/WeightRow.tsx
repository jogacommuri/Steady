import { StyleSheet, Text, View } from 'react-native';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';
import { formatDay } from '@/lib/dates';
import type { Weight } from '@/lib/types';

import { DeleteButton, RuleLight } from './ui';

export function WeightRow({
  weightEntry,
  delta,
  onDelete,
}: {
  weightEntry: Weight;
  /** Change vs. the next-older entry, if any. */
  delta?: number | null;
  onDelete: (id: string) => void;
}) {
  const deltaLabel = delta == null || Math.abs(delta) < 0.05 ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`;
  const deltaColor = delta != null && delta < 0 ? theme.colors.accentText : theme.colors.textMuted;

  return (
    <View>
      <View style={styles.row}>
        <Text style={[weight('bold'), styles.value]}>{weightEntry.value.toFixed(1)}</Text>
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
