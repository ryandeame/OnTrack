import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type CostCalculatorSourceCurrency = 'ARS' | 'PEN';

export type CurrencyOption = {
    code: CostCalculatorSourceCurrency;
    label: string;
    name: string;
    symbol: string;
};

export const COST_CALCULATOR_SOURCE_CURRENCIES: CurrencyOption[] = [
    { code: 'ARS', label: 'ARS', name: 'Argentine Peso', symbol: '$' },
    { code: 'PEN', label: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
];

const COST_CALCULATOR_CURRENCY_KEY = 'ontrack.cost_calculator.source_currency';
const DEFAULT_SOURCE_CURRENCY: CostCalculatorSourceCurrency = 'ARS';

const listeners = new Set<(currency: CostCalculatorSourceCurrency) => void>();

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function normalizeCurrency(value: string | null): CostCalculatorSourceCurrency {
    return value === 'PEN' || value === 'ARS' ? value : DEFAULT_SOURCE_CURRENCY;
}

export function getSourceCurrencySymbol(currency: CostCalculatorSourceCurrency): string {
    return currency === 'PEN' ? 'S/' : '$';
}

export async function getStoredSourceCurrency(): Promise<CostCalculatorSourceCurrency> {
    try {
        if (Platform.OS === 'web') {
            if (!isBrowser()) return DEFAULT_SOURCE_CURRENCY;
            return normalizeCurrency(window.localStorage.getItem(COST_CALCULATOR_CURRENCY_KEY));
        }

        const value = await SecureStore.getItemAsync(COST_CALCULATOR_CURRENCY_KEY);
        return normalizeCurrency(value);
    } catch {
        return DEFAULT_SOURCE_CURRENCY;
    }
}

export async function setStoredSourceCurrency(currency: CostCalculatorSourceCurrency): Promise<void> {
    try {
        if (Platform.OS === 'web') {
            if (isBrowser()) {
                window.localStorage.setItem(COST_CALCULATOR_CURRENCY_KEY, currency);
            }
        } else {
            await SecureStore.setItemAsync(COST_CALCULATOR_CURRENCY_KEY, currency);
        }
    } catch {
        // Keep runtime state in sync even if persistence fails.
    }

    listeners.forEach((listener) => listener(currency));
}

export function subscribeToSourceCurrency(
    listener: (currency: CostCalculatorSourceCurrency) => void
): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
