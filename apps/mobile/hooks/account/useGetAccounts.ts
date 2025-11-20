import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../database";
import { AccountRepository } from "../../repositories/AccountRepository";
import { Account } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export function useGetAccounts() {
	const db = useDatabase();
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAccounts = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await AccountRepository.getAll(db);
			setAccounts(data);
		} catch (e: any) {
			setError(e.message || "Failed to load accounts");
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		fetchAccounts();

		// Subscribe to global data changes to keep the accounts list in sync
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			fetchAccounts();
		});

		return () => {
			subscription.remove();
		};
	}, [fetchAccounts]);

	return { accounts, loading, error, refresh: fetchAccounts };
}
