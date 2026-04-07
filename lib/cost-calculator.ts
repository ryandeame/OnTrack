/**
 * Calculate USD cost per serving from local-currency payment data.
 *
 * Formula:
 *   Net Item Cost = Item Cost - Item Discount
 *   Item Percentage = Net Item Cost / Total Paid (local currency)
 *   USD per Serving = (Item Percentage × Total Charged USD) / Item Servings
 *
 * @param totalChargedUSD - Total amount charged in USD
 * @param totalPaidLocal - Total amount paid in local currency
 * @param itemCostLocal - Cost of this item in local currency
 * @param itemDiscountLocal - Discount on this item in local currency (optional, defaults to 0)
 * @param itemServings - Number of servings for this item
 * @returns USD cost per serving as string (2 decimal places), or null if invalid
 */
export function calculateCostPerServing(
    totalChargedUSD: number,
    totalPaidLocal: number,
    itemCostLocal: number,
    itemDiscountLocal: number,
    itemServings: number
): string | null {
    // Validate inputs
    if (totalChargedUSD <= 0 || totalPaidLocal <= 0 || itemCostLocal <= 0 || itemServings <= 0) {
        return null;
    }

    const netItemCost = itemCostLocal - itemDiscountLocal;
    if (netItemCost <= 0) {
        return null;
    }

    const itemPercentage = netItemCost / totalPaidLocal;
    const usdPerServing = (itemPercentage * totalChargedUSD) / itemServings;

    // Round to 2 decimal places
    return (Math.round(usdPerServing * 100) / 100).toFixed(2);
}

/**
 * Parse a currency string (with optional symbol prefix) to a number.
 * Returns 0 if the string is empty or invalid.
 */
export function parseCurrencyValue(val: string): number {
    const stripped = val.replace(/[^0-9.]/g, '');
    return parseFloat(stripped) || 0;
}
