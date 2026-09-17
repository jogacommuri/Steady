import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SyncProvider } from '@/components/SyncProvider';
import { DATABASE_NAME, migrate } from '@/lib/db';
import { theme } from '@/theme/colors';
import { useAppFonts } from '@/theme/typography';

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) return <Loading />;

  return (
    <SafeAreaProvider>
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate} useSuspense>
          <StatusBar style="dark" />
          <SyncProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="day" />
              <Stack.Screen name="goals" />
              <Stack.Screen name="progress" />
              <Stack.Screen name="add" options={{ presentation: 'modal' }} />
              <Stack.Screen name="account" options={{ presentation: 'modal' }} />
            </Stack>
          </SyncProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
