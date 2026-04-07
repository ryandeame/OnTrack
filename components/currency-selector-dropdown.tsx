import Collapsible from '@/components/collapsible';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import {
    COST_CALCULATOR_SOURCE_CURRENCIES,
    type CostCalculatorSourceCurrency,
} from '@/lib/cost-calculator-currency';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type CurrencySelectorDropdownProps = {
    value: CostCalculatorSourceCurrency;
    onChange: (currency: CostCalculatorSourceCurrency) => void;
};

export function CurrencySelectorDropdown({ value, onChange }: CurrencySelectorDropdownProps) {
    const { resolvedTheme } = useTheme();
    const themeColors = Colors[resolvedTheme];
    const [isOpen, setIsOpen] = useState(false);

    const selected = useMemo(
        () => COST_CALCULATOR_SOURCE_CURRENCIES.find((currency) => currency.code === value),
        [value]
    );

    return (
        <View style={styles.section}>
            <Pressable
                onPress={() => setIsOpen((prev) => !prev)}
                style={[
                    styles.headerRow,
                    {
                        backgroundColor: themeColors.inputBackground,
                        borderColor: themeColors.inputPlaceholder,
                    },
                ]}
            >
                <View style={styles.headerLeft}>
                    <ThemedText style={styles.headerText}>Currency</ThemedText>
                    <ThemedText style={styles.selectedText}>
                        {selected ? `${selected.label} - ${selected.name} (${selected.symbol})` : value}
                    </ThemedText>
                </View>
                <MaterialIcons
                    name={isOpen ? 'keyboard-arrow-down' : 'keyboard-arrow-right'}
                    size={20}
                    color={themeColors.text}
                />
            </Pressable>

            <Collapsible expanded={isOpen} duration={220}>
                <View style={styles.listWrapper}>
                    <View
                        style={[
                            styles.list,
                            {
                                backgroundColor: themeColors.inputBackground,
                                borderColor: themeColors.inputPlaceholder,
                            },
                        ]}
                    >
                        {COST_CALCULATOR_SOURCE_CURRENCIES.map((currency, index) => {
                            const isActive = currency.code === value;
                            return (
                                <Pressable
                                    key={currency.code}
                                    onPress={() => {
                                        onChange(currency.code);
                                        setIsOpen(false);
                                    }}
                                    style={[
                                        styles.itemRow,
                                        index > 0 && {
                                            borderTopWidth: 1,
                                            borderTopColor: themeColors.inputPlaceholder,
                                        },
                                    ]}
                                >
                                    <ThemedText style={[styles.itemText, isActive && styles.itemTextActive]}>
                                        {currency.label} - {currency.name} ({currency.symbol})
                                    </ThemedText>
                                    {isActive && (
                                        <MaterialIcons name="check" size={18} color={themeColors.foodLogBtnBg} />
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </Collapsible>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 12,
    },
    headerRow: {
        minHeight: 44,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    headerLeft: {
        flex: 1,
    },
    headerText: {
        fontWeight: '600',
        fontSize: 14,
    },
    selectedText: {
        marginTop: 2,
        fontSize: 13,
        opacity: 0.85,
    },
    list: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    listWrapper: {
        paddingTop: 6,
    },
    itemRow: {
        minHeight: 40,
        paddingHorizontal: 12,
        paddingVertical: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    itemText: {
        fontSize: 14,
        opacity: 0.9,
    },
    itemTextActive: {
        fontWeight: '700',
    },
});
