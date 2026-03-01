/**
 * Calculate percentage change between a base value and current value.
 * Returns null if base is 0 (to avoid division by zero / meaningless percentage).
 */
export function calcPercentChange(
	current: number,
	base: number
): number | null {
	if (base === 0) return null;
	return ((current - base) / base) * 100;
}

/**
 * Format a percentage value with sign and 1 decimal place.
 * e.g. "+12.5%" or "-3.2%"
 */
export function formatPercent(value: number | null): string | null {
	if (value === null) return null;
	const sign = value >= 0 ? "+" : "";
	return `${sign}${value.toFixed(1)}%`;
}
