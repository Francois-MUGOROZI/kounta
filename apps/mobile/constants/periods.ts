import type { Option } from "../components/ui/Dropdown";
import { addMonths, monthRange } from "../utils/date";

export type Period = "this-month" | "last-month" | "this-year" | "all";

export const PERIOD_OPTIONS: Option<Period>[] = [
	{ value: "this-month", label: "This month", icon: "calendar-today" },
	{ value: "last-month", label: "Last month", icon: "calendar-arrow-left" },
	{ value: "this-year", label: "This year", icon: "calendar-range" },
	{ value: "all", label: "All time", icon: "infinity" },
];

export const periodLabel = (period: Period) => PERIOD_OPTIONS.find((p) => p.value === period)!.label;

/** Inclusive { startDate, endDate } local day strings covering `period`. */
export const periodRange = (period: Period) => {
	const now = new Date();
	switch (period) {
		case "this-month":
			return monthRange(now);
		case "last-month":
			return monthRange(addMonths(now, -1));
		case "this-year":
			return { startDate: `${now.getFullYear()}-01-01`, endDate: `${now.getFullYear()}-12-31` };
		default:
			return { startDate: "0000-01-01", endDate: "9999-12-31" };
	}
};
