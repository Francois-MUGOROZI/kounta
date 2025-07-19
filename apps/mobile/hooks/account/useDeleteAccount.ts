import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { AccountRepository } from "../../repositories/AccountRepository";

export function useDeleteAccount() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const deleteAccount = useCallback(
		async (id: number) => {
			setLoading(true);
			setError(null);
			try {
				await AccountRepository.delete(db, id);
			} catch (e: any) {
				setError(e.message || "Failed to delete account");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { deleteAccount, loading, error };
}
