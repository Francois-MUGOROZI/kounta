import { useSQLiteContext } from "expo-sqlite";
import React from "react";

// Database initialization and seeding
export async function initDatabase(db: any) {
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
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS accounts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			account_type_id INTEGER NOT NULL,
			currency TEXT NOT NULL,
			opening_balance REAL NOT NULL,
			current_balance REAL NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (account_type_id) REFERENCES account_types(id)
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS assets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			asset_type_id INTEGER NOT NULL,
			currency TEXT NOT NULL,
			initial_value REAL NOT NULL,
			current_value REAL NOT NULL,
			created_at TEXT NOT NULL,
			notes TEXT,
			FOREIGN KEY (asset_type_id) REFERENCES asset_types(id)
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS liabilities (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			liability_type_id INTEGER NOT NULL,
			currency TEXT NOT NULL,
			total_amount REAL NOT NULL,
			current_balance REAL NOT NULL,
			created_at TEXT NOT NULL,
			notes TEXT,
			FOREIGN KEY (liability_type_id) REFERENCES liability_types(id)
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			transaction_type_id INTEGER NOT NULL,
			created_at TEXT NOT NULL,
			FOREIGN KEY (transaction_type_id) REFERENCES transaction_types(id)
		);
	`);
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			description TEXT NOT NULL,
			amount REAL NOT NULL,
			transaction_type_id INTEGER NOT NULL,
			date TEXT NOT NULL,
			account_id INTEGER NOT NULL,
			category_id INTEGER NOT NULL,
			asset_id INTEGER,
			liability_id INTEGER,
			FOREIGN KEY (transaction_type_id) REFERENCES transaction_types(id),
			FOREIGN KEY (account_id) REFERENCES accounts(id),
			FOREIGN KEY (category_id) REFERENCES categories(id),
			FOREIGN KEY (asset_id) REFERENCES assets(id),
			FOREIGN KEY (liability_id) REFERENCES liabilities(id)
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
}

// Run database migrations
async function runMigrations(db: any) {
	try {
		// Migration: Add notes column to liabilities table if it doesn't exist
		const liabilitiesColumns = await db.getAllAsync(
			"PRAGMA table_info(liabilities)"
		);
		const hasNotesColumn = liabilitiesColumns.some(
			(col: any) => col.name === "notes"
		);

		if (!hasNotesColumn) {
			await db.execAsync("ALTER TABLE liabilities ADD COLUMN notes TEXT");
			console.log("Added notes column to liabilities table");
		}
	} catch (error) {
		console.log("Migration error:", error);
	}
}

// Seed type tables with enum values if empty
export async function seedTypeTables(db: any) {
	// Account Types
	const accountTypes = [
		"Bank Account",
		"Mobile Money",
		"Cash",
		"Credit Card",
		"Investment Account",
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
			[name]
		);
	}
	// Transaction Types
	const transactionTypes = ["Income", "Expense"];
	for (const name of transactionTypes) {
		await db.runAsync(
			"INSERT OR IGNORE INTO transaction_types (name) VALUES (?)",
			[name]
		);
	}
}

// Seed categories with default values if empty
export async function seedCategories(db: any) {
	// First, check if categories table is empty
	const existingCategories = await db.getAllAsync(
		"SELECT COUNT(*) as count FROM categories"
	);
	const count = existingCategories[0]?.count || 0;

	if (count === 0) {
		// Get transaction type IDs
		const transactionTypes = await db.getAllAsync(
			"SELECT * FROM transaction_types"
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
				{ name: "Other Income", transaction_type_id: incomeType.id },

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
				{ name: "Other Expenses", transaction_type_id: expenseType.id },
			];

			for (const category of defaultCategories) {
				await db.runAsync(
					"INSERT INTO categories (name, transaction_type_id, created_at) VALUES (?, ?, ?)",
					[
						category.name,
						category.transaction_type_id,
						new Date().toISOString(),
					]
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
	}, [db]);

	return { isInitialized, isInitializing, error };
}
