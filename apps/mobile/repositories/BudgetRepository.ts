import { executeSqlAsync } from "../database";

export interface Budget {
	id: number;
	category_id: number;
	amount: number;
	period: "Monthly" | "Yearly";
	created_at: string;
}

export const BudgetRepository = {
	async getAll(): Promise<Budget[]> {
		const result = await executeSqlAsync(
			"SELECT * FROM budgets ORDER BY created_at DESC"
		);
		return result.rows?._array || [];
	},

	async getById(id: number): Promise<Budget | null> {
		const result = await executeSqlAsync("SELECT * FROM budgets WHERE id = ?", [
			id,
		]);
		return result.rows?._array?.[0] || null;
	},

	async create(budget: Omit<Budget, "id">): Promise<void> {
		await executeSqlAsync(
			`INSERT INTO budgets (category_id, amount, period, created_at)
       VALUES (?, ?, ?, ?)`,
			[budget.category_id, budget.amount, budget.period, budget.created_at]
		);
	},

	async update(id: number, updates: Partial<Budget>): Promise<void> {
		const fields = [];
		const values = [];
		for (const key in updates) {
			if (updates[key as keyof Budget] !== undefined) {
				fields.push(`${key} = ?`);
				values.push(updates[key as keyof Budget]);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await executeSqlAsync(
			`UPDATE budgets SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(id: number): Promise<void> {
		await executeSqlAsync("DELETE FROM budgets WHERE id = ?", [id]);
	},
};
