import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { AccountTypeRepository } from "../../repositories/AccountTypeRepository";

export function useCreateAccountType() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createAccountType = useCallback(
		async (name: string) => {
			setLoading(true);
			setError(null);
			try {
				await AccountTypeRepository.create(db, name);
			} catch (e: any) {
				setError(e.message || "Failed to create account type");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { createAccountType, loading, error };
}
