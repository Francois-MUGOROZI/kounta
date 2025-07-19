import { SQLiteDatabase } from "expo-sqlite";
import { AccountType } from "../types";

export const AccountTypeRepository = {
	async getAll(db: SQLiteDatabase): Promise<AccountType[]> {
		return await db.getAllAsync<AccountType>(
			"SELECT * FROM account_types ORDER BY id ASC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<AccountType | null> {
		return await db.getFirstAsync<AccountType>(
			"SELECT * FROM account_types WHERE id = ?",
			[id]
		);
	},

	async create(db: SQLiteDatabase, name: string): Promise<void> {
		await db.runAsync("INSERT INTO account_types (name) VALUES (?)", [name]);
	},

	async update(db: SQLiteDatabase, id: number, name: string): Promise<void> {
		await db.runAsync("UPDATE account_types SET name = ? WHERE id = ?", [
			name,
			id,
		]);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM account_types WHERE id = ?", [id]);
	},
};
