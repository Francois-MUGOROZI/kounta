import { SQLiteDatabase } from "expo-sqlite";
import { TransactionType } from "../types";

export const TransactionTypeRepository = {
	async getAll(db: SQLiteDatabase): Promise<TransactionType[]> {
		return await db.getAllAsync<TransactionType>(
			"SELECT * FROM transaction_types ORDER BY id ASC"
		);
	},

	async getById(
		db: SQLiteDatabase,
		id: number
	): Promise<TransactionType | null> {
		return await db.getFirstAsync<TransactionType>(
			"SELECT * FROM transaction_types WHERE id = ?",
			[id]
		);
	},

	async create(db: SQLiteDatabase, name: string): Promise<void> {
		await db.runAsync("INSERT INTO transaction_types (name) VALUES (?)", [
			name,
		]);
	},

	async update(db: SQLiteDatabase, id: number, name: string): Promise<void> {
		await db.runAsync("UPDATE transaction_types SET name = ? WHERE id = ?", [
			name,
			id,
		]);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM transaction_types WHERE id = ?", [id]);
	},
};
