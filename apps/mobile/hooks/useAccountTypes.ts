import { useEffect, useState, useCallback } from "react";
import {
	AccountTypeRepository,
	AccountType,
} from "../repositories/AccountTypeRepository";

export function useAccountTypes() {
	const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAccountTypes = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await AccountTypeRepository.getAll();
			setAccountTypes(data);
		} catch (e: any) {
			setError(e.message || "Failed to load account types");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAccountTypes();
	}, [fetchAccountTypes]);

	return { accountTypes, loading, error, refresh: fetchAccountTypes };
}
