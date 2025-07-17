import { executeSqlAsync } from "../database";
import { Asset } from "../types";

export const AssetRepository = {
	async getAll(): Promise<Asset[]> {
		const result = await executeSqlAsync(
			"SELECT * FROM assets ORDER BY created_at DESC"
		);
		return result.rows?._array || [];
	},

	async getById(id: number): Promise<Asset | null> {
		const result = await executeSqlAsync("SELECT * FROM assets WHERE id = ?", [
			id,
		]);
		return result.rows?._array?.[0] || null;
	},

	async create(asset: Omit<Asset, "id">): Promise<void> {
		await executeSqlAsync(
			`INSERT INTO assets (name, type_id, currency, initial_value, current_value, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
			[
				asset.name,
				asset.type_id,
				asset.currency,
				asset.initial_value,
				asset.current_value,
				asset.created_at instanceof Date
					? asset.created_at.toISOString()
					: asset.created_at,
			]
		);
	},

	async update(id: number, updates: Partial<Asset>): Promise<void> {
		const fields = [];
		const values = [];
		for (const key in updates) {
			if (updates[key as keyof Asset] !== undefined) {
				fields.push(`${key} = ?`);
				values.push(updates[key as keyof Asset]);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await executeSqlAsync(
			`UPDATE assets SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(id: number): Promise<void> {
		await executeSqlAsync("DELETE FROM assets WHERE id = ?", [id]);
	},
};
