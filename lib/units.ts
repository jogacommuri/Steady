import type { WeightUnit } from './types';

/** Weight is always stored in kg (SQLite + Supabase); this is purely a display/input conversion. */
const KG_TO_LB = 2.20462;

export function kgToDisplay(valueKg: number, unit: WeightUnit): number {
  return unit === 'lb' ? valueKg * KG_TO_LB : valueKg;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value / KG_TO_LB : value;
}

export function formatWeight(valueKg: number, unit: WeightUnit, decimals = 1): string {
  return kgToDisplay(valueKg, unit).toFixed(decimals);
}
