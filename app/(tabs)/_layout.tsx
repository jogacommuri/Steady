import { Link, Tabs } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

/** Emoji tab icons keep Phase 1 dependency-free; swap for a vector icon set later. */
function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

/** Opens the Account & Sync modal from any tab header. */
function AccountButton() {
  return (
    <Link href="/account" asChild>
      <Pressable
        hitSlop={8}
        accessibilityLabel="Account and sync settings"
        style={{ paddingHorizontal: spacing.lg }}
      >
        <Text style={{ fontSize: 18 }}>⚙️</Text>
      </Pressable>
    </Link>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerRight: () => <AccountButton />,
      }}
    >
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Meals',
          tabBarActiveTintColor: colors.sage,
          tabBarIcon: ({ color }) => <TabIcon glyph="🍽️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="weight"
        options={{
          title: 'Weight',
          tabBarActiveTintColor: colors.clay,
          tabBarIcon: ({ color }) => <TabIcon glyph="⚖️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarActiveTintColor: colors.plum,
          tabBarIcon: ({ color }) => <TabIcon glyph="🏃" color={color} />,
        }}
      />
    </Tabs>
  );
}
