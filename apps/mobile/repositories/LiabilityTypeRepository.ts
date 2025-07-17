import { executeSqlAsync } from "../database";

export interface LiabilityType {
	id: number;
	name: string;
}

export const LiabilityTypeRepository = {
	async getAll(): Promise<LiabilityType[]> {
		const result = await executeSqlAsync(
			"SELECT * FROM liability_types ORDER BY id ASC"
		);
		return result.rows?._array || [];
	},

	async getById(id: number): Promise<LiabilityType | null> {
		const result = await executeSqlAsync(
			"SELECT * FROM liability_types WHERE id = ?",
			[id]
		);
		return result.rows?._array?.[0] || null;
	},

	async create(name: string): Promise<void> {
		await executeSqlAsync("INSERT INTO liability_types (name) VALUES (?)", [
			name,
		]);
	},

	async update(id: number, name: string): Promise<void> {
		await executeSqlAsync("UPDATE liability_types SET name = ? WHERE id = ?", [
			name,
			id,
		]);
	},

	async delete(id: number): Promise<void> {
		await executeSqlAsync("DELETE FROM liability_types WHERE id = ?", [id]);
	},
};
