import { SQLiteDatabase } from "expo-sqlite";
import { Transaction, TransactionFilter } from "../types";
import { emitEvent, EVENTS } from "../utils/events";
import { BillsRepository } from "./BillsRepository";

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
	): Promise<number> {
		const {
			description = "",
			amount = 0,
			transaction_type_id = 0,
			date = new Date().toISOString(),
			category_id = null,
			asset_id = null,
			liability_id = null,
			from_account_id = null,
			to_account_id = null,
			envelope_id = null,
			bill_id = null,
		} = transaction;

		// Insert transaction
		const result = await db.runAsync(
			`INSERT INTO transactions (description, amount, transaction_type_id, date, category_id, asset_id, liability_id, from_account_id, to_account_id, envelope_id, bill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				description,
				amount,
				transaction_type_id,
				date,
				category_id,
				asset_id,
				liability_id,
				from_account_id,
				to_account_id,
				envelope_id,
				bill_id,
			]
		);

		// Fetch transaction type name
		const typeRow = await db.getFirstAsync<{ name: string }>(
			"SELECT name FROM transaction_types WHERE id = ?",
			[transaction_type_id]
		);
		const transactionTypeName = typeRow?.name || "";

		// Update account balances
		if (transactionTypeName === "Income" && to_account_id) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[amount, to_account_id]
			);
		} else if (transactionTypeName === "Expense" && from_account_id) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[amount, from_account_id]
			);
		} else if (
			transactionTypeName === "Transfer" &&
			from_account_id &&
			to_account_id
		) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[amount, from_account_id]
			);
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[amount, to_account_id]
			);
		}

		// update liability balance if applicable
		if (liability_id && transactionTypeName === "Expense") {
			await db.runAsync(
				"UPDATE liabilities SET current_balance = current_balance - ? WHERE id = ?",
				[amount, liability_id]
			);
		}

		// update envelope balance if applicable
		if (envelope_id && transactionTypeName === "Expense") {
			await db.runAsync(
				"UPDATE envelopes SET current_balance = current_balance - ? WHERE id = ?",
				[amount, envelope_id]
			);
		}

		// Mark bill as paid if bill_id is provided
		if (bill_id && transactionTypeName === "Expense") {
			await BillsRepository.markAsPaid(db, bill_id, result.lastInsertRowId);
		}

		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
		return result.lastInsertRowId;
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Transaction>
	): Promise<void> {
		const originalTransaction = await this.getById(db, id);
		if (!originalTransaction) {
			throw new Error("Transaction not found");
		}

		// Revert original transaction balances
		const originalTypeRow = await db.getFirstAsync<{ name: string }>(
			"SELECT name FROM transaction_types WHERE id = ?",
			[originalTransaction.transaction_type_id]
		);
		const originalTransactionTypeName = originalTypeRow?.name || "";

		if (
			originalTransactionTypeName === "Income" &&
			originalTransaction.to_account_id
		) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[originalTransaction.amount, originalTransaction.to_account_id]
			);
		} else if (
			originalTransactionTypeName === "Expense" &&
			originalTransaction.from_account_id
		) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[originalTransaction.amount, originalTransaction.from_account_id]
			);
		} else if (
			originalTransactionTypeName === "Transfer" &&
			originalTransaction.from_account_id &&
			originalTransaction.to_account_id
		) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[originalTransaction.amount, originalTransaction.from_account_id]
			);
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[originalTransaction.amount, originalTransaction.to_account_id]
			);
		}

		// Update transaction
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

		// Apply new transaction balances
		const updatedTransaction = { ...originalTransaction, ...updates };
		const newTypeRow = await db.getFirstAsync<{ name: string }>(
			"SELECT name FROM transaction_types WHERE id = ?",
			[updatedTransaction.transaction_type_id]
		);
		const newTransactionTypeName = newTypeRow?.name || "";

		if (
			newTransactionTypeName === "Income" &&
			updatedTransaction.to_account_id
		) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[updatedTransaction.amount, updatedTransaction.to_account_id]
			);
		} else if (
			newTransactionTypeName === "Expense" &&
			updatedTransaction.from_account_id
		) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[updatedTransaction.amount, updatedTransaction.from_account_id]
			);
		} else if (
			newTransactionTypeName === "Transfer" &&
			updatedTransaction.from_account_id &&
			updatedTransaction.to_account_id
		) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[updatedTransaction.amount, updatedTransaction.from_account_id]
			);
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[updatedTransaction.amount, updatedTransaction.to_account_id]
			);
		}

		// update liability balance if applicable
		if (originalTransaction.liability_id) {
			await db.runAsync(
				"UPDATE liabilities SET current_balance = current_balance + ? WHERE id = ?",
				[originalTransaction.amount, originalTransaction.liability_id]
			);
		}
		if (updatedTransaction.liability_id) {
			await db.runAsync(
				"UPDATE liabilities SET current_balance = current_balance - ? WHERE id = ?",
				[updatedTransaction.amount, updatedTransaction.liability_id]
			);
		}

		emitEvent(EVENTS.DATA_CHANGED);
	},

	async delete(db: SQLiteDatabase, id: number): Promise<void> {
		const transaction = await this.getById(db, id);
		if (!transaction) {
			return;
		}

		// Revert transaction balances
		const typeRow = await db.getFirstAsync<{ name: string }>(
			"SELECT name FROM transaction_types WHERE id = ?",
			[transaction.transaction_type_id]
		);
		const transactionTypeName = typeRow?.name || "";

		if (transactionTypeName === "Income" && transaction.to_account_id) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[transaction.amount, transaction.to_account_id]
			);
		} else if (
			transactionTypeName === "Expense" &&
			transaction.from_account_id
		) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[transaction.amount, transaction.from_account_id]
			);
		} else if (
			transactionTypeName === "Transfer" &&
			transaction.from_account_id &&
			transaction.to_account_id
		) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[transaction.amount, transaction.from_account_id]
			);
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[transaction.amount, transaction.to_account_id]
			);
		}

		// update liability balance if applicable
		if (transaction.liability_id) {
			await db.runAsync(
				"UPDATE liabilities SET current_balance = current_balance + ? WHERE id = ?",
				[transaction.amount, transaction.liability_id]
			);
		}

		await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
