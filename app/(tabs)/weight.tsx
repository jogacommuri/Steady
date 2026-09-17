import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { WeightChart } from '@/components/WeightChart';
import { WeightRow } from '@/components/WeightRow';
import { EmptyState, Kicker, Rule } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { useWeights } from '@/hooks/useWeights';
import { today } from '@/lib/dates';
import { weightTrend } from '@/lib/insights';
import { spacing, theme } from '@/theme/colors';
import { weight as fontWeight } from '@/theme/typography';

export default function WeightScreen() {
  const insets = useSafeAreaInsets();
  const { weights, removeWeight } = useWeights();
  const { goals } = useGoals();
  const todayStr = today();

  const trend = useMemo(() => weightTrend(weights, todayStr, 21), [weights, todayStr]);
  const latest = weights[0]?.value;
  const weekAgo = weights.find((w) => Date.parse(w.date) <= Date.parse(todayStr) - 6 * 86_400_000);
  const delta = latest != null && weekAgo ? latest - weekAgo.value : null;

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.titleBlock}>
          <Text style={[fontWeight('bold'), styles.title]}>Weight</Text>
          <View style={styles.currentRow}>
            <Text style={[fontWeight('bold'), styles.value]}>{latest != null ? latest.toFixed(1) : '—'}</Text>
            <Text style={[fontWeight('semibold'), styles.unit]}>kg</Text>
            {delta != null ? (
              <Text style={[fontWeight('semibold'), styles.delta]}>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)} / 7d
              </Text>
            ) : null}
          </View>
        </View>
        <Rule />

        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Kicker size={9.5}>21-day trend</Kicker>
            <Kicker size={9.5}>Goal {goals.targetWeight.toFixed(1)} kg</Kicker>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <WeightChart points={trend} goal={goals.targetWeight} />
          </View>
        </View>
        <Rule />

        {weights.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <EmptyState title="No weigh-ins yet" subtitle="Log one from the + button below." />
          </View>
        ) : (
          <View style={styles.list}>
            {weights.slice(0, 14).map((w, i) => {
              const next = weights[i + 1];
              return (
                <WeightRow
                  key={w.id}
                  weightEntry={w}
                  delta={next ? w.value - next.value : null}
                  onDelete={removeWeight}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  titleBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 32, letterSpacing: -0.9, textTransform: 'uppercase', color: theme.colors.text },
  currentRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md, marginTop: spacing.md },
  value: { fontSize: 54, letterSpacing: -1.5, color: theme.colors.text },
  unit: { fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', color: theme.colors.textMuted },
  delta: { fontSize: 13, letterSpacing: 0.3, color: theme.colors.accentText, marginLeft: 'auto' },
  chartSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  list: { paddingHorizontal: spacing.lg },
});
