import { useSQLiteContext } from "expo-sqlite";
import React from "react";
import {
	DEFAULT_ACCOUNT_TYPES,
	DEFAULT_ASSET_TYPES,
	DEFAULT_LIABILITY_TYPES,
} from "./constants/defaultTypes";
import {
	DEFAULT_EXPENSE_CATEGORIES,
	DEFAULT_INCOME_CATEGORIES,
} from "./constants/defaultCategories";

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

	await seedTypeTables(db);
	await seedCategories(db);
}

// Seed type tables on a fresh install. Account, asset and liability types are
// the user's to rename, so they are only seeded while their table is empty.
export async function seedTypeTables(db: any) {
	const defaults: [string, string[]][] = [
		["account_types", DEFAULT_ACCOUNT_TYPES],
		["asset_types", DEFAULT_ASSET_TYPES],
		["liability_types", DEFAULT_LIABILITY_TYPES],
	];
	for (const [table, names] of defaults) {
		const existing = await db.getFirstAsync(`SELECT COUNT(*) AS n FROM ${table}`);
		if (existing?.n) continue;
		for (const name of names) {
			await db.runAsync(`INSERT OR IGNORE INTO ${table} (name) VALUES (?)`, [name]);
		}
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
				...DEFAULT_INCOME_CATEGORIES.map((name) => ({
					name,
					transaction_type_id: incomeType.id,
				})),

				...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
					name,
					transaction_type_id: expenseType.id,
				})),
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
