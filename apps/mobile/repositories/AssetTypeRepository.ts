import { SQLiteDatabase } from "expo-sqlite";
import { AssetType } from "../types";

export const AssetTypeRepository = {
	async getAll(db: SQLiteDatabase): Promise<AssetType[]> {
		return await db.getAllAsync<AssetType>(
			"SELECT * FROM asset_types ORDER BY id ASC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<AssetType | null> {
		return await db.getFirstAsync<AssetType>(
			"SELECT * FROM asset_types WHERE id = ?",
			[id]
		);
	},

	async create(db: SQLiteDatabase, name: string): Promise<void> {
		await db.runAsync("INSERT INTO asset_types (name) VALUES (?)", [name]);
	},

	async update(db: SQLiteDatabase, id: number, name: string): Promise<void> {
		await db.runAsync("UPDATE asset_types SET name = ? WHERE id = ?", [
			name,
			id,
		]);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM asset_types WHERE id = ?", [id]);
	},
};
