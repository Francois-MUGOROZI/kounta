import { SQLiteDatabase } from "expo-sqlite";
import { Envelope } from "../types";
import { emitEvent, EVENTS } from "../utils/events";

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
			created_at = new Date().toISOString(),
		} = envelope;
		await db.runAsync(
			`INSERT INTO envelopes (name, total_amount, current_balance, purpose, currency, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
			[name, total_amount, current_balance, purpose, currency, created_at]
		);
		emitEvent(EVENTS.DATA_CHANGED);
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
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async addToEnvelope(
		db: SQLiteDatabase,
		envelopeId: number,
		amount: number
	): Promise<void> {
		await db.runAsync(
			`UPDATE envelopes SET total_amount = total_amount + ?, current_balance = current_balance + ? WHERE id = ?`,
			[amount, amount, envelopeId]
		);
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
