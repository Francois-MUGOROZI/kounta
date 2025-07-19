import { useState, useCallback } from "react";
import { useDatabase } from "../../database";
import {
	CategoryRepository,
	Category,
} from "../../repositories/CategoryRepository";

export function useCreateCategory() {
	const db = useDatabase();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createCategory = useCallback(
		async (category: Omit<Category, "id">) => {
			setLoading(true);
			setError(null);
			try {
				await CategoryRepository.create(db, category);
			} catch (e: any) {
				setError(e.message || "Failed to create category");
			} finally {
				setLoading(false);
			}
		},
		[db]
	);

	return { createCategory, loading, error };
}
