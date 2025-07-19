import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { AccountTypeRepository } from "../../repositories/AccountTypeRepository";

export function useDeleteAccountType() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const deleteAccountType = useCallback(
		async (id: number) => {
			setLoading(true);
			setError(null);
			try {
				await AccountTypeRepository.delete(db, id);
			} catch (e: any) {
				setError(e.message || "Failed to delete account type");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { deleteAccountType, loading, error };
}
