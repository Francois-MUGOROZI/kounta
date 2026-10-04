import { SQLiteDatabase } from "expo-sqlite";
import { Liability } from "../types";
import { emitEvent, EVENTS } from "../utils/events";
import { toLocalISODate } from "../utils/date";
import { insertTransaction } from "./TransactionRepository";

/** Default name of the seeded Expense category for liability charges. Never looked up by the app. */
export const CHARGES_CATEGORY = "Interest & Charges";

export const LiabilityRepository = {
	async getAll(db: SQLiteDatabase): Promise<Liability[]> {
		return await db.getAllAsync<Liability>(
			"SELECT * FROM liabilities ORDER BY created_at DESC"
		);
	},

	async getActive(db: SQLiteDatabase): Promise<Liability[]> {
		return await db.getAllAsync<Liability>(
			"SELECT * FROM liabilities WHERE current_balance > 0 ORDER BY created_at DESC"
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Liability | null> {
		return await db.getFirstAsync<Liability>(
			"SELECT * FROM liabilities WHERE id = ?",
			[id]
		);
	},

	// Paid/total totals for one entity's liabilities, grouped by currency
	async getTotalsByEntityAndCurrency(
		db: SQLiteDatabase,
		entityId: number
	): Promise<{ currency: string; total: number; paid: number }[]> {
		return await db.getAllAsync(
			`SELECT currency, SUM(total_amount) as total, SUM(total_amount - current_balance) as paid
			 FROM liabilities
			 WHERE entity_id = ?
			 GROUP BY currency`,
			[entityId]
		);
	},

	async create(
		db: SQLiteDatabase,
		liability: Omit<Liability, "id">
	): Promise<void> {
		const name: string = liability.name ?? "";
		const liability_type_id: number =
			typeof liability.liability_type_id === "number"
				? liability.liability_type_id
				: 0;
		const currency: string = liability.currency ?? "";
		const total_amount: number =
			typeof liability.total_amount === "number" ? liability.total_amount : 0;
		const current_balance: number =
			typeof liability.current_balance === "number"
				? liability.current_balance
				: total_amount;
		const created_at: string = liability.created_at ?? new Date().toISOString();
		const notes: string | null = liability.notes ?? null;
		const entity_id: number | null =
			typeof liability.entity_id === "number" ? liability.entity_id : null;

		await db.runAsync(
			`INSERT INTO liabilities (name, liability_type_id, currency, total_amount, current_balance, created_at, notes, entity_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				name,
				liability_type_id,
				currency,
				total_amount,
				current_balance,
				created_at,
				notes,
				entity_id,
			]
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},

	/**
	 * Creates a liability for a loan whose cash reached an account: the liability,
	 * a Transfer of the cash into the account, and (when the total to repay is
	 * higher) the difference as an interest charge — all in one SQL transaction.
	 */
	async createWithLoan(
		db: SQLiteDatabase,
		liability: Omit<Liability, "id" | "current_balance">,
		loan: { accountId: number; cashReceived: number; chargeCategoryId?: number | null }
	): Promise<void> {
		const total = liability.total_amount;
		if (loan.cashReceived <= 0 || loan.cashReceived > total) {
			throw new Error("Cash received must be more than 0 and no more than the total to repay");
		}

		const types = await db.getAllAsync<{ id: number; name: string }>(
			"SELECT id, name FROM transaction_types WHERE name IN ('Transfer', 'Expense')"
		);
		const transferTypeId = types.find((t) => t.name === "Transfer")?.id;
		const expenseTypeId = types.find((t) => t.name === "Expense")?.id;
		if (!transferTypeId || !expenseTypeId) {
			throw new Error("Transaction types are missing");
		}

		const interest = total - loan.cashReceived;
		if (interest > 0 && !loan.chargeCategoryId) {
			throw new Error("Choose a category for the amount owed above the cash received");
		}

		const date = toLocalISODate();
		const created_at = liability.created_at ?? new Date().toISOString();
		const entity_id = liability.entity_id ?? null;

		await db.execAsync("BEGIN");
		try {
			// Starts at zero: the transactions below build up what is owed.
			const result = await db.runAsync(
				`INSERT INTO liabilities (name, liability_type_id, currency, total_amount, current_balance, created_at, notes, entity_id)
         VALUES (?, ?, ?, 0, 0, ?, ?, ?)`,
				[
					liability.name,
					liability.liability_type_id,
					liability.currency,
					created_at,
					liability.notes ?? null,
					entity_id,
				]
			);
			const liabilityId = result.lastInsertRowId;

			await insertTransaction(db, {
				description: "",
				amount: loan.cashReceived,
				transaction_type_id: transferTypeId,
				date,
				category_id: null,
				liability_id: liabilityId,
				to_account_id: loan.accountId,
			});

			if (interest > 0) {
				await insertTransaction(db, {
					description: `Interest & charges — ${liability.name}`,
					amount: interest,
					transaction_type_id: expenseTypeId,
					date,
					category_id: loan.chargeCategoryId ?? null,
					liability_id: liabilityId,
					entity_id,
				});
			}

			await db.execAsync("COMMIT");
		} catch (e) {
			await db.execAsync("ROLLBACK");
			throw e;
		}
		emitEvent(EVENTS.DATA_CHANGED);
	},

	async update(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Liability>
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
			`UPDATE liabilities SET ${fields.join(", ")} WHERE id = ?`,
			values
		);
		// Notify the app that data has changed so UI can update
		emitEvent(EVENTS.DATA_CHANGED);
	},
};
