import { AccountRepository } from "../../repositories/AccountRepository";
import { useQuery } from "../useQuery";

/**
 * Lightweight hook that returns account balance totals grouped by currency.
 * Uses a single aggregate SQL query instead of fetching all account rows.
 */
export function useAccountTotalsByCurrency() {
	const { data, loading } = useQuery<{ [currency: string]: number }>(
		async (db) => {
			const rows = await AccountRepository.getTotalsByCurrency(db);
			const map: { [currency: string]: number } = {};
			rows.forEach((r) => {
				map[r.currency] = r.total ?? 0;
			});
			return map;
		},
		[],
		{}
	);

	return { totals: data, loading };
}
