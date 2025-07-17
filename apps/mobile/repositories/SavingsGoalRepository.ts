import { executeSqlAsync } from "../database";

export interface SavingsGoal {
	id: number;
	name: string;
	target_amount: number;
	current_amount: number;
	target_date?: string | null;
	created_at: string;
}

export const SavingsGoalRepository = {
	async getAll(): Promise<SavingsGoal[]> {
		const result = await executeSqlAsync(
			"SELECT * FROM savings_goals ORDER BY created_at DESC"
		);
		return result.rows?._array || [];
	},

	async getById(id: number): Promise<SavingsGoal | null> {
		const result = await executeSqlAsync(
			"SELECT * FROM savings_goals WHERE id = ?",
			[id]
		);
		return result.rows?._array?.[0] || null;
	},

	async create(goal: Omit<SavingsGoal, "id">): Promise<void> {
		await executeSqlAsync(
			`INSERT INTO savings_goals (name, target_amount, current_amount, target_date, created_at)
       VALUES (?, ?, ?, ?, ?)`,
			[
				goal.name,
				goal.target_amount,
				goal.current_amount,
				goal.target_date ?? null,
				goal.created_at,
			]
		);
	},

	async update(id: number, updates: Partial<SavingsGoal>): Promise<void> {
		const fields = [];
		const values = [];
		for (const key in updates) {
			if (updates[key as keyof SavingsGoal] !== undefined) {
				fields.push(`${key} = ?`);
				values.push(updates[key as keyof SavingsGoal]);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await executeSqlAsync(
			`UPDATE savings_goals SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(id: number): Promise<void> {
		await executeSqlAsync("DELETE FROM savings_goals WHERE id = ?", [id]);
	},
};
