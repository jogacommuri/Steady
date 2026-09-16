import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { radius, spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { Card } from './ui';

/**
 * Shared building blocks for the "add entry" cards on each tab. The screens
 * compose these primitives; keeping them here matches the planned EntryForm.tsx
 * and keeps field styling consistent across trackers.
 */

export function EntryForm({
  accent,
  children,
  onSubmit,
  submitLabel = 'Add',
  disabled,
}: {
  accent: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
}) {
  return (
    <Card style={{ gap: spacing.md }}>
      {children}
      <PrimaryButton
        label={submitLabel}
        accent={accent}
        onPress={onSubmit}
        disabled={disabled}
      />
    </Card>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[
        styles.input,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
          color: colors.text,
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        },
      ]}
    />
  );
}

export function PrimaryButton({
  label,
  accent,
  onPress,
  disabled,
}: {
  label: string;
  accent: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: accent,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonLabel, { color: colors.textInverse }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  button: {
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
});
