import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../database";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { ReceivableRepository } from "../../repositories/ReceivableRepository";
import { addEventListener, EVENTS } from "../../utils/events";

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
	const db = useDatabase();
	const [summaries, setSummaries] = useState<{
		[currency: string]: EntityCurrencySummary;
	}>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
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

			setSummaries(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch entity financial summary");
		} finally {
			setLoading(false);
		}
	}, [db, entityId]);

	useEffect(() => {
		refresh();
		const subscription = addEventListener(EVENTS.DATA_CHANGED, refresh);
		return () => {
			subscription.remove();
		};
	}, [refresh]);

	return { summaries, loading, error, refresh };
};
