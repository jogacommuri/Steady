import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';
import { useToast } from '@/lib/toastBus';

import { GearIcon } from './icons';
import { Rule } from './ui';

/**
 * The header every main tab screen shares: the STEADY wordmark, a Progress
 * button and the account/gear icon — plus the toast banner, which renders
 * directly under it when a screen (or the one just popped) flashed a message.
 */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <View style={[styles.row, { paddingTop: insets.top + 8 }]}>
        <Text style={[weight('bold'), styles.brand]}>Steady</Text>
        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/progress')} style={styles.progressBtn}>
            <Text style={[weight('semibold'), styles.progressLabel]}>Progress</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/account')}
            accessibilityLabel="Account and sync"
            style={styles.gearBtn}
          >
            <GearIcon size={16} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>
      <Rule />
      {toast ? (
        <View style={styles.toast}>
          <Text style={[weight('semibold'), styles.toastText]}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
  },
  brand: {
    fontSize: 19,
    letterSpacing: -0.4,
    textTransform: 'uppercase',
    color: theme.colors.text,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  progressBtn: {
    borderWidth: 2,
    borderColor: theme.colors.text,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minHeight: 32,
    justifyContent: 'center',
  },
  progressLabel: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: theme.colors.text },
  gearBtn: {
    borderWidth: 2,
    borderColor: theme.colors.text,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: { backgroundColor: theme.colors.accent, paddingHorizontal: spacing.lg, paddingVertical: 9 },
  toastText: { color: '#fff', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
});
