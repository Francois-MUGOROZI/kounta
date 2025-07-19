import { SQLiteDatabase } from "expo-sqlite";
import { Liability } from "../types";

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
				: 0;
		const created_at: string = liability.created_at ?? new Date().toISOString();
		const notes: string | null = liability.notes ?? null;

		await db.runAsync(
			`INSERT INTO liabilities (name, liability_type_id, currency, total_amount, current_balance, created_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Liability>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];
		for (const key in updates) {
			const value = updates[key as keyof Liability];
			if (value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value as string | number | null);
			}
		}
		if (fields.length === 0) return;
		values.push(id as number);
		await db.runAsync(
			`UPDATE liabilities SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM liabilities WHERE id = ?", [id]);
	},
};
