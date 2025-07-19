import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { AccountRepository } from "../../repositories/AccountRepository";
import { Account } from "../../types";

export function useUpdateAccount() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateAccount = useCallback(
		async (id: number, updates: Partial<Account>) => {
			setLoading(true);
			setError(null);
			try {
				await AccountRepository.update(db, id, updates);
			} catch (e: any) {
				setError(e.message || "Failed to update account");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { updateAccount, loading, error };
}
