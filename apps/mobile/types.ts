// Dashboard Aggregation Types
export interface DashboardTotals {
	currency: string;
	totalIncome: number;
	totalExpenses: number;
	totalUnpaidBills: number;
	accountBalance: number;
	assetValue: number;
	liabilityValue: number;
	netWorth: number;
}

export interface GroupedByType {
	type: string;
	count: number;
	total: number;
	currency: string;
}

export interface CategoryTotal {
	category: string;
	total: number;
	currency: string;
}

export interface EnvelopeTotal {
	name: string;
	currency: string;
	total: number;
	balance: number;
}

/**
 * Represents a financial account where money is held.
 * Corresponds to the 'accounts' table/model.
 */
export interface Account {
	id: number;
	name: string;
	account_number?: string | null;
	account_type_id: number;
	currency: string;
	opening_balance: number;
	current_balance: number;
	created_at: string;
}

export interface AccountType {
	id: number;
	name: string;
}

/**
 * Represents a category for classifying transactions.
 * Corresponds to the 'categories' table/model.
 */
export interface Category {
	id: number;
	name: string;
	transaction_type_id: number;
	created_at: string;
}

/**
 * Represents a type of asset (e.g., "Real Estate", "Stocks", "Vehicles").
 * Corresponds to the 'asset_types' table/model.
 */
export interface AssetType {
	id: number;
	name: string;
}

/**
 * Represents a type of liability (e.g., "Personal Loan", "Mortgage", "Credit Card Debt").
 * Corresponds to the 'liability_types' table/model.
 */
export interface LiabilityType {
	id: number;
	name: string;
}

/**
 * Represents a type of transaction (e.g., "Income", "Expense").
 * Corresponds to the 'transaction_types' table/model.
 */
export interface TransactionType {
	id: number;
	name: string;
}

/**
 * Represents an item of value that the user owns.
 * Corresponds to the 'assets' table/model.
 */
export interface Asset {
	id: number;
	name: string;
	asset_type_id: number; // Foreign key to AssetType
	currency: string;
	initial_value: number; // The initial purchase value
	current_value: number; // Current market value
	created_at: string;
	notes?: string | null;
}

/**
 * Represents a debt or financial obligation.
 * Corresponds to the 'liabilities' table/model.
 */
export interface Liability {
	id: number;
	name: string;
	liability_type_id: number; // Foreign key to LiabilityType
	currency: string;
	total_amount: number; // The original amount of the debt
	current_balance: number; // The remaining amount to be paid
	created_at: string;
	notes?: string | null;
}

/**
 * Represents a single financial transaction.
 * This is the central entity of the application.
 * Corresponds to the 'transactions' table/model.
 */
export interface Transaction {
	id: number;
	description: string;
	amount: number; // Always a positive value
	transaction_type_id: number; // Foreign key to TransactionType
	date: string; // Date as ISO string
	category_id: number; // Foreign key to Category
	asset_id?: number | null; // Foreign key to Asset (optional)
	liability_id?: number | null; // Foreign key to Liability (optional)
	from_account_id?: number | null;
	to_account_id?: number | null;
	envelope_id?: number | null;
	bill_id?: number | null; // Foreign key to Bill (optional)
}

/** Envelope
 * Represents a envelope for money allocations.
 */

export interface Envelope {
	id: number;
	name: string;
	total_amount: number;
	current_balance: number;
	currency: string;
	purpose?: string | null;
	created_at?: string; // ISO date string
}

/**
 * Bill Frequency enum for recurring bills
 */
export type BillFrequency =
	| "Monthly"
	| "Yearly"
	| "OneTime"
	| "Weekly"
	| "Quarterly";

/**
 * Bill Status enum
 */
export type BillStatus = "Pending" | "Paid" | "Overdue";

/**
 * Represents a bill rule (master template) for recurring or one-time bills.
 * Corresponds to the 'bill_rules' table/model.
 */
export interface BillRule {
	id: number;
	name: string;
	amount: number;
	frequency: BillFrequency;
	category_id: number; // Foreign key to Category (MANDATORY)
	is_active: boolean;
	start_date: string; // ISO date string
	auto_next: boolean; // Auto-generate next bill when current is paid/overdue
	currency: string; // Currency code (e.g., 'RWF', 'USD')
	created_at: string; // ISO date string
}

/**
 * Represents a specific bill instance (obligation event).
 * Corresponds to the 'bills' table/model.
 */
export interface Bill {
	id: number;
	name: string; // Populated from bill_rule.name via JOIN or user-provided for one-time bills
	currency: string; // Populated from bill_rule.currency via JOIN or user-provided for one-time bills
	bill_rule_id: number | null; // Foreign key to BillRule (null for one-time bills)
	due_date: string; // ISO date string
	amount: number;
	status: BillStatus;
	transaction_id?: number | null; // Foreign key to Transaction (when paid)
	category_id: number; // Foreign key to Category
	paid_at?: string | null; // ISO date string
	created_at: string; // ISO date string
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

// Transaction filter type for type-safe filtering
export type TransactionFilter = {
	transactionTypeId?: number;
	categoryId?: number;
	startDate?: string;
	endDate?: string;
	period?: string;
};
