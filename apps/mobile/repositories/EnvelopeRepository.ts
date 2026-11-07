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

	/**
	 * Rebalances allocation: shrinks the source's budget and balance by `amount`
	 * and grows the target's by the same. What each envelope has spent, and the
	 * per-currency totals, stay the same. Only available (unspent) money moves.
	 */
	async move(
		db: SQLiteDatabase,
		fromId: number,
		toId: number,
		amount: number
	): Promise<void> {
		if (!(amount > 0)) throw new Error("Enter an amount greater than zero");
		if (fromId === toId) throw new Error("Choose a different envelope to move to");

		await db.execAsync("BEGIN");
		try {
			const from = await db.getFirstAsync<Envelope>("SELECT * FROM envelopes WHERE id = ?", [fromId]);
			const to = await db.getFirstAsync<Envelope>("SELECT * FROM envelopes WHERE id = ?", [toId]);
			if (!from || !to) throw new Error("Envelope not found");
			if (from.currency !== to.currency) {
				throw new Error("Money can only move between envelopes in the same currency");
			}
			const taken = await db.runAsync(
				`UPDATE envelopes SET total_amount = total_amount - ?, current_balance = current_balance - ?
				 WHERE id = ? AND current_balance >= ?`,
				[amount, amount, fromId, amount]
			);
			if (taken.changes !== 1) {
				throw new Error(`${from.name} doesn't have that much available`);
			}
			await db.runAsync(
				`UPDATE envelopes SET total_amount = total_amount + ?, current_balance = current_balance + ? WHERE id = ?`,
				[amount, amount, toId]
			);
			await db.execAsync("COMMIT");
		} catch (e) {
			await db.execAsync("ROLLBACK");
			throw e;
		}
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
