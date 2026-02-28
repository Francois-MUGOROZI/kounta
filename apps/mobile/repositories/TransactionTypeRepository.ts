import { SQLiteDatabase } from "expo-sqlite";
import { TransactionType } from "../types";
import { emitEvent, EVENTS } from "../utils/events";

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
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(db: SQLiteDatabase, id: number, name: string): Promise<void> {
		await db.runAsync("UPDATE transaction_types SET name = ? WHERE id = ?", [
			name,
			id,
		]);
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
