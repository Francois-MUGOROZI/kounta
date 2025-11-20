import { SQLiteDatabase } from "expo-sqlite";
import { emitEvent, EVENTS } from "../utils/events";

export interface SavingsGoal {
	id: number;
	name: string;
	target_amount: number;
	current_amount: number;
	target_date?: string | null;
	created_at: string;
}

export const SavingsGoalRepository = {
	async getAll(db: SQLiteDatabase): Promise<SavingsGoal[]> {
		return await db.getAllAsync<SavingsGoal>(
			"SELECT * FROM savings_goals ORDER BY created_at DESC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<SavingsGoal | null> {
		return await db.getFirstAsync<SavingsGoal>(
			"SELECT * FROM savings_goals WHERE id = ?",
			[id]
		);
	},

	async create(
		db: SQLiteDatabase,
		goal: Omit<SavingsGoal, "id">
	): Promise<void> {
		await db.runAsync(
			`INSERT INTO savings_goals (name, target_amount, current_amount, target_date, created_at)
       VALUES (?, ?, ?, ?)`,
			[
				goal.name,
				goal.target_amount,
				goal.current_amount,
				goal.target_date ?? null,
				goal.created_at,
			]
		);
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<SavingsGoal>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];
		for (const key in updates) {
			const value = updates[key as keyof SavingsGoal];
			if (value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await db.runAsync(
			`UPDATE savings_goals SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM savings_goals WHERE id = ?", [id]);
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
