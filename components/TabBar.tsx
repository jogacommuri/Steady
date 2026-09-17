import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MealIcon, TodayIcon, WeightIcon, WorkoutIcon } from '@/components/icons';
import { theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

const TAB_ICONS: Record<string, (props: { size?: number; color: string }) => ReactElement> = {
  today: TodayIcon,
  meals: MealIcon,
  weight: WeightIcon,
  workouts: WorkoutIcon,
};

/**
 * The bottom tab bar: 4 equal tabs (each with a small icon) plus a
 * fixed-width accent "+" that always opens Log entry, regardless of which
 * tab is active.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const Icon = TAB_ICONS[route.name];
          const iconColor = isFocused ? theme.colors.accent : theme.colors.textMuted;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, { backgroundColor: isFocused ? theme.colors.text : 'transparent' }]}
            >
              {Icon ? <Icon size={19} color={iconColor} /> : <View style={[styles.dot, { backgroundColor: iconColor }]} />}
              <Text
                style={[
                  weight('semibold'),
                  styles.label,
                  { color: isFocused ? theme.colors.textInverse : theme.colors.textMuted },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={() => router.push('/add')} accessibilityLabel="Log entry" style={styles.fab}>
          <Text style={[weight('bold'), styles.fabGlyph]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  tab: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderLight,
    minHeight: 56,
    paddingTop: 13,
    paddingBottom: 15,
    paddingHorizontal: 6,
    alignItems: 'flex-start',
    gap: 7,
  },
  dot: { width: 12, height: 12 },
  label: { fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  fab: {
    width: 64,
    minHeight: 56,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGlyph: { fontSize: 24, color: '#fff' },
});
