import { executeSqlAsync } from "../database";

export interface AssetType {
	id: number;
	name: string;
}

export const AssetTypeRepository = {
	async getAll(): Promise<AssetType[]> {
		const result = await executeSqlAsync(
			"SELECT * FROM asset_types ORDER BY id ASC"
		);
		return result.rows?._array || [];
	},

	async getById(id: number): Promise<AssetType | null> {
		const result = await executeSqlAsync(
			"SELECT * FROM asset_types WHERE id = ?",
			[id]
		);
		return result.rows?._array?.[0] || null;
	},

	async create(name: string): Promise<void> {
		await executeSqlAsync("INSERT INTO asset_types (name) VALUES (?)", [name]);
	},

	async update(id: number, name: string): Promise<void> {
		await executeSqlAsync("UPDATE asset_types SET name = ? WHERE id = ?", [
			name,
			id,
		]);
	},

	async delete(id: number): Promise<void> {
		await executeSqlAsync("DELETE FROM asset_types WHERE id = ?", [id]);
	},
};
