import { SQLiteDatabase } from "expo-sqlite";
import { Entity } from "../types";
import { emitEvent, EVENTS } from "../utils/events";

export const EntityRepository = {
	async getAll(db: SQLiteDatabase): Promise<Entity[]> {
		return await db.getAllAsync<Entity>(
			"SELECT * FROM entities ORDER BY created_at DESC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Entity | null> {
		return await db.getFirstAsync<Entity>(
			"SELECT * FROM entities WHERE id = ?",
			[id]
		);
	},

	async create(
		db: SQLiteDatabase,
		entity: Omit<Entity, "id">
	): Promise<void> {
		const name = entity.name ?? "";
		const phone_number = entity.phone_number ?? null;
		const is_individual = entity.is_individual ? 1 : 0;
		const id_number = entity.id_number ?? null;
		const metadata = entity.metadata ?? null;
		const created_at = entity.created_at ?? new Date().toISOString();

		await db.runAsync(
			`INSERT INTO entities (name, phone_number, is_individual, id_number, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
			[name, phone_number, is_individual, id_number, metadata, created_at]
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Entity>
	): Promise<void> {
		const ALLOWED_COLUMNS = new Set(["name", "phone_number", "is_individual", "id_number", "metadata"]);
		const fields: string[] = [];
		const values: (string | number | null)[] = [];
		for (const [key, value] of Object.entries(updates)) {
			if (!ALLOWED_COLUMNS.has(key) || value === undefined) continue;
			fields.push(`${key} = ?`);
			if (typeof value === "boolean") {
				values.push(value ? 1 : 0);
			} else {
				values.push(value as string | number | null);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await db.runAsync(
			`UPDATE entities SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
