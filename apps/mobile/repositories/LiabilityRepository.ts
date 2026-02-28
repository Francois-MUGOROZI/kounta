import { SQLiteDatabase } from "expo-sqlite";
import { Liability } from "../types";
import { emitEvent, EVENTS } from "../utils/events";

export const LiabilityRepository = {
	async getAll(db: SQLiteDatabase): Promise<Liability[]> {
		return await db.getAllAsync<Liability>(
			"SELECT * FROM liabilities ORDER BY created_at DESC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Liability | null> {
		return await db.getFirstAsync<Liability>(
			"SELECT * FROM liabilities WHERE id = ?",
			[id]
		);
	},

	async create(
		db: SQLiteDatabase,
		liability: Omit<Liability, "id">
	): Promise<void> {
		const name: string = liability.name ?? "";
		const liability_type_id: number =
			typeof liability.liability_type_id === "number"
				? liability.liability_type_id
				: 0;
		const currency: string = liability.currency ?? "";
		const total_amount: number =
			typeof liability.total_amount === "number" ? liability.total_amount : 0;
		const current_balance: number =
			typeof liability.current_balance === "number"
				? liability.current_balance
				: total_amount;
		const created_at: string = liability.created_at ?? new Date().toISOString();
		const notes: string | null = liability.notes ?? null;

		await db.runAsync(
			`INSERT INTO liabilities (name, liability_type_id, currency, total_amount, current_balance, created_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				name,
				liability_type_id,
				currency,
				total_amount,
				current_balance,
				created_at,
				notes,
			]
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Liability>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];
		for (const [key, value] of Object.entries(updates)) {
			if (key !== "id" && value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await db.runAsync(
			`UPDATE liabilities SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
