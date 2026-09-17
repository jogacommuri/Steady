import { StyleSheet, Text, View } from 'react-native';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';
import type { LogEntry } from '@/lib/insights';

import { RuleLight } from './ui';

function toneColor(tone: LogEntry['tone']): string {
  if (tone === 'accent') return theme.colors.accent;
  if (tone === 'ink') return theme.colors.text;
  return theme.colors.textMuted;
}

/** A chronological day log — used on Today (today only) and Day detail (any day). */
export function LogList({ entries }: { entries: LogEntry[] }) {
  return (
    <View>
      {entries.map((e, i) => (
        <View key={e.id}>
          <View style={styles.row}>
            <Text style={[weight('medium'), styles.time]}>{e.time}</Text>
            <View style={[styles.bar, { backgroundColor: toneColor(e.tone) }]} />
            <View style={styles.body}>
              <Text style={[weight('semibold'), styles.kind, { color: toneColor(e.tone) }]}>{e.kind}</Text>
              <Text style={[weight('medium'), styles.text]}>{e.text}</Text>
            </View>
          </View>
          {i < entries.length - 1 ? <RuleLight /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: 13, alignItems: 'baseline' },
  time: { width: 44, fontSize: 11, color: theme.colors.textFaint, letterSpacing: 0.3 },
  bar: { width: 3, alignSelf: 'stretch' },
  body: { flex: 1, gap: 5 },
  kind: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  text: { fontSize: 14, lineHeight: 19, color: theme.colors.text },
});
