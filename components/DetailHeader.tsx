import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

import { Rule } from './ui';

/** The back-button + large title header shared by Day detail, Goals, Progress and Log entry. */
export function DetailHeader({
  title,
  backLabel = 'Today',
  onBack,
}: {
  title: string;
  backLabel?: string;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={[weight('semibold'), styles.back]}>{`← ${backLabel}`}</Text>
        </Pressable>
        <Text style={[weight('bold'), styles.title]}>{title}</Text>
      </View>
      <Rule />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  back: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: theme.colors.accentText },
  title: { fontSize: 30, letterSpacing: -0.9, textTransform: 'uppercase', color: theme.colors.text, marginTop: spacing.md },
});
