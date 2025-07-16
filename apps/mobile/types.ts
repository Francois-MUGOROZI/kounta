/**
 * Represents a financial account where money is held.
 * Corresponds to the 'accounts' table/model.
 */
export interface Account {
	name: string;
	type_id: string; // Foreign key to AccountType
	currency: string; // ISO 4217 currency code (e.g., "RWF", "USD")
	opening_balance: number;
	current_balance?: number; // Optional, can be calculated from transactions
	created_at: Date;
}

/**
 * Represents a category for classifying transactions.
 * Corresponds to the 'categories' table/model.
 */
export interface Category {
	name: string;
	type_id: string; // Foreign key to TransactionType
	created_at: Date;
}

/**
 * Represents an item of value that the user owns.
 * Corresponds to the 'assets' table/model.
 */
export interface Asset {
	name: string;
	type_id: string; // Foreign key to AssetType
	currency: string;
	initial_value: number; // The initial purchase value
	current_value: number; // Current market value
	created_at: Date;
}

/**
 * Represents a debt or financial obligation.
 * Corresponds to the 'liabilities' table/model.
 */
export interface Liability {
	name: string;
	type_id: string; // Foreign key to LiabilityType
	currency: string;
	total_amount: number; // The original amount of the debt
	current_balance: number; // The remaining amount to be paid
	created_at: Date;
}

/**
 * Represents a single financial transaction.
 * This is the central entity of the application.
 * Corresponds to the 'transactions' table/model.
 */
export interface Transaction {
	description: string;
	amount: number; // Always a positive value
	type_id: string; // Foreign key to TransactionType
	date: Date;

	// Foreign Keys (as stored in the DB)
	account_id: string;
	category_id: string;
	asset_id?: string | null;
	liability_id?: string | null;
}

/**
 * Represents a user-defined budget for a specific category.
 */
export interface Budget {
	category_id: string;
	amount: number; // The budgeted amount for the period
	period: "Monthly" | "Yearly"; // The budget period
	created_at: Date;
}

/**
 * Represents a user-defined savings goal.
 */
export interface SavingsGoal {
	name: string;
	target_amount: number;
	current_amount: number;
	target_date?: Date | null;
	created_at: Date;
}

/**
 * Defines the shape of the data required for the main dashboard.
 */
export interface DashboardData {
	netWorth: number;
	monthlyTotals: {
		income: number;
		expense: number;
	};
	topSpendingCategories: {
		category_name: string;
		amount: number;
	}[];
	upcomingBills: Transaction[];
}
