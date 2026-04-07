import { supabase } from '@/lib/supabase';
import { useCallback, useState } from 'react';

export type TodayFoodItem = {
    id: number;
    name: string;
    grams: number;
    calories: number;
    cost: number | null;
    costPer10gProtein: number | null; // null if no protein or no cost data
    hasProtein: boolean;
    eatenAt: string;
};

/**
 * Get the start and end of a specific day in the user's local timezone as ISO strings.
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
 * Format time from ISO string to readable format (e.g., "12:30 PM")
 */
export function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Calculate the cost to get 10 grams of protein from a food item.
 * Formula: (10 / protein_per_gram) * cost_per_gram
 * Returns null if protein is 0 or cost is null.
 */
function calculateCostPer10gProtein(
    costPerGram: number | null,
    proteinPerGram: number
): number | null {
    if (costPerGram === null || proteinPerGram <= 0) {
        return null;
    }
    // Grams of food needed to get 10g protein
    const gramsNeeded = 10 / proteinPerGram;
    // Cost for that amount
    const cost = gramsNeeded * costPerGram;
    return Math.round(cost * 100) / 100; // Round to 2 decimal places
}

/**
 * Hook to fetch food logs for a specific day.
 * Uses the user's local timezone.
 * Returns individual items sorted by eaten_at descending (most recent first).
 * @param date - Optional date to fetch logs for. Defaults to today.
 */
export function useTodayFoodLogs(date?: Date) {
    const [items, setItems] = useState<TodayFoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const targetDate = date || new Date();
            const { startOfDay, endOfDay } = getDayRange(targetDate);

            const { data, error: queryError } = await supabase
                .from('food_logs')
                .select('id, name, grams, calories_per_gram, protein_per_gram, cost_usd_per_gram, eaten_at')
                .eq('is_valid', true)
                .gte('eaten_at', startOfDay)
                .lte('eaten_at', endOfDay)
                .order('eaten_at', { ascending: false });

            if (queryError) {
                throw new Error(`Supabase query failed: ${queryError.message}`);
            }

            // Map to TodayFoodItem format
            const result: TodayFoodItem[] = (data ?? []).map((row) => {
                const grams = Number(row.grams) || 0;
                const caloriesPerGram = Number(row.calories_per_gram) || 0;
                const proteinPerGram = Number(row.protein_per_gram) || 0;
                const costPerGram = row.cost_usd_per_gram != null ? Number(row.cost_usd_per_gram) : null;

                return {
                    id: row.id,
                    name: row.name || 'Unknown',
                    grams: Math.round(grams),
                    calories: Math.round(grams * caloriesPerGram),
                    cost: costPerGram != null ? Math.round(grams * costPerGram * 100) / 100 : null,
                    costPer10gProtein: calculateCostPer10gProtein(costPerGram, proteinPerGram),
                    hasProtein: proteinPerGram > 0,
                    eatenAt: row.eaten_at,
                };
            });

            setItems(result);
        } catch (e: any) {
            setError(e?.message || String(e));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [date]);

    return {
        items,
        loading,
        error,
        refresh: fetchLogs,
    };
}
