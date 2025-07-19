import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { AccountTypeRepository } from "../../repositories/AccountTypeRepository";

export function useUpdateAccountType() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateAccountType = useCallback(
		async (id: number, name: string) => {
			setLoading(true);
			setError(null);
			try {
				await AccountTypeRepository.update(db, id, name);
			} catch (e: any) {
				setError(e.message || "Failed to update account type");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { updateAccountType, loading, error };
}
