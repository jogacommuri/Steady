import { StyleSheet, Text, View } from 'react-native';
import { Circle, Line, Polyline, Svg } from 'react-native-svg';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';
import type { WeightPoint } from '@/lib/insights';

const W = 330;
const H = 132;
const BASE_Y = 131;
const TOP_Y = 118;
const PLOT_H = 104;

/** The 21-day trend line + dashed goal rule + current-weight dot. */
export function WeightChart({ points, goal }: { points: WeightPoint[]; goal: number }) {
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals, goal) - 0.4;
  const hi = Math.max(...vals, goal) + 0.4;
  const span = hi - lo || 1;

  const x = (i: number) => (points.length < 2 ? 0 : (i / (points.length - 1)) * W);
  const y = (v: number) => TOP_Y - ((v - lo) / span) * PLOT_H;
  const goalY = y(goal);
  const lineCoords = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const lastX = x(vals.length - 1);
  const lastY = vals.length ? y(vals[vals.length - 1]) : BASE_Y;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={0} y1={goalY} x2={W} y2={goalY} stroke={theme.colors.accent} strokeWidth={2} strokeDasharray="6 5" />
        <Line x1={0} y1={BASE_Y} x2={W} y2={BASE_Y} stroke={theme.colors.text} strokeWidth={2} />
        {vals.length > 0 ? (
          <Polyline
            points={lineCoords}
            fill="none"
            stroke={theme.colors.text}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ) : null}
        {vals.length > 0 ? <Circle cx={lastX} cy={lastY} r={4.5} fill={theme.colors.accent} /> : null}
      </Svg>
      <View style={styles.labels}>
        <Text style={[weight('medium'), styles.label]}>{points[0]?.label ?? ''}</Text>
        <Text style={[weight('medium'), styles.label]}>{points[points.length - 1]?.label ?? ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  label: { fontSize: 9.5, color: theme.colors.textFaint },
});
