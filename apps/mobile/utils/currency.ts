/**
 * Currency formatting utility functions
 */
import { getCurrencyByCode, getCurrencySymbol } from "../constants/currencies";

const formatters = new Map<string, Intl.NumberFormat>();

const getFormatter = (decimals: number) => {
	const key = String(decimals);
	let formatter = formatters.get(key);
	if (!formatter) {
		formatter = new Intl.NumberFormat("en-US", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		});
		formatters.set(key, formatter);
	}
	return formatter;
};

export const getCurrencyDecimals = (currency: string): number =>
	getCurrencyByCode(currency)?.decimalPlaces ?? 2;

/**
 * How amounts name their currency: "standard" uses the ISO code ("RWF 1,250",
 * "USD 19.00"); "short" uses the local symbol ("RF 1,250", "$19.00").
 * Set from the user's preference by PreferencesProvider.
 */
export type CurrencyDisplay = "standard" | "short";

let currencyDisplay: CurrencyDisplay = "standard";

export const setCurrencyDisplay = (mode: CurrencyDisplay) => {
	currencyDisplay = mode;
};

/** The currency's label in the current display mode, e.g. "RWF" or "RF". */
export const currencyLabel = (currency: string): string =>
	currencyDisplay === "short" ? getCurrencySymbol(currency) : currency;

/** Labels made of letters ("RWF", "KSh") read better with a space. */
const symbolPrefix = (currency: string) => {
	const label = currencyLabel(currency);
	return /[A-Za-z.]$/.test(label) ? `${label} ` : label;
};

/** Number only, grouped and rounded to the currency's precision. */
export const formatNumber = (amount: number, currency: string): string =>
	getFormatter(getCurrencyDecimals(currency)).format(Math.abs(amount || 0));

/**
 * Formats an amount with the currency symbol, e.g. "RWF 1,250" or "-$19.50".
 */
export const formatAmount = (amount: number, currency: string): string => {
	const value = Number(amount) || 0;
	const sign = value < 0 ? "-" : "";
	return `${sign}${symbolPrefix(currency)}${formatNumber(value, currency)}`;
};

/** Signed amount for display, e.g. "+RWF 1,250" / "-RWF 1,250". */
export const formatSignedAmount = (amount: number, currency: string): string => {
	const value = Number(amount) || 0;
	const sign = value > 0 ? "+" : value < 0 ? "-" : "";
	return `${sign}${symbolPrefix(currency)}${formatNumber(value, currency)}`;
};

/** Compact amount for tight spaces, e.g. "RWF 1.2M". */
export const formatCompactAmount = (amount: number, currency: string): string => {
	const value = Number(amount) || 0;
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	const units: [number, string][] = [
		[1e9, "B"],
		[1e6, "M"],
		[1e3, "K"],
	];
	for (const [size, suffix] of units) {
		if (abs >= size) {
			const scaled = abs / size;
			const text = scaled >= 100 ? scaled.toFixed(0) : scaled.toFixed(1).replace(/\.0$/, "");
			return `${sign}${symbolPrefix(currency)}${text}${suffix}`;
		}
	}
	return formatAmount(value, currency);
};

/**
 * Formats an amount with currency symbol and sign for transactions
 * @param isIncome - Whether this is an income transaction
 * @param isTransfer - Transfers are shown without a sign
 */
export const formatTransactionAmount = (
	amount: number,
	currency: string,
	isIncome: boolean,
	isTransfer: boolean
): string => {
	const sign = isTransfer ? "" : isIncome ? "+" : "-";
	return `${sign}${symbolPrefix(currency)}${formatNumber(amount, currency)}`;
};
