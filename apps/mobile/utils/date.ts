/**
 * Date helpers. Transaction dates are calendar days, so they are stored as
 * local "YYYY-MM-DD" strings. Older rows may hold a full UTC ISO timestamp
 * (from the previous date picker); `parseLocalDate` and `LOCAL_DAY_SQL`
 * normalise both shapes to the user's local calendar day.
 */

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

// Formatted by hand: Hermes' Intl output for en-GB/en-US is inconsistent on Android
// (e.g. the month is sometimes dropped), and these labels must be predictable.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const monthName = (date: Date) => MONTHS[date.getMonth()];

/** Local calendar day of `date` as "YYYY-MM-DD" (no UTC shift). */
export const toLocalISODate = (date: Date = new Date()): string =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Parses a stored date: date-only strings become local midnight. */
export const parseLocalDate = (value: string | null | undefined): Date => {
	if (!value) return new Date(NaN);
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (match) {
		return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	}
	return new Date(value);
};

/** Normalises a stored date to its local "YYYY-MM-DD" day. */
export const toDayKey = (value: string): string =>
	toLocalISODate(parseLocalDate(value));

/**
 * SQL expression giving the local calendar day of a date column, for both
 * date-only values and legacy UTC timestamps.
 */
export const LOCAL_DAY_SQL = (column: string) =>
	`(CASE WHEN length(${column}) > 10 THEN date(${column}, 'localtime') ELSE ${column} END)`;

export const startOfMonth = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const addMonths = (date: Date, months: number) =>
	new Date(date.getFullYear(), date.getMonth() + months, 1);

export const isSameMonth = (a: Date, b: Date) =>
	a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/** { startDate, endDate } as local day strings for the month containing `date`. */
export const monthRange = (date: Date) => ({
	startDate: toLocalISODate(startOfMonth(date)),
	endDate: toLocalISODate(endOfMonth(date)),
});

export const formatMonthYear = (date: Date) =>
	`${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

/** "Today", "Yesterday", or e.g. "Mon, 29 Sep" (year added when not current). */
export const formatDayHeading = (dayKey: string): string => {
	const date = parseLocalDate(dayKey);
	const today = new Date();
	const todayKey = toLocalISODate(today);
	const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
	if (dayKey === todayKey) return "Today";
	if (dayKey === toLocalISODate(yesterday)) return "Yesterday";
	const base = `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
	return date.getFullYear() !== today.getFullYear() ? `${base} ${date.getFullYear()}` : base;
};

/** Short date, e.g. "29 Sep 2026". */
export const formatShortDate = (value: string | Date): string => {
	const date = typeof value === "string" ? parseLocalDate(value) : value;
	if (isNaN(date.getTime())) return "—";
	return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
};

/** Medium date, e.g. "Sat, 3 Oct 2026". */
export const formatMediumDate = (value: string | Date): string => {
	const date = typeof value === "string" ? parseLocalDate(value) : value;
	if (isNaN(date.getTime())) return "—";
	return `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
};

/** Long date, e.g. "Monday, 29 September 2026". */
export const formatLongDate = (value: string | Date): string => {
	const date = typeof value === "string" ? parseLocalDate(value) : value;
	if (isNaN(date.getTime())) return "—";
	return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

/** Whole days from today until `value` (negative when in the past). */
export const daysUntil = (value: string): number => {
	const target = parseLocalDate(toDayKey(value));
	const today = parseLocalDate(toLocalISODate());
	return Math.round((target.getTime() - today.getTime()) / 86_400_000);
};

export const greeting = (date: Date = new Date()) => {
	const h = date.getHours();
	if (h < 12) return "Good morning";
	if (h < 18) return "Good afternoon";
	return "Good evening";
};
