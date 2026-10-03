import { DashboardRepository } from "../../repositories/DashboardRepository";
import { DashboardTotals } from "../../types";
import { addMonths, endOfMonth, monthRange, toLocalISODate } from "../../utils/date";
import { useQuery } from "../useQuery";

export interface Flow {
	income: number;
	expenses: number;
}

export interface HomeData {
	totals: Record<string, DashboardTotals>;
	thisMonth: Record<string, Flow>;
	/** Last month up to the same day — a fair comparison for a month in progress. */
	lastMonthToDate: Record<string, Flow>;
}

const EMPTY: HomeData = {
	totals: {},
	thisMonth: {},
	lastMonthToDate: {},
};

const byCurrency = <T extends { currency: string }>(rows: T[]) =>
	Object.fromEntries(rows.filter((r) => r.currency).map((r) => [r.currency, r]));

/** Everything the Home screen shows, loaded in one pass. */
export function useHomeData() {
	return useQuery<HomeData>(
		async (db) => {
			const now = new Date();
			const current = monthRange(now);
			const prevMonth = addMonths(now, -1);
			const previous = monthRange(prevMonth);
			const sameDayLastMonth = toLocalISODate(
				new Date(
					prevMonth.getFullYear(),
					prevMonth.getMonth(),
					Math.min(now.getDate(), endOfMonth(prevMonth).getDate())
				)
			);
			const [totals, thisMonth, lastMonthToDate] =
				await Promise.all([
					DashboardRepository.getTotalsByCurrency(db),
					DashboardRepository.getFlowByCurrency(db, current.startDate, current.endDate),
					DashboardRepository.getFlowByCurrency(db, previous.startDate, sameDayLastMonth),
				]);
			return {
				totals: byCurrency(totals),
				thisMonth: byCurrency(thisMonth),
				lastMonthToDate: byCurrency(lastMonthToDate),
			};
		},
		[],
		EMPTY,
		"Failed to load your overview"
	);
}
