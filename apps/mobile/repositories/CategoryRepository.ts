import { useDatabase } from "../database";
import React from "react";

export interface Category {
	id: number;
	name: string;
	transaction_type_id: number;
	created_at: string;
}

export const CategoryRepository = {
	useGetAll() {
		const db = useDatabase();
		const [categories, setCategories] = React.useState<Category[]>([]);
		const [loading, setLoading] = React.useState(true);
		const [error, setError] = React.useState<string | null>(null);

		const fetchCategories = React.useCallback(async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await db.getAllAsync<Category>(
					"SELECT * FROM categories ORDER BY created_at DESC"
				);
				setCategories(result);
			} catch (e: any) {
				setError(e.message || "Failed to load categories");
			} finally {
				setLoading(false);
			}
		}, [db]);

		React.useEffect(() => {
			fetchCategories();
		}, [fetchCategories]);

		return { categories, loading, error, refresh: fetchCategories };
	},

	useGetById(id: number) {
		const db = useDatabase();
		const [category, setCategory] = React.useState<Category | null>(null);
		const [loading, setLoading] = React.useState(true);
		const [error, setError] = React.useState<string | null>(null);

		const fetchCategory = React.useCallback(async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await db.getFirstAsync<Category>(
					"SELECT * FROM categories WHERE id = ?",
					[id]
				);
				setCategory(result);
			} catch (e: any) {
				setError(e.message || "Failed to load category");
			} finally {
				setLoading(false);
			}
		}, [db, id]);

		React.useEffect(() => {
			fetchCategory();
		}, [fetchCategory]);

		return { category, loading, error, refresh: fetchCategory };
	},

	async create(db: any, category: Omit<Category, "id">): Promise<void> {
		await db.runAsync(
			`INSERT INTO categories (name, transaction_type_id, created_at)
       VALUES (?, ?, ?)`,
			[category.name, category.transaction_type_id, category.created_at]
		);
	},

	async update(db: any, id: number, updates: Partial<Category>): Promise<void> {
		const fields = [];
		const values = [];
		for (const key in updates) {
			if (updates[key as keyof Category] !== undefined) {
				fields.push(`${key} = ?`);
				values.push(updates[key as keyof Category]);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await db.runAsync(
			`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(db: any, id: number): Promise<void> {
		await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
	},
};
