import { TransactionRepository } from "../../repositories/TransactionRepository";
import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { ReceivableRepository } from "../../repositories/ReceivableRepository";
import { useQuery } from "../useQuery";

export type EntityCurrencySummary = {
	income: number;
	expenses: number;
	receivable: number;
	liabilityPaid: number;
	liabilityTotal: number;
};

/**
 * Financial summary (income/expenses, liability paid/total, active receivable)
 * for one entity, grouped by currency. Each figure is aggregated in SQL —
 * this never loads the entity's individual transactions/liabilities/receivables.
 */
export const useEntityFinancialSummary = (entityId: number) => {
	const { data, loading, error, refresh } = useQuery<{
		[currency: string]: EntityCurrencySummary;
	}>(
		async (db) => {
			const [transactionTotals, liabilityTotals, receivableTotals] =
				await Promise.all([
					TransactionRepository.getEntityTotalsByCurrency(db, entityId),
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
		[entityId],
		{},
		"Failed to fetch entity financial summary"
	);

	return { summaries: data, loading, error, refresh };
};
