import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

import { RuleLight } from './ui';

export function GoalStepper({
  label,
  hint,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  hint: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View>
      <View style={styles.wrap}>
        <Text style={[weight('semibold'), styles.label]}>{label}</Text>
        <Text style={[weight('medium'), styles.hint]}>{hint}</Text>
        <View style={styles.row}>
          <Pressable onPress={onDecrease} accessibilityLabel="Decrease" style={styles.stepBtn}>
            <Text style={[weight('semibold'), styles.stepGlyph]}>−</Text>
          </Pressable>
          <Text style={[weight('bold'), styles.value]}>{value}</Text>
          <Pressable onPress={onIncrease} accessibilityLabel="Increase" style={styles.stepBtn}>
            <Text style={[weight('semibold'), styles.stepGlyph]}>+</Text>
          </Pressable>
        </View>
      </View>
      <RuleLight />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, gap: 5 },
  label: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.colors.text },
  hint: { fontSize: 11, lineHeight: 15, color: theme.colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  stepBtn: {
    borderWidth: 2,
    borderColor: theme.colors.text,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: { fontSize: 18, color: theme.colors.text },
  value: { fontSize: 26, letterSpacing: -0.5, minWidth: 96, color: theme.colors.text },
});
