import { useFoodLogs } from '@/hooks/use-food-logs';
import { divStr, mulStr, toNum } from '@/lib/decimal-math';
import { useCallback, useState } from 'react';

// ============================================
// Food Log Submit Hook
// ============================================

export type FoodLogFormData = {
    name: string;
    eatenAt: Date;
    // Servings mode fields
    servings: string;
    gramsPerServing: string;
    caloriesPerServing: string;
    carbsPerServing: string;
    proteinPerServing: string;
    costPerServing: string; // Optional cost per serving in USD
};

export type UseFoodLogSubmitResult = {
    /** Whether a submission is in progress */
    submitting: boolean;
    /** Submit the food log entry. Returns true on success, false on validation failure. */
    submitFoodLog: (data: FoodLogFormData) => Promise<boolean>;
};

/**
 * Hook that handles food log submission with proper decimal math.
 * Returns submitting state and a submit function.
 */
export function useFoodLogSubmit(onSuccess?: () => void): UseFoodLogSubmitResult {
    const { add } = useFoodLogs();
    const [submitting, setSubmitting] = useState(false);

    const submitFoodLog = useCallback(async (data: FoodLogFormData): Promise<boolean> => {
        if (submitting) return false;
        if (data.name.trim().length === 0) return false;

        const sStr = data.servings;
        const gpsStr = data.gramsPerServing;
        const calpsStr = data.caloriesPerServing;
        const carbpsStr = data.carbsPerServing;
        const protpsStr = data.proteinPerServing;
        const costpsStr = data.costPerServing;

        const s = toNum(sStr);
        const gps = toNum(gpsStr);
        const calps = toNum(calpsStr);
        const carbps = toNum(carbpsStr);
        const protps = toNum(protpsStr);

        // Validate required fields
        if ([s, gps, calps, carbps, protps].some((n) => Number.isNaN(n) || n <= 0)) {
            return false;
        }

        // Calculate values
        const gStr = mulStr(sStr, gpsStr);
        const g = parseFloat(gStr);
        const cpg = parseFloat(divStr(calpsStr, gpsStr, 10));
        const carbpg = parseFloat(divStr(carbpsStr, gpsStr, 10));
        const protpg = parseFloat(divStr(protpsStr, gpsStr, 10));

        // Cost is optional - only calculate if provided
        // Round to 6 decimal places for stable round-trip calculations
        let costUsdPerGram: number | null = null;
        const costps = toNum(costpsStr);
        if (!Number.isNaN(costps) && costps > 0 && gps > 0) {
            costUsdPerGram = parseFloat(divStr(costpsStr, gpsStr, 6));
        }

        setSubmitting(true);
        try {
            await add({
                name: data.name.trim(),
                grams: g,
                caloriesPerGram: cpg,
                carbsPerGram: carbpg,
                proteinPerGram: protpg,
                costUsdPerGram,
                servings: s,
                eatenAt: data.eatenAt,
            });
            onSuccess?.();
            return true;
        } finally {
            setSubmitting(false);
        }
    }, [add, submitting, onSuccess]);

    return { submitting, submitFoodLog };
}
