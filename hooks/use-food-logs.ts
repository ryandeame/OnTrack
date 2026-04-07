import { supabase } from '@/lib/supabase';
import type { FoodLog } from '@/types/food';
import { useCallback } from 'react';

export type NewFoodLog = {
  name: string;
  grams: number;
  caloriesPerGram: number;
  carbsPerGram: number;
  proteinPerGram: number;
  costUsdPerGram?: number | null; // Optional cost per gram in USD
  servings: number; // Number of servings (required, must be > 0)
  eatenAt: Date | string; // Date or ISO string
};

export function useFoodLogs() {
  const add = useCallback(async (log: NewFoodLog) => {
    const eaten_at = log.eatenAt instanceof Date ? log.eatenAt.toISOString() : log.eatenAt;

    const { error } = await supabase.from('food_logs').insert({
      name: log.name,
      grams: log.grams,
      calories_per_gram: log.caloriesPerGram,
      carbs_per_gram: log.carbsPerGram,
      protein_per_gram: log.proteinPerGram,
      cost_usd_per_gram: log.costUsdPerGram ?? null,
      servings: log.servings,
      eaten_at: eaten_at,
    });

    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  }, []);

  const list = useCallback(async (limit?: number): Promise<FoodLog[]> => {
    let query = supabase
      .from('food_logs')
      .select('id, name, grams, calories_per_gram, carbs_per_gram, protein_per_gram, eaten_at, is_valid, servings, cost_usd_per_gram')
      .eq('is_valid', true)
      .order('eaten_at', { ascending: false });

    if (limit != null) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Supabase list failed: ${error.message}`);
    return (data ?? []) as FoodLog[];
  }, []);

  const remove = useCallback(async (id: number) => {
    // Soft delete: mark as invalid instead of actually deleting
    const { error } = await supabase
      .from('food_logs')
      .update({ is_valid: false })
      .eq('id', id);
    if (error) throw new Error(`Supabase soft delete failed: ${error.message}`);
  }, []);

  const clearAll = useCallback(async () => {
    // Delete all rows - Supabase requires a filter, so we use a condition that matches all
    const { error } = await supabase.from('food_logs').delete().gte('id', 0);
    if (error) throw new Error(`Supabase clearAll failed: ${error.message}`);
  }, []);

  const suggestNames = useCallback(async (prefix: string, limit = 5): Promise<string[]> => {
    const q = (prefix ?? '').trim();
    if (q.length === 0) return [];

    // Use ilike for case-insensitive prefix matching, only from valid entries
    const { data, error } = await supabase
      .from('food_logs')
      .select('name, eaten_at')
      .eq('is_valid', true)
      .ilike('name', `${q}%`)
      .order('eaten_at', { ascending: false })
      .limit(limit * 10); // Fetch more to get unique names

    if (error) throw new Error(`Supabase suggest failed: ${error.message}`);

    // Get unique names, ordered by most recent
    const seen = new Set<string>();
    const uniqueNames: string[] = [];
    for (const row of data ?? []) {
      if (!seen.has(row.name)) {
        seen.add(row.name);
        uniqueNames.push(row.name);
        if (uniqueNames.length >= limit) break;
      }
    }
    return uniqueNames;
  }, []);

  const getLatestByName = useCallback(async (name: string): Promise<FoodLog | null> => {
    const { data, error } = await supabase
      .from('food_logs')
      .select('id, name, grams, calories_per_gram, carbs_per_gram, protein_per_gram, eaten_at, is_valid, servings, cost_usd_per_gram')
      .eq('name', name)
      .eq('is_valid', true)
      .order('eaten_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is not an error for our use case
      throw new Error(`Supabase latest failed: ${error.message}`);
    }
    return (data as FoodLog) ?? null;
  }, []);

  // Edit a food log entry: invalidate old entry and insert new one with updates
  const edit = useCallback(async (id: number, updates: NewFoodLog) => {
    // 1. Soft delete the old entry
    await remove(id);
    // 2. Insert a new entry with updated values
    await add(updates);
  }, [remove, add]);

  return { add, list, remove, edit, clearAll, suggestNames, getLatestByName };
}
