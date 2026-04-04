import { SQLiteDatabase } from "expo-sqlite";
import { Transaction, TransactionFilter } from "../types";
import { emitEvent, EVENTS } from "../utils/events";
import { BillsRepository } from "./BillsRepository";

// ─── Private side-effect helpers ──────────────────────────────────────────────
// Each helper owns exactly one domain. Called only after all validation passes.

async function applyAccountSideEffects(
	db: SQLiteDatabase,
	typeName: string,
	amount: number,
	fromAccountId: number | null | undefined,
	toAccountId: number | null | undefined
): Promise<void> {
	if (typeName === "Income" && toAccountId) {
		await db.runAsync(
			"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
			[amount, toAccountId]
		);
	} else if (typeName === "Expense" && fromAccountId) {
		await db.runAsync(
			"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
			[amount, fromAccountId]
		);
	} else if (typeName === "Transfer") {
		if (fromAccountId) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?",
				[amount, fromAccountId]
			);
		}
		if (toAccountId) {
			await db.runAsync(
				"UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?",
				[amount, toAccountId]
			);
		}
	}
}

async function applyLiabilitySideEffect(
	db: SQLiteDatabase,
	amount: number,
	liabilityId: number
): Promise<void> {
	await db.runAsync(
		"UPDATE liabilities SET current_balance = CASE WHEN current_balance - ? < 0 THEN 0 ELSE current_balance - ? END WHERE id = ?",
		[amount, amount, liabilityId]
	);
}

async function applyEnvelopeSideEffect(
	db: SQLiteDatabase,
	amount: number,
	envelopeId: number
): Promise<void> {
	await db.runAsync(
		"UPDATE envelopes SET current_balance = current_balance - ? WHERE id = ?",
		[amount, envelopeId]
	);
}

async function applyBillSideEffect(
	db: SQLiteDatabase,
	amount: number,
	billId: number,
	transactionId: number
): Promise<void> {
	await BillsRepository.recordPayment(db, billId, amount, transactionId);
}

async function applyAssetSideEffect(
	db: SQLiteDatabase,
	typeName: string,
	amount: number,
	assetId: number,
	fromAccountId: number | null | undefined,
	toAccountId: number | null | undefined
): Promise<void> {
	if (typeName === "Transfer" && fromAccountId && !toAccountId) {
		// Contribution: Bank Account → Asset
		const existingAsset = await db.getFirstAsync<{ initial_cost: number }>(
			"SELECT initial_cost FROM assets WHERE id = ?",
			[assetId]
		);
		if (existingAsset && existingAsset.initial_cost === 0) {
			// Initial acquisition
			await db.runAsync(
				"UPDATE assets SET initial_cost = ?, current_valuation = ? WHERE id = ? AND initial_cost = 0",
				[amount, amount, assetId]
			);
		} else {
			// Subsequent contribution
			await db.runAsync(
				"UPDATE assets SET contributions = contributions + ?, current_valuation = current_valuation + ? WHERE id = ?",
				[amount, amount, assetId]
			);
		}
	} else if (typeName === "Transfer" && toAccountId && !fromAccountId) {
		// Divestment: Asset → Bank Account
		await db.runAsync(
			"UPDATE assets SET withdrawals = withdrawals + ?, current_valuation = CASE WHEN current_valuation - ? < 0 THEN 0 ELSE current_valuation - ? END WHERE id = ?",
			[amount, amount, amount, assetId]
		);
	} else if (typeName === "Transfer" && !fromAccountId && !toAccountId) {
		// Reinvestment: money stays inside the asset
		await db.runAsync(
			"UPDATE assets SET reinvestments = reinvestments + ?, current_valuation = current_valuation + ? WHERE id = ?",
			[amount, amount, assetId]
		);
	} else if (typeName === "Income" && !toAccountId) {
		// Legacy: Reinvestment via Income type (backwards compat)
		await db.runAsync(
			"UPDATE assets SET reinvestments = reinvestments + ?, current_valuation = current_valuation + ? WHERE id = ?",
			[amount, amount, assetId]
		);
	}
}

type ReceivableSnapshot = {
	current_balance: number;
	status: string;
	requires_outflow: number;
	principal: number;
};

async function applyReceivableSideEffect(
	db: SQLiteDatabase,
	typeName: string,
	amount: number,
	receivableId: number,
	receivable: ReceivableSnapshot,
	fromAccountId: number | null | undefined,
	toAccountId: number | null | undefined
): Promise<void> {
	if (typeName === "Transfer" && fromAccountId && !toAccountId) {
		// Lending: Account → Receivable — activates the receivable at its principal
		await db.runAsync(
			"UPDATE receivables SET current_balance = ?, status = 'Active' WHERE id = ?",
			[receivable.principal, receivableId]
		);
	} else if (typeName === "Transfer" && toAccountId && !fromAccountId) {
		// Payment received: Receivable → Account
		// amount has already been validated to not exceed current_balance
		const newBalance = Math.max(0, receivable.current_balance - amount);
		const newStatus = newBalance === 0 ? "Settled" : "Active";
		await db.runAsync(
			"UPDATE receivables SET current_balance = ?, status = ? WHERE id = ?",
			[newBalance, newStatus, receivableId]
		);
	}
}

// ─── Repository ───────────────────────────────────────────────────────────────

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
			if (filter.receivableId) {
				where.push("receivable_id = ?");
				params.push(filter.receivableId);
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
			receivable_id = null,
		} = transaction;

		// ── Step 1: Resolve transaction type name ─────────────────────────────
		const typeRow = await db.getFirstAsync<{ name: string }>(
			"SELECT name FROM transaction_types WHERE id = ?",
			[transaction_type_id]
		);
		if (!typeRow) {
			throw new Error(`Unknown transaction type id: ${transaction_type_id}`);
		}
		const typeName = typeRow.name;

		// ── Step 2: Pre-fetch and validate — ALL checks before any DB write ───
		let receivable: ReceivableSnapshot | null = null;

		if (receivable_id) {
			receivable = await db.getFirstAsync<ReceivableSnapshot>(
				"SELECT current_balance, status, requires_outflow, principal FROM receivables WHERE id = ?",
				[receivable_id]
			);
			if (!receivable) {
				throw new Error(`Receivable #${receivable_id} not found`);
			}

			if (typeName === "Transfer" && from_account_id && !to_account_id) {
				// Lending path: Account → Receivable
				if (!receivable.requires_outflow) {
					throw new Error(
						"This receivable does not require a lending transfer"
					);
				}
				if (receivable.status !== "Pending") {
					throw new Error(
						"Lending transfer is only allowed on Pending receivables"
					);
				}
				if (amount !== receivable.principal) {
					throw new Error(
						`Lending amount must equal the principal (${receivable.principal})`
					);
				}
			} else if (typeName === "Transfer" && to_account_id && !from_account_id) {
				// Payment received: Receivable → Account
				if (receivable.status !== "Active") {
					throw new Error(
						`Cannot receive payment on a ${receivable.status} receivable`
					);
				}
				if (amount > receivable.current_balance) {
					const interestPortion = amount - receivable.current_balance;
					throw new Error(
						`Payment (${amount}) exceeds remaining balance (${receivable.current_balance}). ` +
						`Record ${receivable.current_balance} as the principal payment, ` +
						`then record ${interestPortion} as Interest income separately.`
					);
				}
			}
		}

		// ── Step 3: Execute all writes atomically ─────────────────────────────
		let insertedId = 0;

		await db.execAsync("BEGIN");
		try {
			const result = await db.runAsync(
				`INSERT INTO transactions
					(description, amount, transaction_type_id, date, category_id,
					 asset_id, liability_id, from_account_id, to_account_id,
					 envelope_id, bill_id, receivable_id)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
					receivable_id,
				]
			);
			insertedId = result.lastInsertRowId;

			await applyAccountSideEffects(
				db, typeName, amount, from_account_id, to_account_id
			);

			if (liability_id && typeName === "Expense") {
				await applyLiabilitySideEffect(db, amount, liability_id);
			}

			if (envelope_id && typeName === "Expense") {
				await applyEnvelopeSideEffect(db, amount, envelope_id);
			}

			if (bill_id && typeName === "Expense") {
				await applyBillSideEffect(db, amount, bill_id, insertedId);
			}

			if (asset_id) {
				await applyAssetSideEffect(
					db, typeName, amount, asset_id, from_account_id, to_account_id
				);
			}

			if (receivable_id && receivable) {
				await applyReceivableSideEffect(
					db, typeName, amount, receivable_id, receivable,
					from_account_id, to_account_id
				);
			}

			await db.execAsync("COMMIT");
		} catch (e) {
			await db.execAsync("ROLLBACK");
			throw e;
		}

		// ── Step 4: Notify UI only after a confirmed commit ───────────────────
		emitEvent(EVENTS.DATA_CHANGED);
		return insertedId;
	},
};
