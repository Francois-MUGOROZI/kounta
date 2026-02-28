import { SQLiteDatabase } from "expo-sqlite";
import { LiabilityType } from "../types";
import { emitEvent, EVENTS } from "../utils/events";

export const LiabilityTypeRepository = {
	async getAll(db: SQLiteDatabase): Promise<LiabilityType[]> {
		return await db.getAllAsync<LiabilityType>(
			"SELECT * FROM liability_types ORDER BY id ASC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<LiabilityType | null> {
		return await db.getFirstAsync<LiabilityType>(
			"SELECT * FROM liability_types WHERE id = ?",
			[id]
		);
	},

	async create(db: SQLiteDatabase, name: string): Promise<void> {
		await db.runAsync("INSERT INTO liability_types (name) VALUES (?)", [name]);
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(db: SQLiteDatabase, id: number, name: string): Promise<void> {
		await db.runAsync("UPDATE liability_types SET name = ? WHERE id = ?", [
			name,
			id,
		]);
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
