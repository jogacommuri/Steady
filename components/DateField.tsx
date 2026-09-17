import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDay, isoDate, parseDay, today } from '@/lib/dates';
import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

import { Field } from './EntryForm';

/** Date picker for Log entry — defaults to whatever `value` the screen seeds (today), lets you pick any past day. */
export function DateField({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const [open, setOpen] = useState(false);
  const label = value === today() ? 'Today' : formatDay(value);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Close on any pick (not just Android's dialog) — the iOS inline calendar
    // otherwise stays expanded, burying whatever's below it (and, combined
    // with the keyboard, the field you're trying to type into).
    setOpen(false);
    if (event.type === 'dismissed') return;
    if (selected) onChange(isoDate(selected));
  };

  return (
    <Field label="Date">
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.trigger}>
        <Text style={[weight('semibold'), styles.triggerLabel]}>{label}</Text>
        <Text style={[weight('semibold'), styles.triggerHint]}>{open ? 'Close' : 'Change'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.calendarWrap}>
          <DateTimePicker
            value={parseDay(value)}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
            themeVariant="light"
            accentColor={theme.colors.accent}
            onChange={handleChange}
          />
        </View>
      ) : null}
    </Field>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.text,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 13,
    minHeight: 48,
  },
  triggerLabel: { fontSize: 15, color: theme.colors.text },
  triggerHint: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: theme.colors.accentText },
  calendarWrap: {
    marginTop: spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.text,
    backgroundColor: '#fff',
    padding: 4,
  },
});
