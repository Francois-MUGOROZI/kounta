/**
 * Currency formatting utility functions
 */
import { getCurrencySymbol } from "../constants/currencies";

/**
 * Formats an amount with the appropriate currency symbol
 * @param amount - The amount to format
 * @param currency - The currency code (e.g., "USD", "EUR")
 * @returns Formatted string with currency symbol and number formatting
 */
export const formatAmount = (amount: number, currency: string): string => {
	const symbol = getCurrencySymbol(currency);
	return `${symbol}${amount.toLocaleString()}`;
};

/**
 * Formats an amount with currency symbol and sign for transactions
 * @param amount - The amount to format
 * @param currency - The currency code
 * @param isIncome - Whether this is an income transaction
 * @returns Formatted string with sign and currency symbol
 */
export const formatTransactionAmount = (
	amount: number,
	currency: string,
	isIncome: boolean
): string => {
	const symbol = getCurrencySymbol(currency);
	const sign = isIncome ? "+" : "-";
	return `${sign}${symbol}${amount.toLocaleString()}`;
};
