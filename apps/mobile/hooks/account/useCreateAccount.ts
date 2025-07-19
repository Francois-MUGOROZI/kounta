import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { AccountRepository } from "../../repositories/AccountRepository";
import { Account } from "../../types";

export function useCreateAccount() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createAccount = useCallback(
		async (account: Omit<Account, "id">) => {
			setLoading(true);
			setError(null);
			try {
				await AccountRepository.create(db, account);
			} catch (e: any) {
				setError(e.message || "Failed to create account");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { createAccount, loading, error };
}
