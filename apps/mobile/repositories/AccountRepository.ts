import { executeSqlAsync } from "../database";
import { Account } from "../types";

export const AccountRepository = {
	async getAll(): Promise<Account[]> {
		const result = await executeSqlAsync(
			"SELECT * FROM accounts ORDER BY created_at DESC"
		);
		return result.rows?._array || [];
	},

	async getById(id: number): Promise<Account | null> {
		const result = await executeSqlAsync(
			"SELECT * FROM accounts WHERE id = ?",
			[id]
		);
		return result.rows?._array?.[0] || null;
	},

	async create(account: Omit<Account, "id">): Promise<void> {
		await executeSqlAsync(
			`INSERT INTO accounts (name, type_id, currency, opening_balance, current_balance, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
			[
				account.name,
				account.type_id,
				account.currency,
				account.opening_balance,
				account.current_balance ?? account.opening_balance,
				account.created_at instanceof Date
					? account.created_at.toISOString()
					: account.created_at,
			]
		);
	},

	async update(id: number, updates: Partial<Account>): Promise<void> {
		const fields = [];
		const values = [];
		for (const key in updates) {
			if (updates[key as keyof Account] !== undefined) {
				fields.push(`${key} = ?`);
				values.push(updates[key as keyof Account]);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await executeSqlAsync(
			`UPDATE accounts SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(id: number): Promise<void> {
		await executeSqlAsync("DELETE FROM accounts WHERE id = ?", [id]);
	},
};
