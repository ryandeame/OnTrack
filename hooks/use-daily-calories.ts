import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

export type DailySummary = {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalSpend: number; // in USD
    itemCount: number;
};

/**
 * Get the start and end of a day in the user's local timezone as ISO strings.
 * @param date - The date to get the range for.
 */
function getDayRange(date: Date): { startOfDay: string; endOfDay: string } {
    // Start of the target day in local timezone
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

    // End of the target day in local timezone (23:59:59.999)
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    return {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
    };
}

/**
 * Fetch daily totals for a specific date.
 * @param date - The date to fetch summary for.
 */
async function fetchDailySummary(date: Date): Promise<DailySummary> {
    const { startOfDay, endOfDay } = getDayRange(date);

    const { data, error: queryError } = await supabase
        .from('food_logs')
        .select('grams, calories_per_gram, carbs_per_gram, protein_per_gram, cost_usd_per_gram')
        .eq('is_valid', true)
        .gte('eaten_at', startOfDay)
        .lte('eaten_at', endOfDay);

    if (queryError) {
        throw new Error(`Supabase query failed: ${queryError.message}`);
    }

    // Calculate totals from the fetched rows
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalSpend = 0;

    for (const row of data ?? []) {
        const grams = Number(row.grams) || 0;
        const caloriesPerGram = Number(row.calories_per_gram) || 0;
        const carbsPerGram = Number(row.carbs_per_gram) || 0;
        const proteinPerGram = Number(row.protein_per_gram) || 0;
        const costPerGram = row.cost_usd_per_gram != null ? Number(row.cost_usd_per_gram) : 0;

        totalCalories += grams * caloriesPerGram;
        totalCarbs += grams * carbsPerGram;
        totalProtein += grams * proteinPerGram;
        totalSpend += grams * costPerGram;
    }

    return {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalSpend: Math.round(totalSpend * 100) / 100, // Round to 2 decimal places
        itemCount: data?.length ?? 0,
    };
}

/**
 * Hook to fetch calorie, macro, and spend summary for a specific date.
 * Uses the user's local timezone.
 * @param date - Optional date to fetch for. Defaults to today if not provided.
 */
export function useDailyCalories(date?: Date) {
    const [summary, setSummary] = useState<DailySummary>({
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalSpend: 0,
        itemCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCalories = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const targetDate = date || new Date();
            const result = await fetchDailySummary(targetDate);
            setSummary(result);
        } catch (e: any) {
            setError(e?.message || String(e));
            setSummary({
                totalCalories: 0,
                totalProtein: 0,
                totalCarbs: 0,
                totalSpend: 0,
                itemCount: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [date]);

    // Fetch on mount or when date changes
    useEffect(() => {
        fetchCalories();
    }, [fetchCalories]);

    return {
        summary,
        loading,
        error,
        refresh: fetchCalories,
    };
}

/**
 * Hook to fetch the previous day's spend summary relative to a reference date.
 * @param referenceDate - Optional date to compare against. Defaults to today (so fetches yesterday).
 */
export function useYesterdaySpend(referenceDate?: Date) {
    const [yesterydaySpend, setYesterdaySpend] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPreviousDaySpend = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const baseDate = referenceDate || new Date();
            // Calculate previous day
            const previousDay = new Date(baseDate);
            previousDay.setDate(baseDate.getDate() - 1);

            const result = await fetchDailySummary(previousDay);
            setYesterdaySpend(result.totalSpend);
        } catch (e: any) {
            setError(e?.message || String(e));
            setYesterdaySpend(0);
        } finally {
            setLoading(false);
        }
    }, [referenceDate]);

    // Fetch on mount or when referenceDate changes
    useEffect(() => {
        fetchPreviousDaySpend();
    }, [fetchPreviousDaySpend]);

    return {
        yesterdaySpend: yesterydaySpend,
        loading,
        error,
        refresh: fetchPreviousDaySpend,
    };
}
