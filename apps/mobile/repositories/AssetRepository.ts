import { SQLiteDatabase } from "expo-sqlite";
import { Asset } from "../types";
import { emitEvent, EVENTS } from "../utils/events";

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
		const initial_cost: number =
			typeof asset.initial_cost === "number" ? asset.initial_cost : 0;
		const contributions: number =
			typeof asset.contributions === "number" ? asset.contributions : 0;
		const reinvestments: number =
			typeof asset.reinvestments === "number" ? asset.reinvestments : 0;
		const withdrawals: number =
			typeof asset.withdrawals === "number" ? asset.withdrawals : 0;
		const current_valuation: number =
			typeof asset.current_valuation === "number" ? asset.current_valuation : 0;
		const created_at: string = asset.created_at ?? new Date().toISOString();
		const notes: string | null = asset.notes ?? null;

		await db.runAsync(
			`INSERT INTO assets (name, asset_type_id, currency, initial_cost, contributions, reinvestments, withdrawals, current_valuation, created_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				name,
				asset_type_id,
				currency,
				initial_cost,
				contributions,
				reinvestments,
				withdrawals,
				current_valuation,
				created_at,
				notes,
			]
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Pick<Asset, "name" | "asset_type_id" | "notes">>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];
		for (const [key, value] of Object.entries(updates)) {
			if (key !== "id" && value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value);
			}
		}
		if (fields.length === 0) return;
		values.push(id);
		await db.runAsync(
			`UPDATE assets SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},

	/**
	 * Update market valuation (non-transaction event).
	 * Sets current_valuation to an absolute value.
	 */
	async updateValuation(
		db: SQLiteDatabase,
		assetId: number,
		newValuation: number
	): Promise<void> {
		await db.runAsync(
			`UPDATE assets SET current_valuation = ?, current_value = ? WHERE id = ?`,
			[newValuation, newValuation, assetId]
		);
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
