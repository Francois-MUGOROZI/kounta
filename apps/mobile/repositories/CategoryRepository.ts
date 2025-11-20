import { SQLiteDatabase } from "expo-sqlite";
import { Category } from "../types";
import { emitEvent, EVENTS } from "../utils/events";

export const CategoryRepository = {
	async getAll(db: SQLiteDatabase): Promise<Category[]> {
		return await db.getAllAsync<Category>(
			"SELECT * FROM categories ORDER BY created_at DESC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Category | null> {
		return await db.getFirstAsync<Category>(
			"SELECT * FROM categories WHERE id = ?",
			[id]
		);
	},

	async create(
		db: SQLiteDatabase,
		category: Omit<Category, "id">
	): Promise<void> {
		const name: string = category.name ?? "";
		const transaction_type_id: number =
			typeof category.transaction_type_id === "number"
				? category.transaction_type_id
				: 0;
		const created_at: string = category.created_at ?? new Date().toISOString();
		await db.runAsync(
			`INSERT INTO categories (name, transaction_type_id, created_at) VALUES (?, ?, ?)`,
			[name as string, transaction_type_id as number, created_at as string]
		);
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Category>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number)[] = [];
		for (const key in updates) {
			const value = updates[key as keyof Category];
			if (value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value as string | number);
			}
		}
		if (fields.length === 0) return;
		values.push(id as number);
		await db.runAsync(
			`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
