import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { neutralRamp, spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';
import type { DayFullness } from '@/lib/insights';

const GAP = 5;
const COLS = 7;

function toneColor(tone: DayFullness): string {
  if (tone === 'full') return theme.colors.text;
  if (tone === 'partial') return neutralRamp[400];
  return theme.colors.background;
}

/** The 35-day activity grid on Progress — 5 rows of 7, oldest first. */
export function ProgressGrid({ days }: { days: { tone: DayFullness; label: string }[] }) {
  const [width, setWidth] = useState(0);
  const cell = width ? (width - GAP * (COLS - 1)) / COLS : 0;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View>
      <View onLayout={onLayout} style={styles.grid}>
        {days.map((d, i) => (
          <View
            key={i}
            accessibilityLabel={d.label}
            style={[
              styles.cell,
              {
                width: cell,
                height: cell,
                backgroundColor: toneColor(d.tone),
                borderColor: d.tone === 'none' ? theme.colors.borderLight : 'transparent',
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        <LegendItem swatch={theme.colors.text} label="Full day" />
        <LegendItem swatch={neutralRamp[400]} label="Partial" />
        <LegendItem swatch={theme.colors.background} bordered label="None" />
      </View>
    </View>
  );
}

function LegendItem({ swatch, label, bordered }: { swatch: string; label: string; bordered?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          { backgroundColor: swatch, borderColor: bordered ? theme.colors.borderLight : 'transparent' },
        ]}
      />
      <Text style={[weight('medium'), styles.legendLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  cell: { borderWidth: 1 },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, alignItems: 'center', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 11, height: 11, borderWidth: 1 },
  legendLabel: { fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', color: theme.colors.textFaint },
});
