import { SQLiteDatabase } from "expo-sqlite";
import { emitEvent, EVENTS } from "../utils/events";

export interface Budget {
	id: number;
	category_id: number;
	amount: number;
	period: "Monthly" | "Yearly";
	created_at: string;
}

export const BudgetRepository = {
	async getAll(db: SQLiteDatabase): Promise<Budget[]> {
		return await db.getAllAsync<Budget>(
			"SELECT * FROM budgets ORDER BY created_at DESC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Budget | null> {
		return await db.getFirstAsync<Budget>(
			"SELECT * FROM budgets WHERE id = ?",
			[id]
		);
	},

	async create(db: SQLiteDatabase, budget: Omit<Budget, "id">): Promise<void> {
		await db.runAsync(
			`INSERT INTO budgets (category_id, amount, period, created_at)
       VALUES (?, ?, ?, ?)`,
			[budget.category_id, budget.amount, budget.period, budget.created_at]
		);
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Budget>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number)[] = [];
		for (const [key, value] of Object.entries(updates)) {
			if (key !== "id" && value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await db.runAsync(
			`UPDATE budgets SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
