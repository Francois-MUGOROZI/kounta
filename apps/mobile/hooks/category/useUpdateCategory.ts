import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import {
	CategoryRepository,
	Category,
} from "../../repositories/CategoryRepository";

export function useUpdateCategory() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateCategory = useCallback(
		async (id: number, updates: Partial<Category>) => {
			setLoading(true);
			setError(null);
			try {
				await CategoryRepository.update(db, id, updates);
			} catch (e: any) {
				setError(e.message || "Failed to update category");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { updateCategory, loading, error };
}
