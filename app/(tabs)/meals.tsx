import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { MealRow } from '@/components/MealRow';
import { EmptyState, Kicker, Rule, RuleLight, SegmentedRow } from '@/components/ui';
import { useMeals } from '@/hooks/useMeals';
import { formatDay, today } from '@/lib/dates';
import { averageCaloriesByMealType, averageDailyCalories, lastNDays } from '@/lib/insights';
import { MEAL_TYPES, type MealType } from '@/lib/types';
import { spacing, theme } from '@/theme/colors';
import { weight } from '@/theme/typography';

const CALORIE_WINDOW_DAYS = 21;

const FILTERS = ['all', ...MEAL_TYPES] as const;
type Filter = (typeof FILTERS)[number];

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const { meals, removeMeal } = useMeals();
  const [filter, setFilter] = useState<Filter>('all');
  const todayStr = today();

  const groups = useMemo(() => {
    const filtered = filter === 'all' ? meals : meals.filter((m) => m.mealType === (filter as MealType));
    const out: { date: string; label: string; items: typeof meals }[] = [];
    for (const m of filtered) {
      const last = out[out.length - 1];
      const label = m.date === todayStr ? 'Today' : formatDay(m.date);
      if (last && last.date === m.date) last.items.push(m);
      else out.push({ date: m.date, label, items: [m] });
    }
    return out;
  }, [meals, filter, todayStr]);

  const { avgDaily, byType } = useMemo(() => {
    const days = lastNDays(todayStr, CALORIE_WINDOW_DAYS);
    return {
      avgDaily: averageDailyCalories(meals, days),
      byType: averageCaloriesByMealType(meals, days),
    };
  }, [meals, todayStr]);

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.titleBlock}>
          <Text style={[weight('bold'), styles.title]}>Meals</Text>
          <Text style={[weight('medium'), styles.subtitle]}>{meals.length} entries</Text>
        </View>
        <Rule />

        {avgDaily != null ? (
          <>
            <View style={styles.calorieSection}>
              <Kicker size={9.5}>Calories · last {CALORIE_WINDOW_DAYS} days</Kicker>
              <View style={styles.calorieHeadline}>
                <Text style={[weight('bold'), styles.calorieValue]}>{avgDaily}</Text>
                <Text style={[weight('medium'), styles.calorieUnit]}>avg kcal / day</Text>
              </View>
              <View style={styles.byTypeRow}>
                {MEAL_TYPES.map((t) => (
                  <View key={t} style={styles.byTypeCell}>
                    <Text style={[weight('medium'), styles.byTypeLabel]}>{t}</Text>
                    <Text style={[weight('semibold'), styles.byTypeValue]}>
                      {byType[t] != null ? byType[t] : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <Rule />
          </>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <SegmentedRow options={FILTERS} value={filter} onChange={setFilter} scroll />
        </ScrollView>

        {groups.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <EmptyState title="No meals logged yet" subtitle="Log one from the + button below." />
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.date}>
              <View style={styles.groupHeader}>
                <Text style={[weight('semibold'), styles.groupLabel]}>{g.label}</Text>
              </View>
              <RuleLight />
              <View style={styles.list}>
                {g.items.map((m) => (
                  <MealRow key={m.id} meal={m} onDelete={removeMeal} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  titleBlock: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 32, letterSpacing: -0.9, textTransform: 'uppercase', color: theme.colors.text },
  subtitle: { fontSize: 12, color: theme.colors.textMuted, marginTop: spacing.xs },
  groupHeader: { backgroundColor: theme.colors.surface, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  groupLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.colors.textMuted },
  list: { paddingHorizontal: spacing.lg },
  calorieSection: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  calorieHeadline: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.sm },
  calorieValue: { fontSize: 34, letterSpacing: -1, color: theme.colors.text },
  calorieUnit: { fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: theme.colors.textMuted },
  byTypeRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.md },
  byTypeCell: { flex: 1 },
  byTypeLabel: { fontSize: 9.5, letterSpacing: 0.4, textTransform: 'uppercase', color: theme.colors.textFaint },
  byTypeValue: { fontSize: 15, color: theme.colors.text, marginTop: 4 },
});
