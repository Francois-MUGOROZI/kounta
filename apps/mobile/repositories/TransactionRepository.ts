import { executeSqlAsync } from "../database";
import { Transaction } from "../types";

export const TransactionRepository = {
	async getAll(): Promise<Transaction[]> {
		const result = await executeSqlAsync(
			"SELECT * FROM transactions ORDER BY date DESC"
		);
		return result.rows?._array || [];
	},

	async getById(id: number): Promise<Transaction | null> {
		const result = await executeSqlAsync(
			"SELECT * FROM transactions WHERE id = ?",
			[id]
		);
		return result.rows?._array?.[0] || null;
	},

	async create(transaction: Omit<Transaction, "id">): Promise<void> {
		await executeSqlAsync(
			`INSERT INTO transactions (description, amount, type_id, date, account_id, category_id, asset_id, liability_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				transaction.description,
				transaction.amount,
				transaction.type_id,
				transaction.date instanceof Date
					? transaction.date.toISOString()
					: transaction.date,
				transaction.account_id,
				transaction.category_id,
				transaction.asset_id ?? null,
				transaction.liability_id ?? null,
			]
		);
	},

	async update(id: number, updates: Partial<Transaction>): Promise<void> {
		const fields = [];
		const values = [];
		for (const key in updates) {
			if (updates[key as keyof Transaction] !== undefined) {
				fields.push(`${key} = ?`);
				values.push(updates[key as keyof Transaction]);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await executeSqlAsync(
			`UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(id: number): Promise<void> {
		await executeSqlAsync("DELETE FROM transactions WHERE id = ?", [id]);
	},
};
