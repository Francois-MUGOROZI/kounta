import { SQLiteDatabase } from "expo-sqlite";
import { Envelope } from "../types";

export const EnvelopeRepository = {
	async getAll(db: SQLiteDatabase): Promise<Envelope[]> {
		return await db.getAllAsync<Envelope>(
			"SELECT * FROM envelopes ORDER BY name ASC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Envelope | null> {
		return await db.getFirstAsync<Envelope>(
			"SELECT * FROM envelopes WHERE id = ?",
			[id]
		);
	},

	async create(
		db: SQLiteDatabase,
		envelope: Omit<Envelope, "id">
	): Promise<void> {
		const {
			name,
			total_amount,
			current_balance,
			purpose = "",
			currency,
		} = envelope;
		await db.runAsync(
			`INSERT INTO envelopes (name, total_amount, current_balance, purpose, currency) VALUES (?, ?, ?, ?, ?)`,
			[name, total_amount, current_balance, purpose, currency]
		);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Omit<Envelope, "id">>
	): Promise<void> {
		const fields = Object.keys(updates);
		if (fields.length === 0) return;
		const setClause = fields.map((f) => `${f} = ?`).join(", ");
		const values = fields.map((f) => (updates as any)[f]);
		values.push(id);
		await db.runAsync(`UPDATE envelopes SET ${setClause} WHERE id = ?`, values);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM envelopes WHERE id = ?", [id]);
	},
};
