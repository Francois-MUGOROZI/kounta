import { SQLiteDatabase } from "expo-sqlite";
import { Account } from "../types";

export const AccountRepository = {
	async getAll(db: SQLiteDatabase): Promise<Account[]> {
		return await db.getAllAsync<Account>(
			"SELECT * FROM accounts ORDER BY created_at DESC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Account | null> {
		return await db.getFirstAsync<Account>(
			"SELECT * FROM accounts WHERE id = ?",
			[id]
		);
	},

	async create(
		db: SQLiteDatabase,
		account: Omit<Account, "id">
	): Promise<void> {
		const name: string = account.name ?? "";
		const account_number: string | null = account.account_number ?? null;
		const account_type_id: number =
			typeof account.account_type_id === "number" ? account.account_type_id : 0;
		const currency: string = account.currency ?? "";
		const opening_balance: number =
			typeof account.opening_balance === "number" ? account.opening_balance : 0;
		const current_balance: number =
			typeof account.current_balance === "number" ? account.current_balance : 0;
		const created_at: string = account.created_at ?? new Date().toISOString();
		await db.runAsync(
			`INSERT INTO accounts (name, account_number, account_type_id, currency, opening_balance, current_balance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				name,
				account_number,
				account_type_id,
				currency,
				opening_balance,
				current_balance,
				created_at,
			]
		);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Account>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];
		for (const key in updates) {
			const value = updates[key as keyof Account];
			if (value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value as string | number | null);
			}
		}
		if (fields.length === 0) return;
		values.push(id as number);
		await db.runAsync(
			`UPDATE accounts SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM accounts WHERE id = ?", [id]);
	},
};
