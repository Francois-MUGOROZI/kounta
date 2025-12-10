import {
	addDays,
	format,
	addYears,
	addMonths,
	addQuarters,
	addWeeks,
} from "date-fns";
import { BillFrequency } from "../types";

export const generateBillName = (
	dueDate: string,
	billRuleName: string,
	frequency: BillFrequency
) => {
	const monthName = format(dueDate, "MMM yyyy"); // e.g., "Sep 2025"
	const yearName = format(dueDate, "yyyy"); // e.g., "2025"

	switch (frequency) {
		case "Monthly":
			return `${billRuleName} - ${monthName}`;

		case "Yearly":
			return `${billRuleName} - ${yearName}`;

		case "Weekly":
			return `${billRuleName} - ${format(dueDate, "iii, dd MMM")}`;

		case "Quarterly":
			// Custom helper to get Q1/Q2/etc.
			const quarter = Math.floor((new Date(dueDate).getMonth() + 3) / 3);
			return `${billRuleName} - Q${quarter} ${yearName}`;

		default:
			return billRuleName; // Fallback
	}
};

export const getNextDueDate = (dueDate: string, frequency: BillFrequency) => {
	const baseDate = new Date(dueDate);
	switch (frequency) {
		case "Monthly":
			return addMonths(baseDate, 1);
		case "Yearly":
			return addYears(baseDate, 1);
		case "Quarterly":
			return addQuarters(baseDate, 1);
		case "Weekly":
			return addWeeks(baseDate, 1);
		case "OneTime":
			return baseDate;
		default:
			return baseDate;
	}
};
