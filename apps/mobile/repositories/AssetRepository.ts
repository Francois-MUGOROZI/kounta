import { SQLiteDatabase } from "expo-sqlite";
import { Asset } from "../types";

export const AssetRepository = {
	async getAll(db: SQLiteDatabase): Promise<Asset[]> {
		return await db.getAllAsync<Asset>(
			"SELECT * FROM assets ORDER BY created_at DESC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Asset | null> {
		return await db.getFirstAsync<Asset>("SELECT * FROM assets WHERE id = ?", [
			id,
		]);
	},

	async create(db: SQLiteDatabase, asset: Omit<Asset, "id">): Promise<void> {
		const name: string = asset.name ?? "";
		const asset_type_id: number =
			typeof asset.asset_type_id === "number" ? asset.asset_type_id : 0;
		const currency: string = asset.currency ?? "";
		const initial_value: number =
			typeof asset.initial_value === "number" ? asset.initial_value : 0;
		const current_value: number =
			typeof asset.current_value === "number" ? asset.current_value : 0;
		const created_at: string = asset.created_at ?? new Date().toISOString();
		const notes: string | null = asset.notes ?? null;

		await db.runAsync(
			`INSERT INTO assets (name, asset_type_id, currency, initial_value, current_value, created_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				name,
				asset_type_id,
				currency,
				initial_value,
				current_value,
				created_at,
				notes,
			]
		);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Asset>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];
		for (const key in updates) {
			const value = updates[key as keyof Asset];
			if (value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value as string | number | null);
			}
		}
		if (fields.length === 0) return;
		values.push(id as number);
		await db.runAsync(
			`UPDATE assets SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM assets WHERE id = ?", [id]);
	},
};
