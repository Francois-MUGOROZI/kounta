import { executeSqlAsync } from "../database";

export interface AccountType {
	id: number;
	name: string;
}

export const AccountTypeRepository = {
	async getAll(): Promise<AccountType[]> {
		const result = await executeSqlAsync(
			"SELECT * FROM account_types ORDER BY id ASC"
		);
		return result.rows?._array || [];
	},

	async getById(id: number): Promise<AccountType | null> {
		const result = await executeSqlAsync(
			"SELECT * FROM account_types WHERE id = ?",
			[id]
		);
		return result.rows?._array?.[0] || null;
	},

	async create(name: string): Promise<void> {
		await executeSqlAsync("INSERT INTO account_types (name) VALUES (?)", [
			name,
		]);
	},

	async update(id: number, name: string): Promise<void> {
		await executeSqlAsync("UPDATE account_types SET name = ? WHERE id = ?", [
			name,
			id,
		]);
	},

	async delete(id: number): Promise<void> {
		await executeSqlAsync("DELETE FROM account_types WHERE id = ?", [id]);
	},
};
