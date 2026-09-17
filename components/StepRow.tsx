import { StyleSheet, Text, View } from 'react-native';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';
import { formatDay } from '@/lib/dates';
import type { Steps } from '@/lib/types';

import { DeleteButton, RuleLight } from './ui';

export function StepRow({ steps, onDelete }: { steps: Steps; onDelete: (id: string) => void }) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.metaCol}>
          <Text style={[weight('semibold'), styles.type]}>Steps</Text>
          <Text style={[weight('medium'), styles.meta]}>{formatDay(steps.date)}</Text>
        </View>
        <Text style={[weight('medium'), styles.text]}>{steps.count.toLocaleString()}</Text>
        <DeleteButton onPress={() => onDelete(steps.id)} />
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
