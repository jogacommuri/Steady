import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { WeightChart } from '@/components/WeightChart';
import { WeightRow } from '@/components/WeightRow';
import { EmptyState, Kicker, Rule } from '@/components/ui';
import { useGoals } from '@/hooks/useGoals';
import { useWeights } from '@/hooks/useWeights';
import { today } from '@/lib/dates';
import { weightTrend } from '@/lib/insights';
import type { WeightUnit } from '@/lib/types';
import { formatWeight, kgToDisplay } from '@/lib/units';
import { spacing, theme } from '@/theme/colors';
import { weight as fontWeight } from '@/theme/typography';

export default function WeightScreen() {
  const insets = useSafeAreaInsets();
  const { weights, removeWeight } = useWeights();
  const { goals, saveGoals } = useGoals();
  const todayStr = today();
  const unit = goals.weightUnit;

  const trend = useMemo(() => weightTrend(weights, todayStr, 21), [weights, todayStr]);
  const trendDisplay = useMemo(
    () => trend.map((p) => ({ ...p, value: kgToDisplay(p.value, unit) })),
    [trend, unit]
  );
  const latest = weights[0]?.value;
  const weekAgo = weights.find((w) => Date.parse(w.date) <= Date.parse(todayStr) - 6 * 86_400_000);
  const delta = latest != null && weekAgo ? latest - weekAgo.value : null;
  const deltaDisplay = delta != null ? kgToDisplay(delta, unit) : null;

  const setUnit = (next: WeightUnit) => saveGoals({ ...goals, weightUnit: next });

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.titleBlock}>
          <Text style={[fontWeight('bold'), styles.title]}>Weight</Text>
          <View style={styles.currentRow}>
            <Text style={[fontWeight('bold'), styles.value]}>
              {latest != null ? formatWeight(latest, unit) : '—'}
            </Text>
            <UnitToggle value={unit} onChange={setUnit} />
            {deltaDisplay != null ? (
              <Text style={[fontWeight('semibold'), styles.delta]}>
                {deltaDisplay > 0 ? '+' : ''}
                {deltaDisplay.toFixed(1)} / 7d
              </Text>
            ) : null}
          </View>
        </View>
        <Rule />

        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Kicker size={9.5}>21-day trend</Kicker>
            <Kicker size={9.5}>
              Goal {formatWeight(goals.targetWeight, unit)} {unit}
            </Kicker>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <WeightChart points={trendDisplay} goal={kgToDisplay(goals.targetWeight, unit)} />
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
                  unit={unit}
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

function UnitToggle({ value, onChange }: { value: WeightUnit; onChange: (u: WeightUnit) => void }) {
  return (
    <View style={styles.unitToggle}>
      {(['kg', 'lb'] as const).map((u, i) => {
        const on = u === value;
        return (
          <Pressable
            key={u}
            onPress={() => onChange(u)}
            style={[
              styles.unitOption,
              i === 0 && styles.unitOptionDivider,
              { backgroundColor: on ? theme.colors.text : 'transparent' },
            ]}
          >
            <Text
              style={[
                fontWeight('semibold'),
                styles.unitOptionLabel,
                { color: on ? theme.colors.textInverse : theme.colors.text },
              ]}
            >
              {u}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  titleBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 32, letterSpacing: -0.9, textTransform: 'uppercase', color: theme.colors.text },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  value: { fontSize: 54, letterSpacing: -1.5, color: theme.colors.text },
  unitToggle: { flexDirection: 'row', borderWidth: 2, borderColor: theme.colors.text },
  unitOption: { paddingHorizontal: 10, paddingVertical: 6, minWidth: 38, alignItems: 'center' },
  unitOptionDivider: { borderRightWidth: 2, borderRightColor: theme.colors.text },
  unitOptionLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  delta: { fontSize: 13, letterSpacing: 0.3, color: theme.colors.accentText, marginLeft: 'auto' },
  chartSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  list: { paddingHorizontal: spacing.lg },
});
