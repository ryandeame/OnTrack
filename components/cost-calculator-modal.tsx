import { CurrencySelectorDropdown } from '@/components/currency-selector-dropdown';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { calculateCostPerServing, parseCurrencyValue } from '@/lib/cost-calculator';
import {
    type CostCalculatorSourceCurrency,
    getSourceCurrencySymbol,
    getStoredSourceCurrency,
    setStoredSourceCurrency,
    subscribeToSourceCurrency,
} from '@/lib/cost-calculator-currency';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

type CostCalculatorModalProps = {
    visible: boolean;
    onClose: () => void;
    onApply: (costPerServingUSD: string) => void;
};

/**
 * Modal for converting local-currency payment data to USD cost per serving.
 * 
 * Calculation:
 * Net Item Cost = Item Cost - Item Discount
 * Item Percentage = Net Item Cost / Total Paid (local currency)
 * USD per Serving = (Item Percentage × Total Charged USD) / Item Servings
 */
export function CostCalculatorModal({ visible, onClose, onApply }: CostCalculatorModalProps) {
    const { resolvedTheme } = useTheme();
    const themeColors = Colors[resolvedTheme];
    const { height: screenHeight } = useWindowDimensions();
    const cardHeight = Math.min(screenHeight - 48, 700);

    // Form state
    const [sourceCurrency, setSourceCurrency] = useState<CostCalculatorSourceCurrency>('ARS');
    const [totalChargedUSD, setTotalChargedUSD] = useState('');
    const [totalPaidLocal, setTotalPaidLocal] = useState('');
    const [itemCostLocal, setItemCostLocal] = useState('');
    const [itemDiscountLocal, setItemDiscountLocal] = useState('');
    const [itemServings, setItemServings] = useState('');

    const localCurrencySymbol = useMemo(
        () => getSourceCurrencySymbol(sourceCurrency),
        [sourceCurrency]
    );

    // Dynamic input styles
    const inputStyle = useMemo(() => ({
        ...styles.input,
        backgroundColor: themeColors.inputBackground,
        color: themeColors.inputText,
        borderColor: themeColors.inputPlaceholder,
    }), [themeColors]);

    const handleSourceCurrencyChange = useCallback((currency: CostCalculatorSourceCurrency) => {
        setSourceCurrency(currency);
        void setStoredSourceCurrency(currency);
    }, []);

    useEffect(() => {
        let isMounted = true;

        void getStoredSourceCurrency().then((savedCurrency) => {
            if (isMounted) {
                setSourceCurrency(savedCurrency);
            }
        });

        const unsubscribe = subscribeToSourceCurrency((updatedCurrency) => {
            if (isMounted) {
                setSourceCurrency(updatedCurrency);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const withCurrencyPrefix = useCallback((value: string, symbol: string): string => {
        const numeric = value.replace(/[^0-9.]/g, '');
        return numeric ? `${symbol}${numeric}` : '';
    }, []);

    useEffect(() => {
        setTotalPaidLocal((prev) => withCurrencyPrefix(prev, localCurrencySymbol));
        setItemCostLocal((prev) => withCurrencyPrefix(prev, localCurrencySymbol));
        setItemDiscountLocal((prev) => withCurrencyPrefix(prev, localCurrencySymbol));
    }, [localCurrencySymbol, withCurrencyPrefix]);

    // Handle USD input (max 2 decimals)
    const handleUSDChange = useCallback((text: string) => {
        const numeric = text.replace(/[^0-9.]/g, '');
        const parts = numeric.split('.');
        let formatted = parts[0];
        if (parts.length > 1) {
            formatted += '.' + parts[1].slice(0, 2);
        }
        setTotalChargedUSD(formatted ? `$${formatted}` : '');
    }, []);

    // Format on blur to ensure 2 decimal places
    const formatCurrencyOnBlur = useCallback((
        value: string,
        setter: (val: string) => void,
        symbol: string = '$'
    ) => {
        if (!value) return;
        const numeric = value.replace(/[^0-9.]/g, '');
        if (!numeric) return;

        const parts = numeric.split('.');
        let formatted = parts[0];
        if (formatted === '') formatted = '0';

        if (parts.length === 1) {
            formatted += '.00';
        } else if (parts.length > 1) {
            let cents = parts[1];
            if (cents.length === 0) cents = '00';
            else if (cents.length === 1) cents += '0';
            else cents = cents.slice(0, 2);
            formatted += '.' + cents;
        }

        setter(`${symbol}${formatted}`);
    }, []);

    // Handle local-currency input (max 2 decimals)
    const handleLocalCurrencyChange = useCallback((setter: (val: string) => void) => (text: string) => {
        const numeric = text.replace(/[^0-9.]/g, '');
        const parts = numeric.split('.');
        let formatted = parts[0];
        if (parts.length > 1) {
            formatted += '.' + parts[1].slice(0, 2);
        }
        setter(formatted ? `${localCurrencySymbol}${formatted}` : '');
    }, [localCurrencySymbol]);

    // Validation - all required fields must be filled (discount is optional)
    const canContinue = useMemo(() => {
        return (
            parseCurrencyValue(totalChargedUSD) > 0 &&
            parseCurrencyValue(totalPaidLocal) > 0 &&
            parseCurrencyValue(itemCostLocal) > 0 &&
            parseFloat(itemServings) > 0
        );
    }, [totalChargedUSD, totalPaidLocal, itemCostLocal, itemServings]);

    // Calculate result using shared utility
    const calculatedCost = useMemo(() => {
        if (!canContinue) return null;
        return calculateCostPerServing(
            parseCurrencyValue(totalChargedUSD),
            parseCurrencyValue(totalPaidLocal),
            parseCurrencyValue(itemCostLocal),
            parseCurrencyValue(itemDiscountLocal),
            parseFloat(itemServings)
        );
    }, [canContinue, totalChargedUSD, totalPaidLocal, itemCostLocal, itemDiscountLocal, itemServings]);

    // Handle continue
    const handleContinue = useCallback(() => {
        if (calculatedCost) {
            onApply(`$${calculatedCost}`);
            // Reset form
            setTotalChargedUSD('');
            setTotalPaidLocal('');
            setItemCostLocal('');
            setItemDiscountLocal('');
            setItemServings('');
        }
    }, [calculatedCost, onApply]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        // Reset form and close
        setTotalChargedUSD('');
        setTotalPaidLocal('');
        setItemCostLocal('');
        setItemDiscountLocal('');
        setItemServings('');
        onClose();
    }, [onClose]);

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={handleCancel}>
            <View style={styles.backdrop}>
                <ThemedView style={[styles.card, { height: cardHeight }]}>
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator
                    >
                        <CurrencySelectorDropdown
                            value={sourceCurrency}
                            onChange={handleSourceCurrencyChange}
                        />

                        <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
                            {sourceCurrency} → USD Calculator
                        </ThemedText>

                        {/* Total Charged USD */}
                        <View style={styles.fieldRow}>
                            <ThemedText style={styles.label}>Total Charged (USD)</ThemedText>
                            <TextInput
                                placeholder="$0.00"
                                placeholderTextColor={themeColors.inputPlaceholder}
                                value={totalChargedUSD}
                                onChangeText={handleUSDChange}
                                onBlur={() => formatCurrencyOnBlur(totalChargedUSD, setTotalChargedUSD, '$')}
                                keyboardType="decimal-pad"
                                style={[inputStyle, styles.fieldInput]}
                            />
                        </View>

                        {/* Total Paid local currency */}
                        <View style={styles.fieldRow}>
                            <ThemedText style={styles.label}>Total Paid ({sourceCurrency})</ThemedText>
                            <TextInput
                                placeholder={`${localCurrencySymbol}0.00`}
                                placeholderTextColor={themeColors.inputPlaceholder}
                                value={totalPaidLocal}
                                onChangeText={handleLocalCurrencyChange(setTotalPaidLocal)}
                                onBlur={() => formatCurrencyOnBlur(totalPaidLocal, setTotalPaidLocal, localCurrencySymbol)}
                                keyboardType="decimal-pad"
                                style={[inputStyle, styles.fieldInput]}
                            />
                        </View>

                        {/* Item Cost local currency */}
                        <View style={styles.fieldRow}>
                            <ThemedText style={styles.label}>Item Cost ({sourceCurrency})</ThemedText>
                            <TextInput
                                placeholder={`${localCurrencySymbol}0.00`}
                                placeholderTextColor={themeColors.inputPlaceholder}
                                value={itemCostLocal}
                                onChangeText={handleLocalCurrencyChange(setItemCostLocal)}
                                onBlur={() => formatCurrencyOnBlur(itemCostLocal, setItemCostLocal, localCurrencySymbol)}
                                keyboardType="decimal-pad"
                                style={[inputStyle, styles.fieldInput]}
                            />
                        </View>

                        {/* Item Discount local currency (optional) */}
                        <View style={styles.fieldRow}>
                            <ThemedText style={styles.label}>Item Discount ({sourceCurrency})</ThemedText>
                            <TextInput
                                placeholder={`${localCurrencySymbol}0.00 (optional)`}
                                placeholderTextColor={themeColors.inputPlaceholder}
                                value={itemDiscountLocal}
                                onChangeText={handleLocalCurrencyChange(setItemDiscountLocal)}
                                onBlur={() => formatCurrencyOnBlur(itemDiscountLocal, setItemDiscountLocal, localCurrencySymbol)}
                                keyboardType="decimal-pad"
                                style={[inputStyle, styles.fieldInput]}
                            />
                        </View>

                        {/* Item Servings */}
                        <View style={styles.fieldRow}>
                            <ThemedText style={styles.label}>Item Servings</ThemedText>
                            <TextInput
                                placeholder="1"
                                placeholderTextColor={themeColors.inputPlaceholder}
                                value={itemServings}
                                onChangeText={setItemServings}
                                keyboardType="decimal-pad"
                                style={[inputStyle, styles.fieldInput]}
                            />
                        </View>

                        {/* Calculated Result */}
                        {calculatedCost && (
                            <View style={styles.resultRow}>
                                <ThemedText type="defaultSemiBold">Cost/Serv (USD): </ThemedText>
                                <ThemedText type="defaultSemiBold" style={{ color: '#22c55e' }}>${calculatedCost}</ThemedText>
                            </View>
                        )}

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <Pressable
                                onPress={handleCancel}
                                style={[
                                    styles.btn,
                                    {
                                        backgroundColor: themeColors.calculatorCancelBtn,
                                        borderColor: themeColors.calculatorCancelBorder,
                                        borderWidth: 1,
                                    }
                                ]}
                            >
                                <ThemedText style={{ color: themeColors.calculatorCancelText, fontWeight: '600' }}>Cancel</ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={handleContinue}
                                disabled={!canContinue}
                                style={[
                                    styles.btn,
                                    {
                                        backgroundColor: themeColors.foodLogBtnBg,
                                        borderColor: themeColors.inputPlaceholder,
                                        borderWidth: 1,
                                    },
                                    !canContinue && { opacity: 0.5 }
                                ]}
                            >
                                <ThemedText style={{ color: themeColors.foodLogBtnText, fontWeight: '600' }}>Continue</ThemedText>
                            </Pressable>
                        </View>
                    </ScrollView>
                </ThemedView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 12,
        overflow: 'hidden',
    },
    scroll: {
        width: '100%',
    },
    scrollContent: {
        padding: 16,
    },
    fieldRow: {
        marginBottom: 12,
    },
    label: {
        marginBottom: 4,
        fontSize: 14,
    },
    fieldInput: {
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        minHeight: 44,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        padding: 12,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
    },
    btn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
});
