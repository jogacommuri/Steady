import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.md,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  accent,
  onPress,
}: {
  label: string;
  selected: boolean;
  accent: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accent : colors.surfaceAlt,
          borderColor: selected ? accent : colors.border,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? colors.textInverse : colors.textMuted,
          fontWeight: selected ? '600' : '500',
          fontSize: 13,
          textTransform: 'capitalize',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  accent,
  onChange,
}: {
  options: readonly T[];
  value: T;
  accent: string;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Chip
          key={opt}
          label={opt}
          accent={accent}
          selected={opt === value}
          onPress={() => onChange(opt)}
        />
      ))}
    </View>
  );
}

export function DeleteButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable hitSlop={8} onPress={onPress} accessibilityLabel="Delete entry">
      <Text style={{ color: colors.danger, fontSize: 18, fontWeight: '600' }}>
        ×
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
