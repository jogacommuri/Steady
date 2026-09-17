import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

/** A strong 2px structural rule — the system's main section divider. */
export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.rule, style]} />;
}

/** A 1px row rule, for lists within a section. */
export function RuleLight({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.ruleLight, style]} />;
}

/** Small uppercase label — kickers, meta, section headers. */
export function Kicker({
  children,
  size = 10,
  color = theme.colors.textMuted,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Text
      style={[
        weight('medium'),
        { fontSize: size, letterSpacing: 0.14 * size, color, textTransform: 'uppercase' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[weight('medium'), styles.emptyTitle]}>{title}</Text>
      {subtitle ? <Text style={[weight('medium'), styles.emptySubtitle]}>{subtitle}</Text> : null}
    </View>
  );
}

export function DeleteButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable hitSlop={10} onPress={onPress} accessibilityLabel="Delete entry" style={styles.deleteBtn}>
      <Text style={[weight('semibold'), styles.deleteGlyph]}>×</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        { opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[weight('semibold'), styles.primaryBtnLabel]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryBtn,
        { opacity: disabled ? 0.45 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Text style={[weight('semibold'), styles.secondaryBtnLabel]}>{label}</Text>
    </Pressable>
  );
}

/** A labelled progress bar — Today's Goals rows, doubling as each metric's "current reading" (no separate stat cell). */
export function GoalBar({
  label,
  readout,
  pct,
  fill = theme.colors.text,
  onPress,
}: {
  label: string;
  readout: string;
  pct: number;
  fill?: string;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper style={{ gap: spacing.xs + 3 }} onPress={onPress}>
      <View style={styles.goalHeader}>
        <Text style={[weight('semibold'), styles.goalLabel]}>{label}</Text>
        <Text style={[weight('medium'), styles.goalReadout]}>{readout}</Text>
      </View>
      <View style={styles.goalTrack}>
        <View style={[styles.goalFill, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: fill }]} />
      </View>
    </Wrapper>
  );
}

/** A full-bleed row of equal-width segments (meal filter bar, log-entry kind tabs). */
export function SegmentedRow<T extends string>({
  options,
  value,
  onChange,
  labelOf = (v) => v,
  scroll,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelOf?: (v: T) => string;
  /** Segments size to content and can overflow, rather than splitting the width evenly. */
  scroll?: boolean;
}) {
  return (
    <View style={styles.segmentRow}>
      {options.map((opt) => {
        const on = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.segmentItem,
              scroll ? { flex: undefined } : { flex: 1 },
              { backgroundColor: on ? theme.colors.text : 'transparent' },
            ]}
          >
            <Text
              style={[
                weight('semibold'),
                styles.segmentLabel,
                { color: on ? theme.colors.textInverse : theme.colors.text },
              ]}
            >
              {labelOf(opt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bordered pill picker — meal type / workout type in the Log entry form. */
export function OptionChips<T extends string>({
  options,
  value,
  onChange,
  labelOf = (v) => v,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelOf?: (v: T) => string;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((opt) => {
        const on = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, { backgroundColor: on ? theme.colors.text : 'transparent' }]}
          >
            <Text
              style={[
                weight('semibold'),
                styles.chipLabel,
                { color: on ? theme.colors.textInverse : theme.colors.text },
              ]}
            >
              {labelOf(opt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { height: 2, backgroundColor: theme.colors.border, width: '100%' },
  ruleLight: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.borderLight, width: '100%' },
  empty: { alignItems: 'flex-start', paddingVertical: spacing.xxl, gap: spacing.xs },
  emptyTitle: { fontSize: 15, color: theme.colors.text },
  emptySubtitle: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 18 },
  deleteBtn: { paddingHorizontal: 2, paddingVertical: 4 },
  deleteGlyph: { fontSize: 18, color: theme.colors.accentText },
  primaryBtn: {
    backgroundColor: theme.colors.accent,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  primaryBtnLabel: {
    color: theme.colors.textInverse,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: theme.colors.text,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  secondaryBtnLabel: {
    color: theme.colors.text,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  goalLabel: { fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: theme.colors.text },
  goalReadout: { fontSize: 12, color: theme.colors.textMuted },
  goalTrack: { height: 10, borderWidth: 2, borderColor: theme.colors.text },
  goalFill: { height: '100%' },
  segmentRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: theme.colors.border },
  segmentItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderLight,
    minHeight: 48,
    justifyContent: 'center',
  },
  segmentLabel: { fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 2,
    borderColor: theme.colors.text,
    paddingHorizontal: 13,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipLabel: { fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
});
