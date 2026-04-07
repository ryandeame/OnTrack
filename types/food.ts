export type FoodLog = {
    id: number;
    name: string;
    grams: number;
    calories_per_gram: number;
    carbs_per_gram: number;
    protein_per_gram: number;
    eaten_at: string; // ISO8601 string
    is_valid?: boolean; // Soft delete flag (TRUE = active, FALSE = deleted/superseded)
    servings?: number; // Number of servings consumed
    cost_usd_per_gram?: number | null; // Cost per gram in USD (optional)
};
