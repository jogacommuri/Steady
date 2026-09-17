import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

/**
 * Four tabs (Today / Meals / Weight / Workouts) with a custom tab bar that
 * also carries the "+" Log entry action. Headers are drawn per-screen via
 * <AppHeader/> instead of the native header, to match the Modernist layout
 * (wordmark + Progress + account icon, with the toast banner underneath).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="meals" options={{ title: 'Meals' }} />
      <Tabs.Screen name="weight" options={{ title: 'Weight' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
    </Tabs>
  );
}
