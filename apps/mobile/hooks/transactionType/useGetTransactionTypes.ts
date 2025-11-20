import { useState, useEffect } from "react";
import { TransactionTypeRepository } from "../../repositories/TransactionTypeRepository";
import { useDatabase } from "../../database";
import { TransactionType } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export const useGetTransactionTypes = () => {
	const db = useDatabase();
	const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>(
		[]
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await TransactionTypeRepository.getAll(db);
			setTransactionTypes(result);
		} catch (err: any) {
			setError(err.message || "Failed to fetch transaction types");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refresh();

		// Subscribe to global data changes to keep the transaction types list in sync
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			refresh();
		});

		return () => {
			subscription.remove();
		};
	}, []);

	return { transactionTypes, loading, error, refresh };
};
