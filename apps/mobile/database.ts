import { useSQLiteContext } from "expo-sqlite";
import React from "react";
import { CHARGES_CATEGORY } from "./repositories/LiabilityRepository";

// Database initialization and seeding
export async function initDatabase(db: any) {
	// Enable foreign key enforcement (SQLite does not enforce FKs by default)
	await db.execAsync("PRAGMA foreign_keys = ON;");

	// Type tables
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS account_types (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS asset_types (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS liability_types (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS transaction_types (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE
		);
	`);

	// Main entity tables

	// Envelopes table
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS envelopes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			currency TEXT NOT NULL,
			total_amount REAL NOT NULL DEFAULT 0,
			current_balance REAL NOT NULL DEFAULT 0,
			purpose TEXT,
			created_at TEXT
		);
	`);

	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS accounts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			account_number TEXT,
			account_type_id INTEGER NOT NULL,
			currency TEXT NOT NULL,
			opening_balance REAL NOT NULL,
			current_balance REAL NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (account_type_id) REFERENCES account_types(id),
			UNIQUE(name, account_type_id, account_number)
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS assets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			asset_type_id INTEGER NOT NULL,
			currency TEXT NOT NULL,
			initial_cost REAL NOT NULL DEFAULT 0,
			contributions REAL NOT NULL DEFAULT 0,
			reinvestments REAL NOT NULL DEFAULT 0,
			withdrawals REAL NOT NULL DEFAULT 0,
			current_valuation REAL NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL,
			notes TEXT,
			FOREIGN KEY (asset_type_id) REFERENCES asset_types(id)
		);
	`);

	// Entities table — must be created before liabilities (FK dependency)
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS entities (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			phone_number TEXT,
			is_individual INTEGER NOT NULL DEFAULT 1,
			id_number TEXT,
			metadata TEXT,
			created_at TEXT NOT NULL
		);
	`);

	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS liabilities (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			liability_type_id INTEGER NOT NULL,
			entity_id INTEGER,
			currency TEXT NOT NULL,
			total_amount REAL NOT NULL,
			current_balance REAL NOT NULL,
			created_at TEXT NOT NULL,
			notes TEXT,
			FOREIGN KEY (liability_type_id) REFERENCES liability_types(id),
			FOREIGN KEY (entity_id) REFERENCES entities(id)
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			transaction_type_id INTEGER NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (transaction_type_id) REFERENCES transaction_types(id),
			UNIQUE(name, transaction_type_id)
		);
	`);
	// Receivables table — must be created before transactions (FK dependency)
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS receivables (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			entity_id INTEGER NOT NULL,
			title TEXT NOT NULL,
			type TEXT NOT NULL,
			currency TEXT NOT NULL,
			principal REAL NOT NULL,
			interest_rate REAL NOT NULL DEFAULT 0,
			current_balance REAL NOT NULL,
			status TEXT NOT NULL DEFAULT 'Active',
			requires_outflow INTEGER NOT NULL DEFAULT 0,
			due_date TEXT,
			notes TEXT,
			created_at TEXT NOT NULL,
			FOREIGN KEY (entity_id) REFERENCES entities(id)
		);
	`);

	// Bills table — must be created before transactions (FK dependency)
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS bills (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			currency TEXT NOT NULL DEFAULT 'RWF',
			due_date TEXT NOT NULL,
			amount REAL NOT NULL,
			paid_amount REAL NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'Pending',
			transaction_id INTEGER,
			category_id INTEGER,
			paid_at TEXT,
			created_at TEXT NOT NULL,
			FOREIGN KEY (transaction_id) REFERENCES transactions(id),
			FOREIGN KEY (category_id) REFERENCES categories(id)
		);
	`);

	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			description TEXT NOT NULL,
			amount REAL NOT NULL,
			transaction_type_id INTEGER NOT NULL,
			date TEXT NOT NULL,
			category_id INTEGER,
			asset_id INTEGER,
			liability_id INTEGER,
			from_account_id INTEGER,
			to_account_id INTEGER,
			envelope_id INTEGER,
			bill_id INTEGER,
			receivable_id INTEGER,
			entity_id INTEGER,
			FOREIGN KEY (transaction_type_id) REFERENCES transaction_types(id),
			FOREIGN KEY (category_id) REFERENCES categories(id),
			FOREIGN KEY (asset_id) REFERENCES assets(id),
			FOREIGN KEY (liability_id) REFERENCES liabilities(id),
			FOREIGN KEY (from_account_id) REFERENCES accounts(id),
			FOREIGN KEY (to_account_id) REFERENCES accounts(id),
			FOREIGN KEY (envelope_id) REFERENCES envelopes(id),
			FOREIGN KEY (bill_id) REFERENCES bills(id),
			FOREIGN KEY (receivable_id) REFERENCES receivables(id),
			FOREIGN KEY (entity_id) REFERENCES entities(id)
		);
	`);

	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS budgets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			category_id INTEGER NOT NULL,
			amount REAL NOT NULL,
			period TEXT NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (category_id) REFERENCES categories(id)
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS savings_goals (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			target_amount REAL NOT NULL,
			current_amount REAL NOT NULL,
			target_date TEXT,
			created_at TEXT NOT NULL
		);
	`);

	// Run migrations
	await runMigrations(db);

	await seedTypeTables(db);
	await seedCategories(db);

	// Data migrations need the seeded types and categories
	await runDataMigrations(db);
}

// Run database migrations
async function runMigrations(db: any) {
	try {
		// Migration: Add entity_id to transactions
		const txnColumns = await db.getAllAsync("PRAGMA table_info(transactions);");
		const txnColumnNames = txnColumns.map((col: any) => col.name);
		if (!txnColumnNames.includes("entity_id")) {
			await db.execAsync(
				"ALTER TABLE transactions ADD COLUMN entity_id INTEGER REFERENCES entities(id);"
			);
		}
	} catch (error) {
		console.log("Migration error:", error);
	}
}

// ─── Data migrations ──────────────────────────────────────────────────────────
// Versioned with PRAGMA user_version (stored in the database file, so restored
// backups are migrated too). Each version runs once, in one SQL transaction;
// on failure it rolls back and is retried on the next launch.

async function runDataMigrations(db: any) {
	try {
		const row = await db.getFirstAsync("PRAGMA user_version;");
		const version: number = row?.user_version ?? 0;

		if (version < 1) {
			await db.execAsync("BEGIN");
			try {
				await migrateLoansToTransfers(db);
				await db.execAsync("PRAGMA user_version = 1;");
				await db.execAsync("COMMIT");
			} catch (error) {
				await db.execAsync("ROLLBACK");
				throw error;
			}
		}
	} catch (error) {
		console.log("Data migration error:", error);
	}
}

// v1 — one-time fix for loans recorded before the transfer model existed: loan
// cash was saved as Income and repayments as Expense. The repository is public,
// so only row IDs live here; a checksum of their amounts identifies the data.
// Any database that doesn't match is left untouched.
const V1_CASH_IN: Record<number, number> = {
	// transaction id → liability id
	177: 1, 228: 2, 251: 3, 286: 4, 406: 5, 458: 6, 519: 8, 558: 7,
};
const V1_KNOWN_REPAYMENTS = [226, 267, 284, 337, 324, 366, 409, 410, 501, 542];
// A mistaken payment (Expense) and the Income that reversed it — net zero.
const V1_REVERSED_PAYMENT = 539;
const V1_REVERSAL = 541;
const V1_LOAN_INCOME_CATEGORY = 38;
const V1_LOAN_PAYMENT_CATEGORY = 39;
const V1_LIABILITIES = [1, 2, 3, 4, 5, 6, 7, 8];
const V1_CHECKSUM = 5198031;
const EPSILON = 0.005;

const sameAmount = (a: number, b: number) => Math.abs(a - b) < EPSILON;
const inList = (ids: number[]) => ids.join(", ");

async function migrateLoansToTransfers(db: any) {
	const cashInIds = Object.keys(V1_CASH_IN).map(Number);
	const manifestIds = [...cashInIds, ...V1_KNOWN_REPAYMENTS, V1_REVERSED_PAYMENT, V1_REVERSAL];
	const loanCategories = [V1_LOAN_INCOME_CATEGORY, V1_LOAN_PAYMENT_CATEGORY];

	// ── Applicability: only the database these IDs were taken from ───────
	const anchor = await db.getFirstAsync(
		"SELECT category_id FROM transactions WHERE id = ?",
		[cashInIds[0]]
	);
	const categoryCount = await db.getFirstAsync(
		`SELECT COUNT(*) AS n FROM categories WHERE id IN (${inList(loanCategories)})`
	);
	const checksum = await db.getFirstAsync(
		`SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE id IN (${inList(manifestIds)})`
	);
	if (
		anchor?.category_id !== V1_LOAN_INCOME_CATEGORY ||
		categoryCount?.n !== 2 ||
		!sameAmount(checksum?.total ?? 0, V1_CHECKSUM)
	) {
		return;
	}

	const fail = (reason: string): never => {
		throw new Error(`Loan migration skipped: ${reason}`);
	};

	const types: { id: number; name: string }[] = await db.getAllAsync(
		"SELECT id, name FROM transaction_types"
	);
	const typeId = (name: string) => types.find((t) => t.name === name)?.id ?? fail(`missing ${name} type`);
	const INCOME = typeId("Income");
	const EXPENSE = typeId("Expense");
	const TRANSFER = typeId("Transfer");


	// ── Guards: everything must match before anything is written ─────────
	const categories: { id: number; transaction_type_id: number }[] = await db.getAllAsync(
		`SELECT id, transaction_type_id FROM categories WHERE id IN (${inList(loanCategories)})`
	);
	const categoryType = (id: number) => categories.find((c) => c.id === id)?.transaction_type_id;
	if (categoryType(V1_LOAN_INCOME_CATEGORY) !== INCOME || categoryType(V1_LOAN_PAYMENT_CATEGORY) !== EXPENSE) {
		fail("loan categories changed type");
	}

	const liabilities: { id: number; total_amount: number; current_balance: number; currency: string; name: string; entity_id: number | null }[] =
		await db.getAllAsync(
			`SELECT id, total_amount, current_balance, currency, name, entity_id FROM liabilities WHERE id IN (${inList(V1_LIABILITIES)})`
		);
	if (liabilities.length !== V1_LIABILITIES.length) fail("liabilities missing");
	const liabilityById = (id: number) => liabilities.find((l) => l.id === id)!;

	const accounts: { id: number; currency: string; opening_balance: number; current_balance: number }[] =
		await db.getAllAsync("SELECT id, currency, opening_balance, current_balance FROM accounts");
	const accountById = (id: number) => accounts.find((a) => a.id === id);

	type Row = {
		id: number;
		amount: number;
		date: string;
		transaction_type_id: number;
		category_id: number | null;
		liability_id: number | null;
		from_account_id: number | null;
		to_account_id: number | null;
	};
	const rowsByIds = async (ids: number[]): Promise<Row[]> =>
		db.getAllAsync(
			`SELECT id, amount, date, transaction_type_id, category_id, liability_id, from_account_id, to_account_id
			 FROM transactions WHERE id IN (${inList(ids)})`
		);

	const cashIns = await rowsByIds(cashInIds);
	for (const id of cashInIds) {
		const row = cashIns.find((r) => r.id === id);
		const liability = liabilityById(V1_CASH_IN[id]);
		const account = row?.to_account_id ? accountById(row.to_account_id) : undefined;
		if (
			!row ||
			row.transaction_type_id !== INCOME ||
			row.from_account_id ||
			row.liability_id ||
			!account ||
			account.currency !== liability.currency
		) {
			fail(`loan cash row ${id} changed`);
		}
	}

	// Repayments are every account-paid expense linked to these liabilities, so
	// old-style payments recorded after the IDs were taken are converted too.
	const repayments: Row[] = await db.getAllAsync(
		`SELECT id, amount, date, transaction_type_id, category_id, liability_id, from_account_id, to_account_id
		 FROM transactions
		 WHERE transaction_type_id = ? AND from_account_id IS NOT NULL AND liability_id IN (${inList(V1_LIABILITIES)})`,
		[EXPENSE]
	);
	for (const id of V1_KNOWN_REPAYMENTS) {
		if (!repayments.some((r) => r.id === id)) fail(`repayment ${id} changed`);
	}

	const [mistake, reversal] = [
		(await rowsByIds([V1_REVERSED_PAYMENT]))[0],
		(await rowsByIds([V1_REVERSAL]))[0],
	];
	if (
		!mistake ||
		!reversal ||
		mistake.transaction_type_id !== EXPENSE ||
		mistake.category_id !== V1_LOAN_PAYMENT_CATEGORY ||
		mistake.liability_id ||
		reversal.transaction_type_id !== INCOME ||
		!sameAmount(mistake.amount, reversal.amount) ||
		!mistake.from_account_id ||
		mistake.from_account_id !== reversal.to_account_id
	) {
		fail("reversed payment pair changed");
	}

	// Nothing else may touch these liabilities or the loan categories.
	const handledIds = [...cashInIds, ...repayments.map((r) => r.id), V1_REVERSED_PAYMENT, V1_REVERSAL];
	const unexpected = await db.getFirstAsync(
		`SELECT id FROM transactions
		 WHERE (liability_id IN (${inList(V1_LIABILITIES)}) OR category_id IN (${inList(loanCategories)}))
		   AND id NOT IN (${inList(handledIds)})
		 LIMIT 1`
	);
	if (unexpected) fail(`unexpected loan row ${unexpected.id}`);

	const repaidFor = (liabilityId: number) =>
		repayments.filter((r) => r.liability_id === liabilityId).reduce((sum, r) => sum + r.amount, 0);
	for (const l of liabilities) {
		if (!sameAmount(l.current_balance, Math.max(0, l.total_amount - repaidFor(l.id)))) {
			fail(`liability ${l.id} balance doesn't match its payments`);
		}
	}

	const touchedAccounts = new Set<number>();
	cashIns.forEach((r) => touchedAccounts.add(r.to_account_id!));
	repayments.forEach((r) => touchedAccounts.add(r.from_account_id!));
	touchedAccounts.add(mistake.from_account_id!);
	const derivedBalance = async (accountId: number) => {
		const flows = await db.getFirstAsync(
			`SELECT
				COALESCE(SUM(CASE WHEN to_account_id = ? THEN amount END), 0) AS inflow,
				COALESCE(SUM(CASE WHEN from_account_id = ? THEN amount END), 0) AS outflow
			 FROM transactions WHERE to_account_id = ? OR from_account_id = ?`,
			[accountId, accountId, accountId, accountId]
		);
		return accountById(accountId)!.opening_balance + flows.inflow - flows.outflow;
	};
	for (const accountId of touchedAccounts) {
		if (!sameAmount(accountById(accountId)!.current_balance, await derivedBalance(accountId))) {
			fail(`account ${accountId} balance doesn't match its transactions`);
		}
	}

	const budgets = await db.getFirstAsync(
		`SELECT COUNT(*) AS n FROM budgets WHERE category_id IN (${inList(loanCategories)})`
	);
	if (budgets?.n) fail("a budget uses a loan category");

	// ── Writes ────────────────────────────────────────────────────────────
	for (const id of cashInIds) {
		await db.runAsync(
			"UPDATE transactions SET transaction_type_id = ?, category_id = NULL, liability_id = ? WHERE id = ?",
			[TRANSFER, V1_CASH_IN[id], id]
		);
	}
	await db.runAsync(
		`UPDATE transactions SET transaction_type_id = ?, category_id = NULL WHERE id IN (${inList(repayments.map((r) => r.id))})`,
		[TRANSFER]
	);
	await db.runAsync(
		`DELETE FROM transactions WHERE id IN (${inList([V1_REVERSED_PAYMENT, V1_REVERSAL])})`
	);

	// The interest needs a category: the default one, created once here if missing.
	let interestCategoryId: number | null = null;
	const chargesCategoryId = async () => {
		if (interestCategoryId) return interestCategoryId;
		const existing = await db.getFirstAsync(
			"SELECT id FROM categories WHERE name = ? AND transaction_type_id = ?",
			[CHARGES_CATEGORY, EXPENSE]
		);
		interestCategoryId = existing
			? existing.id
			: (
					await db.runAsync(
						"INSERT INTO categories (name, transaction_type_id, created_at) VALUES (?, ?, ?)",
						[CHARGES_CATEGORY, EXPENSE, new Date().toISOString()]
					)
				).lastInsertRowId;
		return interestCategoryId;
	};

	// What was owed beyond the cash received is interest, charged on the loan date.
	for (const id of cashInIds) {
		const cashIn = cashIns.find((r) => r.id === id)!;
		const liability = liabilityById(V1_CASH_IN[id]);
		const repaid = repaidFor(liability.id);
		const interest = Math.max(liability.total_amount, repaid) - cashIn.amount;
		if (interest > EPSILON) {
			await db.runAsync(
				`INSERT INTO transactions (description, amount, transaction_type_id, date, category_id, liability_id, entity_id)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[`Interest & charges — ${liability.name}`, interest, EXPENSE, cashIn.date, await chargesCategoryId(), liability.id, liability.entity_id]
			);
		}
		const total = cashIn.amount + Math.max(0, interest);
		await db.runAsync(
			"UPDATE liabilities SET total_amount = ?, current_balance = ? WHERE id = ?",
			[total, total - repaid, liability.id]
		);
	}

	await db.runAsync(
		`UPDATE bills SET category_id = NULL WHERE category_id IN (${inList(loanCategories)})`
	);
	await db.runAsync(`DELETE FROM categories WHERE id IN (${inList(loanCategories)})`);

	// ── Post-checks: balances unchanged and consistent with the new rows ──
	const after: { id: number; current_balance: number }[] = await db.getAllAsync(
		"SELECT id, current_balance FROM accounts"
	);
	for (const a of after) {
		if (!sameAmount(a.current_balance, accountById(a.id)!.current_balance)) fail(`account ${a.id} balance changed`);
	}
	for (const accountId of touchedAccounts) {
		if (!sameAmount(accountById(accountId)!.current_balance, await derivedBalance(accountId))) {
			fail(`account ${accountId} no longer matches its transactions`);
		}
	}

	for (const l of liabilities) {
		const updated = await db.getFirstAsync(
			"SELECT total_amount, current_balance FROM liabilities WHERE id = ?",
			[l.id]
		);
		const flows = await db.getFirstAsync(
			`SELECT
				COALESCE(SUM(CASE WHEN transaction_type_id = ? AND to_account_id IS NOT NULL AND from_account_id IS NULL THEN amount END), 0) AS borrowed,
				COALESCE(SUM(CASE WHEN transaction_type_id = ? AND from_account_id IS NULL THEN amount END), 0) AS charged,
				COALESCE(SUM(CASE WHEN transaction_type_id = ? AND from_account_id IS NOT NULL AND to_account_id IS NULL THEN amount END), 0) AS repaid
			 FROM transactions WHERE liability_id = ?`,
			[TRANSFER, EXPENSE, TRANSFER, l.id]
		);
		if (
			!sameAmount(updated.current_balance, l.current_balance) ||
			!sameAmount(updated.total_amount, flows.borrowed + flows.charged) ||
			!sameAmount(updated.current_balance, updated.total_amount - flows.repaid)
		) {
			fail(`liability ${l.id} doesn't add up after migration`);
		}
	}

	const leftover = await db.getFirstAsync(
		`SELECT
			(SELECT COUNT(*) FROM transactions WHERE category_id IN (${inList(loanCategories)})) +
			(SELECT COUNT(*) FROM bills WHERE category_id IN (${inList(loanCategories)})) AS n`
	);
	if (leftover?.n) fail("rows still use the loan categories");
}

// Seed type tables with enum values if empty
export async function seedTypeTables(db: any) {
	// Account Types
	const accountTypes = [
		"Bank Account",
		"Mobile Money",
		"Cash",
		"Credit Card",
		"Other",
	];
	for (const name of accountTypes) {
		await db.runAsync("INSERT OR IGNORE INTO account_types (name) VALUES (?)", [
			name,
		]);
	}
	// Asset Types
	const assetTypes = [
		"Real Estate",
		"Vehicle",
		"Stock",
		"Bond",
		"Cryptocurrency",
		"Physical Good",
		"Other",
	];
	for (const name of assetTypes) {
		await db.runAsync("INSERT OR IGNORE INTO asset_types (name) VALUES (?)", [
			name,
		]);
	}
	// Liability Types
	const liabilityTypes = [
		"Personal Loan",
		"Car Loan",
		"Mortgage",
		"Credit Card Debt",
		"Student Loan",
		"Other",
	];
	for (const name of liabilityTypes) {
		await db.runAsync(
			"INSERT OR IGNORE INTO liability_types (name) VALUES (?)",
			[name],
		);
	}
	// Transaction Types
	const transactionTypes = ["Income", "Expense", "Transfer"];
	for (const name of transactionTypes) {
		await db.runAsync(
			"INSERT OR IGNORE INTO transaction_types (name) VALUES (?)",
			[name],
		);
	}
}

// Seed categories with default values if empty
export async function seedCategories(db: any) {
	// First, check if categories table is empty
	const existingCategories = await db.getAllAsync(
		"SELECT COUNT(*) as count FROM categories",
	);
	const count = existingCategories[0]?.count || 0;

	if (count === 0) {
		// Get transaction type IDs
		const transactionTypes = await db.getAllAsync(
			"SELECT * FROM transaction_types",
		);
		const incomeType = transactionTypes.find((t: any) => t.name === "Income");
		const expenseType = transactionTypes.find((t: any) => t.name === "Expense");

		if (incomeType && expenseType) {
			const defaultCategories = [
				// Income categories
				{ name: "Salary", transaction_type_id: incomeType.id },
				{ name: "Freelance", transaction_type_id: incomeType.id },
				{ name: "Investment", transaction_type_id: incomeType.id },
				{ name: "Business", transaction_type_id: incomeType.id },
				{ name: "Assets", transaction_type_id: incomeType.id },
				{ name: "Gifts", transaction_type_id: incomeType.id },
				{ name: "Refunds", transaction_type_id: incomeType.id },
				{ name: "Interest", transaction_type_id: incomeType.id },
				{ name: "Dividends", transaction_type_id: incomeType.id },
				{ name: "Other Earnings", transaction_type_id: incomeType.id },

				// Expense categories
				{ name: "Food & Dining", transaction_type_id: expenseType.id },
				{ name: "Transportation", transaction_type_id: expenseType.id },
				{ name: "Housing", transaction_type_id: expenseType.id },
				{ name: "Utilities", transaction_type_id: expenseType.id },
				{ name: "Healthcare", transaction_type_id: expenseType.id },
				{ name: "Entertainment", transaction_type_id: expenseType.id },
				{ name: "Shopping", transaction_type_id: expenseType.id },
				{ name: "Education", transaction_type_id: expenseType.id },
				{ name: "Insurance", transaction_type_id: expenseType.id },
				{ name: "Taxes", transaction_type_id: expenseType.id },
				{ name: "Gifts", transaction_type_id: expenseType.id },
				{ name: "Subscriptions", transaction_type_id: expenseType.id },
				{ name: "Travel", transaction_type_id: expenseType.id },
				{ name: "Repairs & Maintenance", transaction_type_id: expenseType.id },
				{ name: "Personal Care", transaction_type_id: expenseType.id },
				{ name: "Giveaways", transaction_type_id: expenseType.id },
				{ name: "Miscellaneous", transaction_type_id: expenseType.id },
				{ name: CHARGES_CATEGORY, transaction_type_id: expenseType.id },
			];

			for (const category of defaultCategories) {
				await db.runAsync(
					"INSERT INTO categories (name, transaction_type_id, created_at) VALUES (?, ?, ?)",
					[
						category.name,
						category.transaction_type_id,
						new Date().toISOString(),
					],
				);
			}
		}
	}
}

// Hook to get database context (no initialization here)
export function useDatabase() {
	return useSQLiteContext();
}

// Hook to initialize database once at app level
export function useDatabaseInitialization() {
	const db = useSQLiteContext();
	const [isInitialized, setIsInitialized] = React.useState(false);
	const [isInitializing, setIsInitializing] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);
	const [attempt, setAttempt] = React.useState(0);

	React.useEffect(() => {
		let isMounted = true;

		const initialize = async () => {
			try {
				setIsInitializing(true);
				setError(null);
				await initDatabase(db);

				if (isMounted) {
					setIsInitialized(true);
				}
			} catch (e: any) {
				if (isMounted) {
					setError(e.message || "Failed to initialize database");
				}
			} finally {
				if (isMounted) {
					setIsInitializing(false);
				}
			}
		};

		initialize();

		return () => {
			isMounted = false;
		};
	}, [db, attempt]);

	const retry = React.useCallback(() => setAttempt((n) => n + 1), []);

	return { isInitialized, isInitializing, error, retry };
}

// Known application tables — used as an allowlist in clearDatabase
const APP_TABLES = new Set([
	"account_types",
	"asset_types",
	"liability_types",
	"transaction_types",
	"envelopes",
	"accounts",
	"assets",
	"entities",
	"liabilities",
	"categories",
	"receivables",
	"bills",
	"transactions",
	"budgets",
	"savings_goals",
	"bill_rules", // legacy — may exist on older installs
]);

// Clear database and reset to initial state
export async function clearDatabase(db: any) {
	try {
		const tableNames = await db.getAllAsync(
			"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
		);
		const tables: string[] = tableNames.map((t: any) => t.name);

		// Disable FK enforcement so tables can be dropped in any order
		await db.execAsync("PRAGMA foreign_keys = OFF;");
		for (const table of tables) {
			if (!APP_TABLES.has(table)) continue; // skip unknown tables
			await db.runAsync(`DROP TABLE IF EXISTS "${table}"`);
		}
		await db.execAsync("PRAGMA foreign_keys = ON;");

		// Re-initialize database
		await initDatabase(db);
	} catch (error) {
		console.log("Clear database error:", error);
		// Let the caller tell the user — a silent failure would look like success.
		throw error;
	}
}
