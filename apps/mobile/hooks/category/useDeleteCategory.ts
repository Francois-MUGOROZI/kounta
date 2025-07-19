import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import { CategoryRepository } from "../../repositories/CategoryRepository";

export function useDeleteCategory() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const deleteCategory = useCallback(
		async (id: number) => {
			setLoading(true);
			setError(null);
			try {
				await CategoryRepository.delete(db, id);
			} catch (e: any) {
				setError(e.message || "Failed to delete category");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { deleteCategory, loading, error };
}
