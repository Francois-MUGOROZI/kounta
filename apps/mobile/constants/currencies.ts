/**
 * Currency constants and utilities
 */

export interface Currency {
	code: string;
	name: string;
	symbol: string;
	decimalPlaces: number;
}

export const CURRENCIES: Currency[] = [
	{ code: "RWF", name: "Rwandan Franc", symbol: "FRw", decimalPlaces: 0 },
	{ code: "USD", name: "US Dollar", symbol: "$", decimalPlaces: 2 },
	{ code: "EUR", name: "Euro", symbol: "€", decimalPlaces: 2 },
	{ code: "GBP", name: "British Pound", symbol: "£", decimalPlaces: 2 },
	{ code: "JPY", name: "Japanese Yen", symbol: "¥", decimalPlaces: 0 },
	{ code: "CAD", name: "Canadian Dollar", symbol: "C$", decimalPlaces: 2 },
	{ code: "AUD", name: "Australian Dollar", symbol: "A$", decimalPlaces: 2 },
	{ code: "CHF", name: "Swiss Franc", symbol: "CHF", decimalPlaces: 2 },
	{ code: "CNY", name: "Chinese Yuan", symbol: "¥", decimalPlaces: 2 },
	{ code: "INR", name: "Indian Rupee", symbol: "₹", decimalPlaces: 2 },
	{ code: "BRL", name: "Brazilian Real", symbol: "R$", decimalPlaces: 2 },
	{ code: "KRW", name: "South Korean Won", symbol: "₩", decimalPlaces: 0 },
	{ code: "SGD", name: "Singapore Dollar", symbol: "S$", decimalPlaces: 2 },
	{ code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", decimalPlaces: 2 },
	{ code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", decimalPlaces: 2 },
	{ code: "SEK", name: "Swedish Krona", symbol: "kr", decimalPlaces: 2 },
	{ code: "NOK", name: "Norwegian Krone", symbol: "kr", decimalPlaces: 2 },
	{ code: "DKK", name: "Danish Krone", symbol: "kr", decimalPlaces: 2 },
	{ code: "PLN", name: "Polish Złoty", symbol: "zł", decimalPlaces: 2 },
	{ code: "CZK", name: "Czech Koruna", symbol: "Kč", decimalPlaces: 2 },
	{ code: "HUF", name: "Hungarian Forint", symbol: "Ft", decimalPlaces: 0 },
	{ code: "RUB", name: "Russian Ruble", symbol: "₽", decimalPlaces: 2 },
	{ code: "TRY", name: "Turkish Lira", symbol: "₺", decimalPlaces: 2 },
	{ code: "ZAR", name: "South African Rand", symbol: "R", decimalPlaces: 2 },
	{ code: "MXN", name: "Mexican Peso", symbol: "$", decimalPlaces: 2 },
	{ code: "ARS", name: "Argentine Peso", symbol: "$", decimalPlaces: 2 },
	{ code: "CLP", name: "Chilean Peso", symbol: "$", decimalPlaces: 0 },
	{ code: "COP", name: "Colombian Peso", symbol: "$", decimalPlaces: 2 },
	{ code: "PEN", name: "Peruvian Sol", symbol: "S/", decimalPlaces: 2 },
	{ code: "UYU", name: "Uruguayan Peso", symbol: "$", decimalPlaces: 2 },
	{ code: "VND", name: "Vietnamese Dong", symbol: "₫", decimalPlaces: 0 },
	{ code: "THB", name: "Thai Baht", symbol: "฿", decimalPlaces: 2 },
	{ code: "MYR", name: "Malaysian Ringgit", symbol: "RM", decimalPlaces: 2 },
	{ code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", decimalPlaces: 0 },
	{ code: "PHP", name: "Philippine Peso", symbol: "₱", decimalPlaces: 2 },
	{ code: "TWD", name: "Taiwan Dollar", symbol: "NT$", decimalPlaces: 2 },
	{ code: "ILS", name: "Israeli Shekel", symbol: "₪", decimalPlaces: 2 },
	{ code: "AED", name: "UAE Dirham", symbol: "د.إ", decimalPlaces: 2 },
	{ code: "SAR", name: "Saudi Riyal", symbol: "ر.س", decimalPlaces: 2 },
	{ code: "QAR", name: "Qatari Riyal", symbol: "ر.ق", decimalPlaces: 2 },
	{ code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", decimalPlaces: 3 },
	{ code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", decimalPlaces: 3 },
	{ code: "OMR", name: "Omani Rial", symbol: "ر.ع.", decimalPlaces: 3 },
	{ code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", decimalPlaces: 3 },
	{ code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", decimalPlaces: 2 },
	{ code: "EGP", name: "Egyptian Pound", symbol: "ج.م", decimalPlaces: 2 },
	{ code: "NGN", name: "Nigerian Naira", symbol: "₦", decimalPlaces: 2 },
	{ code: "KES", name: "Kenyan Shilling", symbol: "KSh", decimalPlaces: 2 },
	{ code: "GHS", name: "Ghanaian Cedi", symbol: "₵", decimalPlaces: 2 },
	{ code: "UGX", name: "Ugandan Shilling", symbol: "USh", decimalPlaces: 0 },
	{ code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", decimalPlaces: 2 },
	{ code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", decimalPlaces: 2 },
	{ code: "BWP", name: "Botswana Pula", symbol: "P", decimalPlaces: 2 },
	{ code: "NAD", name: "Namibian Dollar", symbol: "N$", decimalPlaces: 2 },
	{ code: "MUR", name: "Mauritian Rupee", symbol: "₨", decimalPlaces: 2 },
	{ code: "SCR", name: "Seychellois Rupee", symbol: "₨", decimalPlaces: 2 },
	{ code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", decimalPlaces: 2 },
	{ code: "TND", name: "Tunisian Dinar", symbol: "د.ت", decimalPlaces: 3 },
	{ code: "DZD", name: "Algerian Dinar", symbol: "د.ج", decimalPlaces: 2 },
	{ code: "LYD", name: "Libyan Dinar", symbol: "ل.د", decimalPlaces: 3 },
	{ code: "SDG", name: "Sudanese Pound", symbol: "ج.س.", decimalPlaces: 2 },
	{ code: "ETB", name: "Ethiopian Birr", symbol: "Br", decimalPlaces: 2 },
	{ code: "SOS", name: "Somali Shilling", symbol: "Sh.So.", decimalPlaces: 2 },
	{ code: "DJF", name: "Djiboutian Franc", symbol: "Fdj", decimalPlaces: 0 },
	{ code: "KMF", name: "Comorian Franc", symbol: "CF", decimalPlaces: 0 },
	{ code: "MGA", name: "Malagasy Ariary", symbol: "Ar", decimalPlaces: 2 },
	{ code: "MWK", name: "Malawian Kwacha", symbol: "MK", decimalPlaces: 2 },
	{ code: "ZWL", name: "Zimbabwean Dollar", symbol: "$", decimalPlaces: 2 },
];

/**
 * Get currency by code
 */
export const getCurrencyByCode = (code: string): Currency | undefined => {
	return CURRENCIES.find((currency) => currency.code === code);
};

/**
 * Get currency symbol by code
 */
export const getCurrencySymbol = (code: string): string => {
	const currency = getCurrencyByCode(code);
	return currency?.symbol || code;
};

/**
 * Get currency options for dropdowns
 */
export const getCurrencyOptions = () => {
	return CURRENCIES.map((currency) => ({
		label: `${currency.name} (${currency.code})`,
		value: currency.code,
	}));
};

/**
 * Get popular currencies (most commonly used)
 */
export const getPopularCurrencies = (): Currency[] => {
	const popularCodes = [
		"RWF",
		"USD",
		"EUR",
		"GBP",
		"JPY",
		"CAD",
		"AUD",
		"CHF",
		"CNY",
		"INR",
		"BRL",
	];
	return CURRENCIES.filter((currency) => popularCodes.includes(currency.code));
};

/**
 * Get popular currency options for dropdowns
 */
export const getPopularCurrencyOptions = () => {
	return getPopularCurrencies().map((currency) => ({
		label: `${currency.name} (${currency.code})`,
		value: currency.code,
	}));
};
