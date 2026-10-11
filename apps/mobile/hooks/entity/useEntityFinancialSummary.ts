import { TransactionRepository } from "../../repositories/TransactionRepository";
import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { ReceivableRepository } from "../../repositories/ReceivableRepository";
import { useQuery } from "../useQuery";

export type EntityCurrencySummary = {
	income: number;
	expenses: number;
	/** Income and expense transactions counted in `income`/`expenses`. */
	transactionCount: number;
	receivable: number;
	liabilityPaid: number;
	liabilityTotal: number;
};

/**
 * Financial summary (income/expenses within the given range, current liability
 * paid/total and active receivable) for one entity, grouped by currency. Each figure is aggregated in SQL —
 * this never loads the entity's individual transactions/liabilities/receivables.
 */
export const useEntityFinancialSummary = (
	entityId: number,
	range: { startDate: string; endDate: string }
) => {
	const { data, loading, error, refresh } = useQuery<{
		[currency: string]: EntityCurrencySummary;
	}>(
		async (db) => {
			const [transactionTotals, liabilityTotals, receivableTotals] =
				await Promise.all([
					TransactionRepository.getEntityTotalsByCurrency(
						db,
						entityId,
						range.startDate,
						range.endDate
					),
					LiabilityRepository.getTotalsByEntityAndCurrency(db, entityId),
					ReceivableRepository.getActiveTotalsByEntityAndCurrency(
						db,
						entityId
					),
				]);

			const result: { [currency: string]: EntityCurrencySummary } = {};
			const ensure = (currency: string) => {
				if (!result[currency]) {
					result[currency] = {
						income: 0,
						expenses: 0,
						transactionCount: 0,
						receivable: 0,
						liabilityPaid: 0,
						liabilityTotal: 0,
					};
				}
				return result[currency];
			};

			transactionTotals.forEach((t) => {
				const summary = ensure(t.currency);
				summary.income = t.income;
				summary.expenses = t.expenses;
				summary.transactionCount = t.count;
			});
			liabilityTotals.forEach((l) => {
				const summary = ensure(l.currency);
				summary.liabilityTotal = l.total;
				summary.liabilityPaid = l.paid;
			});
			receivableTotals.forEach((r) => {
				ensure(r.currency).receivable = r.total;
			});

			return result;
		},
		[entityId, range.startDate, range.endDate],
		{},
		"Failed to fetch entity financial summary"
	);

	return { summaries: data, loading, error, refresh };
};
