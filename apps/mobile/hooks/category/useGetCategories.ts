import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../../database";
import { CategoryRepository } from "../../repositories/CategoryRepository";
import { Category } from "../../types";
import { addEventListener, EVENTS } from "../../utils/events";

export function useGetCategories() {
	const db = useDatabase();
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchCategories = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await CategoryRepository.getAll(db);
			setCategories(data);
		} catch (e: any) {
			setError(e.message || "Failed to load categories");
		} finally {
			setLoading(false);
		}
	}, [db]);

	useEffect(() => {
		fetchCategories();

		// Subscribe to global data changes to keep the categories list in sync
		const subscription = addEventListener(EVENTS.DATA_CHANGED, () => {
			fetchCategories();
		});

		return () => {
			subscription.remove();
		};
	}, [fetchCategories]);

	return { categories, loading, error, refresh: fetchCategories };
}
