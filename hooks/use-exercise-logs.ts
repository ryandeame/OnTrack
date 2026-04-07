import { supabase } from '@/lib/supabase';
import { useCallback } from 'react';

export type ExerciseLog = {
  id: number;
  name: string;
  sets: number;
  reps: number;
  occurred_at: string;
};

export type NewExerciseLog = {
  name: string;
  sets: number;
  reps: number;
  occurredAt: Date | string;
};

export function useExerciseLogs() {
  const add = useCallback(async (log: NewExerciseLog) => {
    const occurred_at = log.occurredAt instanceof Date ? log.occurredAt.toISOString() : log.occurredAt;

    const { error } = await supabase.from('exercise_logs').insert({
      name: log.name,
      sets: log.sets,
      reps: log.reps,
      occurred_at,
    });

    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  }, []);

  const list = useCallback(async (limit = 200): Promise<ExerciseLog[]> => {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('id, name, sets, reps, occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Supabase list failed: ${error.message}`);
    return (data ?? []) as ExerciseLog[];
  }, []);

  const remove = useCallback(async (id: number) => {
    const { error } = await supabase.from('exercise_logs').delete().eq('id', id);
    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  }, []);

  const suggestNames = useCallback(async (prefix: string, limit = 5): Promise<string[]> => {
    const q = (prefix ?? '').trim();
    if (q.length === 0) return [];

    const { data, error } = await supabase
      .from('exercise_logs')
      .select('name, occurred_at')
      .ilike('name', `${q}%`)
      .order('occurred_at', { ascending: false })
      .limit(limit * 10);

    if (error) throw new Error(`Supabase suggest failed: ${error.message}`);

    const seen = new Set<string>();
    const uniqueNames: string[] = [];

    for (const row of data ?? []) {
      const candidate = row.name?.trim();
      if (!candidate || seen.has(candidate)) continue;
      seen.add(candidate);
      uniqueNames.push(candidate);
      if (uniqueNames.length >= limit) break;
    }

    return uniqueNames;
  }, []);

  const getLatestByName = useCallback(async (name: string): Promise<ExerciseLog | null> => {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('id, name, sets, reps, occurred_at')
      .eq('name', name)
      .order('occurred_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Supabase latest failed: ${error.message}`);
    return (data as ExerciseLog | null) ?? null;
  }, []);

  return { add, list, remove, suggestNames, getLatestByName };
}
