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
			if (filter.accountId) {
				where.push("(from_account_id = ? OR to_account_id = ?)");
				params.push(filter.accountId, filter.accountId);
			}
			if (filter.assetId) {
				where.push("asset_id = ?");
				params.push(filter.assetId);
			}
			if (filter.liabilityId) {
				where.push("liability_id = ?");
				params.push(filter.liabilityId);
			}
			if (filter.envelopeId) {
				where.push("envelope_id = ?");
				params.push(filter.envelopeId);
			}
			if (filter.billId) {
				where.push("bill_id = ?");
				params.push(filter.billId);
			}
		}
		if (where.length > 0) {
			query += " WHERE " + where.join(" AND ");
		}
		query += " ORDER BY date DESC, id DESC";
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
				"UPDATE liabilities SET current_balance = CASE WHEN current_balance - ? < 0 THEN 0 ELSE current_balance - ? END WHERE id = ?",
				[amount, amount, liability_id]
			);
		}

		// update envelope balance if applicable
		if (envelope_id && transactionTypeName === "Expense") {
			await db.runAsync(
				"UPDATE envelopes SET current_balance = current_balance - ? WHERE id = ?",
				[amount, envelope_id]
			);
		}

		// Record bill payment if bill_id is provided
		if (bill_id && transactionTypeName === "Expense") {
			await BillsRepository.recordPayment(
				db,
				bill_id,
				amount,
				result.lastInsertRowId
			);
		}

		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
		return result.lastInsertRowId;
	},

};
