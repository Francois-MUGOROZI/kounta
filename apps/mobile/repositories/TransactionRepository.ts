import { SQLiteDatabase } from "expo-sqlite";
import { Transaction, TransactionFilter } from "../types";
import { emitEvent, EVENTS } from "../utils/events";
import { BillsRepository } from "./BillsRepository";
import { attachTags } from "./TagRepository";
import { LOCAL_DAY_SQL, toLocalISODate, parseLocalDate } from "../utils/date";

// Thousands separators for amounts quoted in validation messages.
const fmt = (n: number) => n.toLocaleString("en-US");

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

async function getNameById(
	db: SQLiteDatabase,
	table: "accounts" | "assets" | "receivables" | "liabilities",
	id: number
): Promise<string | null> {
	const column = table === "receivables" ? "title" : "name";
	const row = await db.getFirstAsync<{ label: string }>(
		`SELECT ${column} AS label FROM ${table} WHERE id = ?`,
		[id]
	);
	return row?.label ?? null;
}

// Builds a sensible description when the user left it blank — category name
// for Income/Expense, source → destination for Transfers, falling back to
// the transaction type and date when nothing else is available.
async function buildFallbackDescription(
	db: SQLiteDatabase,
	typeName: string,
	date: string,
	categoryId: number | null,
	fromAccountId: number | null | undefined,
	toAccountId: number | null | undefined,
	assetId: number | null | undefined,
	receivableId: number | null | undefined,
	liabilityId: number | null | undefined
): Promise<string> {
	const formattedDate = parseLocalDate(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	if (categoryId) {
		const category = await db.getFirstAsync<{ name: string }>(
			"SELECT name FROM categories WHERE id = ?",
			[categoryId]
		);
		if (category) return `${category.name} — ${formattedDate}`;
	}

	if (typeName === "Transfer") {
		const sourceLabel = fromAccountId
			? await getNameById(db, "accounts", fromAccountId)
			: liabilityId && toAccountId
			? await getNameById(db, "liabilities", liabilityId)
			: receivableId && toAccountId
			? await getNameById(db, "receivables", receivableId)
			: assetId && toAccountId
			? await getNameById(db, "assets", assetId)
			: null;

		const destinationLabel = toAccountId
			? await getNameById(db, "accounts", toAccountId)
			: liabilityId && fromAccountId
			? await getNameById(db, "liabilities", liabilityId)
			: receivableId && fromAccountId
			? await getNameById(db, "receivables", receivableId)
			: assetId && fromAccountId
			? await getNameById(db, "assets", assetId)
			: null;

		if (sourceLabel && destinationLabel) {
			return `${sourceLabel} → ${destinationLabel} — ${formattedDate}`;
		}

		if (assetId && !fromAccountId && !toAccountId) {
			const assetName = await getNameById(db, "assets", assetId);
			if (assetName) return `${assetName} reinvestment — ${formattedDate}`;
		}
	}

	return `${typeName} — ${formattedDate}`;
}

// How a transaction moves a liability: loan cash in, interest/fee charged, or repaid.
type LiabilityMovement = "borrow" | "charge" | "repay";

async function applyLiabilitySideEffect(
	db: SQLiteDatabase,
	movement: LiabilityMovement,
	amount: number,
	liabilityId: number
): Promise<void> {
	if (movement === "repay") {
		// amount has already been validated to not exceed current_balance
		await db.runAsync(
			"UPDATE liabilities SET current_balance = current_balance - ? WHERE id = ?",
			[amount, liabilityId]
		);
	} else {
		// Borrowing and interest both add to what is owed
		await db.runAsync(
			"UPDATE liabilities SET current_balance = current_balance + ?, total_amount = total_amount + ? WHERE id = ?",
			[amount, amount, liabilityId]
		);
	}
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

// Classifies a liability-linked transaction, rejecting shapes the model doesn't allow.
function liabilityMovementFor(
	typeName: string,
	fromAccountId: number | null | undefined,
	toAccountId: number | null | undefined
): LiabilityMovement {
	if (typeName === "Transfer") {
		if (toAccountId && !fromAccountId) return "borrow";
		if (fromAccountId && !toAccountId) return "repay";
		throw new Error("A liability transfer needs exactly one account");
	}
	if (typeName === "Expense") {
		if (fromAccountId || toAccountId) {
			throw new Error(
				"An expense linked to a liability is a charge (interest, fee or penalty) and can't use an account"
			);
		}
		return "charge";
	}
	throw new Error(`${typeName} can't be linked to a liability`);
}

// ─── Transaction writer ───────────────────────────────────────────────────────
// Validates and writes one transaction with its side effects. Must run inside
// an open SQL transaction; callers own BEGIN/COMMIT and the change event.

export async function insertTransaction(
	db: SQLiteDatabase,
	transaction: Omit<Transaction, "id">
): Promise<number> {
	const {
		description: rawDescription = "",
		amount = 0,
		transaction_type_id = 0,
		date = toLocalISODate(),
		category_id = null,
		asset_id = null,
		liability_id = null,
		from_account_id = null,
		to_account_id = null,
		envelope_id = null,
		bill_id = null,
		receivable_id = null,
		entity_id = null,
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

	const description = rawDescription.trim()
		? rawDescription.trim()
		: await buildFallbackDescription(
				db,
				typeName,
				date,
				category_id,
				from_account_id,
				to_account_id,
				asset_id,
				receivable_id,
				liability_id
			);

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
					`Lending amount must equal the principal (${fmt(receivable.principal)})`
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
					`Payment (${fmt(amount)}) exceeds remaining balance (${fmt(receivable.current_balance)}). ` +
					`Record ${fmt(receivable.current_balance)} as the principal payment, ` +
					`then record ${fmt(interestPortion)} as Interest income separately.`
				);
			}
		}
	}

	let liabilityMovement: LiabilityMovement | null = null;

	if (liability_id) {
		const liability = await db.getFirstAsync<{ current_balance: number; currency: string }>(
			"SELECT current_balance, currency FROM liabilities WHERE id = ?",
			[liability_id]
		);
		if (!liability) {
			throw new Error(`Liability #${liability_id} not found`);
		}

		liabilityMovement = liabilityMovementFor(typeName, from_account_id, to_account_id);
		if (liabilityMovement === "charge" && (bill_id || envelope_id)) {
			throw new Error("A liability charge isn't paid from anything, so it can't use a bill or envelope");
		}

		const accountId = from_account_id ?? to_account_id;
		if (accountId) {
			const account = await db.getFirstAsync<{ currency: string }>(
				"SELECT currency FROM accounts WHERE id = ?",
				[accountId]
			);
			if (account && account.currency !== liability.currency) {
				throw new Error(
					`The account is in ${account.currency} but the liability is in ${liability.currency}`
				);
			}
		}

		if (liabilityMovement === "repay" && amount > liability.current_balance) {
			const excess = amount - liability.current_balance;
			throw new Error(
				`Payment (${fmt(amount)}) exceeds what you still owe (${fmt(liability.current_balance)}). ` +
				`Use Add charge on the liability for the extra ${fmt(excess)} first, then record the payment.`
			);
		}
	}

	// ── Step 3: Write the row and its side effects ────────────────────────
	const result = await db.runAsync(
		`INSERT INTO transactions
			(description, amount, transaction_type_id, date, category_id,
			 asset_id, liability_id, from_account_id, to_account_id,
			 envelope_id, bill_id, receivable_id, entity_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
			entity_id,
		]
	);
	const insertedId = result.lastInsertRowId;

	await applyAccountSideEffects(
		db, typeName, amount, from_account_id, to_account_id
	);

	if (liability_id && liabilityMovement) {
		await applyLiabilitySideEffect(db, liabilityMovement, amount, liability_id);
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

	return insertedId;
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
				where.push(`${LOCAL_DAY_SQL("date")} >= ?`);
				params.push(filter.startDate);
			}
			if (filter.endDate) {
				where.push(`${LOCAL_DAY_SQL("date")} <= ?`);
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
			if (filter.entityId) {
				where.push("entity_id = ?");
				params.push(filter.entityId);
			}
			if (filter.tagId) {
				where.push("id IN (SELECT transaction_id FROM transaction_tags WHERE tag_id = ?)");
				params.push(filter.tagId);
			}
		}
		if (where.length > 0) {
			query += " WHERE " + where.join(" AND ");
		}
		query += ` ORDER BY ${LOCAL_DAY_SQL("date")} DESC, id DESC`;
		return await db.getAllAsync<Transaction>(query, params);
	},

	/** Latest transactions in one currency (by their account, asset, receivable or liability). */
	async getRecentInCurrency(
		db: SQLiteDatabase,
		currency: string,
		limit: number
	): Promise<Transaction[]> {
		return await db.getAllAsync<Transaction>(
			`SELECT t.* FROM transactions t
			 LEFT JOIN accounts fa ON fa.id = t.from_account_id
			 LEFT JOIN accounts ta ON ta.id = t.to_account_id
			 LEFT JOIN assets ast ON ast.id = t.asset_id
			 LEFT JOIN receivables rcv ON rcv.id = t.receivable_id
			 LEFT JOIN liabilities lia ON lia.id = t.liability_id
			 WHERE COALESCE(fa.currency, ta.currency, ast.currency, rcv.currency, lia.currency, 'RWF') = ?
			 ORDER BY ${LOCAL_DAY_SQL("t.date")} DESC, t.id DESC LIMIT ?`,
			[currency, limit]
		);
	},

	async getById(db: SQLiteDatabase, id: number): Promise<Transaction | null> {
		return await db.getFirstAsync<Transaction>(
			"SELECT * FROM transactions WHERE id = ?",
			[id]
		);
	},

	// Income/Expense totals for one entity, grouped by currency — aggregated in SQL
	async getEntityTotalsByCurrency(
		db: SQLiteDatabase,
		entityId: number
	): Promise<{ currency: string; income: number; expenses: number }[]> {
		const rows = await db.getAllAsync<{
			currency: string;
			typeName: string;
			total: number;
		}>(
			`SELECT
				COALESCE(a.currency, ast.currency, lia.currency, 'RWF') as currency,
				tt.name as typeName,
				SUM(t.amount) as total
			 FROM transactions t
			 JOIN transaction_types tt ON t.transaction_type_id = tt.id
			 LEFT JOIN accounts a ON a.id = COALESCE(t.from_account_id, t.to_account_id)
			 LEFT JOIN assets ast ON ast.id = t.asset_id
			 LEFT JOIN liabilities lia ON lia.id = t.liability_id
			 WHERE t.entity_id = ? AND tt.name IN ('Income', 'Expense')
			 GROUP BY COALESCE(a.currency, ast.currency, lia.currency, 'RWF'), tt.name`,
			[entityId]
		);

		const byCurrency: {
			[currency: string]: { income: number; expenses: number };
		} = {};
		rows.forEach((r) => {
			if (!byCurrency[r.currency]) {
				byCurrency[r.currency] = { income: 0, expenses: 0 };
			}
			if (r.typeName === "Income") {
				byCurrency[r.currency].income += r.total;
			} else {
				byCurrency[r.currency].expenses += r.total;
			}
		});

		return Object.entries(byCurrency).map(([currency, totals]) => ({
			currency,
			...totals,
		}));
	},

	async create(
		db: SQLiteDatabase,
		transaction: Omit<Transaction, "id">,
		tags: string[] = []
	): Promise<number> {
		let insertedId = 0;

		await db.execAsync("BEGIN");
		try {
			insertedId = await insertTransaction(db, transaction);
			await attachTags(db, insertedId, tags);
			await db.execAsync("COMMIT");
		} catch (e) {
			await db.execAsync("ROLLBACK");
			throw e;
		}

		// Notify UI only after a confirmed commit
		emitEvent(EVENTS.DATA_CHANGED);
		return insertedId;
	},
};
