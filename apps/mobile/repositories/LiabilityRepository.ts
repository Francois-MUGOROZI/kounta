import { executeSqlAsync } from "../database";
import { Liability } from "../types";

export const LiabilityRepository = {
	async getAll(): Promise<Liability[]> {
		const result = await executeSqlAsync(
			"SELECT * FROM liabilities ORDER BY created_at DESC"
		);
		return result.rows?._array || [];
	},

	async getById(id: number): Promise<Liability | null> {
		const result = await executeSqlAsync(
			"SELECT * FROM liabilities WHERE id = ?",
			[id]
		);
		return result.rows?._array?.[0] || null;
	},

	async create(liability: Omit<Liability, "id">): Promise<void> {
		await executeSqlAsync(
			`INSERT INTO liabilities (name, type_id, currency, total_amount, current_balance, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
			[
				liability.name,
				liability.type_id,
				liability.currency,
				liability.total_amount,
				liability.current_balance,
				liability.created_at instanceof Date
					? liability.created_at.toISOString()
					: liability.created_at,
			]
		);
	},

	async update(id: number, updates: Partial<Liability>): Promise<void> {
		const fields = [];
		const values = [];
		for (const key in updates) {
			if (updates[key as keyof Liability] !== undefined) {
				fields.push(`${key} = ?`);
				values.push(updates[key as keyof Liability]);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await executeSqlAsync(
			`UPDATE liabilities SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(id: number): Promise<void> {
		await executeSqlAsync("DELETE FROM liabilities WHERE id = ?", [id]);
	},
};
