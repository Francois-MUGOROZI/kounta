import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../database";
import { AccountTypeRepository } from "../../repositories/AccountTypeRepository";
import { AccountType } from "../../types";

export function useGetAccountTypes() {
	const db = useDatabase();
	const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAccountTypes = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await AccountTypeRepository.getAll(db);
			setAccountTypes(data);
		} catch (e: any) {
			setError(e.message || "Failed to load account types");
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		fetchAccountTypes();
	}, [fetchAccountTypes]);

	return { accountTypes, loading, error, refresh: fetchAccountTypes };
}
