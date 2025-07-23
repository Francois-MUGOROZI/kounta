import { SQLiteDatabase } from "expo-sqlite";
import { Transaction, TransactionFilter } from "../types";

export const TransactionRepository = {
	async getAll(
		db: SQLiteDatabase,
		filter?: TransactionFilter
	): Promise<Transaction[]> {
		let query = "SELECT * FROM transactions";
		const where: string[] = [];
		const params: (string | number)[] = [];
		if (filter) {
			if (filter.transactionTypeId) {
				where.push("transaction_type_id = ?");
				params.push(filter.transactionTypeId);
			}
			if (filter.categoryId) {
				where.push("category_id = ?");
				params.push(filter.categoryId);
			}
			if (filter.startDate) {
				where.push("date >= ?");
				params.push(filter.startDate);
			}
			if (filter.endDate) {
				where.push("date <= ?");
				params.push(filter.endDate);
			}
		}
		if (where.length > 0) {
			query += " WHERE " + where.join(" AND ");
		}
		query += " ORDER BY date DESC";
		return await db.getAllAsync<Transaction>(query, params);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Transaction | null> {
		return await db.getFirstAsync<Transaction>(
			"SELECT * FROM transactions WHERE id = ?",
			[id]
		);
	},

	async create(
		db: SQLiteDatabase,
		transaction: Omit<Transaction, "id">
	): Promise<void> {
		const description: string = transaction.description ?? "";
		const amount: number =
			typeof transaction.amount === "number" ? transaction.amount : 0;
		const transaction_type_id: number =
			typeof transaction.transaction_type_id === "number"
				? transaction.transaction_type_id
				: 0;
		const date: string = transaction.date ?? new Date().toISOString();
		const account_id: number =
			typeof transaction.account_id === "number" ? transaction.account_id : 0;
		const category_id: number =
			typeof transaction.category_id === "number" ? transaction.category_id : 0;
		const asset_id: number | null = transaction.asset_id ?? null;
		const liability_id: number | null = transaction.liability_id ?? null;

		// Insert transaction
		await db.runAsync(
			`INSERT INTO transactions (description, amount, transaction_type_id, date, account_id, category_id, asset_id, liability_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				description,
				amount,
				transaction_type_id,
				date,
				account_id,
				category_id,
				asset_id,
				liability_id,
			]
		);

		// Fetch transaction type name
		const typeRow = await db.getFirstAsync<{ name: string }>(
			"SELECT name FROM transaction_types WHERE id = ?",
			[transaction_type_id]
		);
		const transactionTypeName = typeRow?.name || "";

		// Update account balance
		if (transactionTypeName === "Income") {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[amount, account_id]
			);
		} else {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[amount, account_id]
			);
		}
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Transaction>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];
		for (const key in updates) {
			const value = updates[key as keyof Transaction];
			if (value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value as string | number | null);
			}
		}
		if (fields.length === 0) return;
		values.push(id as number);
		await db.runAsync(
			`UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
	},
};
