import { SQLiteDatabase } from "expo-sqlite";
import { Receivable, ReceivableStatus } from "../types";
import { emitEvent, EVENTS } from "../utils/events";

export const ReceivableRepository = {
	async getAll(
		db: SQLiteDatabase,
		filter?: { status?: ReceivableStatus; entityId?: number },
	): Promise<Receivable[]> {
		let query = "SELECT * FROM receivables";
		const where: string[] = [];
		const params: (string | number)[] = [];

		if (filter?.status) {
			where.push("status = ?");
			params.push(filter.status);
		}
		if (filter?.entityId) {
			where.push("entity_id = ?");
			params.push(filter.entityId);
		}
		if (where.length > 0) {
			query += " WHERE " + where.join(" AND ");
		}
		query += " ORDER BY created_at DESC";
		return await db.getAllAsync<Receivable>(query, params);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Receivable | null> {
		return await db.getFirstAsync<Receivable>(
			"SELECT * FROM receivables WHERE id = ?",
			[id],
		);
	},

	async getByEntityId(
		db: SQLiteDatabase,
		entityId: number,
	): Promise<Receivable[]> {
		return await db.getAllAsync<Receivable>(
			"SELECT * FROM receivables WHERE entity_id = ? ORDER BY created_at DESC",
			[entityId],
		);
	},

	async create(
		db: SQLiteDatabase,
		receivable: Omit<Receivable, "id">,
	): Promise<void> {
		const entity_id = receivable.entity_id;
		const title = receivable.title ?? "";
		const type = receivable.type ?? "IOU";
		const currency = receivable.currency ?? "";
		const principal =
			typeof receivable.principal === "number" ? receivable.principal : 0;
		const interest_rate =
			typeof receivable.interest_rate === "number"
				? receivable.interest_rate
				: 0;
		const requires_outflow = receivable.requires_outflow ? 1 : 0;
		// Outflow types start at 0 balance and Pending; others start at principal and Active
		const current_balance = requires_outflow ? 0 : principal;
		const status = requires_outflow ? "Pending" : "Active";
		const due_date = receivable.due_date ?? null;
		const notes = receivable.notes ?? null;
		const created_at = receivable.created_at ?? new Date().toISOString();

		await db.runAsync(
			`INSERT INTO receivables (entity_id, title, type, currency, principal, interest_rate, current_balance, status, requires_outflow, due_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				entity_id,
				title,
				type,
				currency,
				principal,
				interest_rate,
				current_balance,
				status,
				requires_outflow,
				due_date,
				notes,
				created_at,
			],
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Receivable>,
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];
		for (const [key, value] of Object.entries(updates)) {
			if (key !== "id" && value !== undefined) {
				fields.push(`${key} = ?`);
				// Convert boolean to int for SQLite
				if (typeof value === "boolean") {
					values.push(value ? 1 : 0);
				} else {
					values.push(value);
				}
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await db.runAsync(
			`UPDATE receivables SET ${fields.join(", ")} WHERE id = ?`,
			values,
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async writeOff(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync(
			"UPDATE receivables SET status = 'Written-Off' WHERE id = ?",
			[id],
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
