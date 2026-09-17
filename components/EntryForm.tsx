import { type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

import { Kicker, PrimaryButton } from './ui';

/**
 * Shared building blocks for the Log entry / Goals / Account forms. Modernist
 * has no floating card for forms — sections stack flush, divided by rules —
 * so this is a plain vertical layout, not a bordered container.
 */

export function EntryForm({
  children,
  onSubmit,
  submitLabel = 'Add entry',
  disabled,
  footnote,
}: {
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
  footnote?: string;
}) {
  return (
    <View style={{ gap: spacing.lg }}>
      {children}
      <View style={{ gap: spacing.md }}>
        <PrimaryButton label={submitLabel} onPress={onSubmit} disabled={disabled} />
        {footnote ? <Text style={[weight('medium'), styles.footnote]}>{footnote}</Text> : null}
      </View>
    </View>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.xs + 2 }}>
      <Kicker size={10}>{label}</Kicker>
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
  big,
  letterSpaced,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  /** Large numeric-style entry (weight value, duration). */
  big?: boolean;
  /** Spaced-out digits, for the 6-digit code field. */
  letterSpaced?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textFaint}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[
        weight(big ? 'semibold' : 'medium'),
        styles.input,
        big && styles.inputBig,
        multiline && styles.inputMultiline,
        letterSpaced && { letterSpacing: 4 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 2,
    borderColor: theme.colors.text,
    backgroundColor: '#fff',
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 13,
    minHeight: 48,
    fontSize: 15,
  },
  inputBig: { fontSize: 22, minHeight: 56 },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  footnote: { fontSize: 11.5, lineHeight: 16, color: theme.colors.textFaint },
});
