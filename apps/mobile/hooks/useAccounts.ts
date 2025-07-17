import { useEffect, useState, useCallback } from "react";
import { Account } from "../types";
import { AccountRepository } from "../repositories/AccountRepository";

export function useAccounts() {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAccounts = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await AccountRepository.getAll();
			setAccounts(data);
		} catch (e: any) {
			setError(e.message || "Failed to load accounts");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

	return { accounts, loading, error, refresh: fetchAccounts };
}
