// Dashboard Aggregation Types
export interface DashboardTotals {
	currency: string;
	totalIncome: number;
	totalExpenses: number;
	totalUnpaidBills: number;
	accountBalance: number;
	assetValue: number;
	liabilityValue: number;
	receivableValue: number;
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
 * Receivable type enum — categorizes what kind of receivable this is.
 */
export type ReceivableType =
	| "Salary"
	| "Personal-Loan"
	| "Refund"
	| "Deposit"
	| "IOU"
	| "Interest";

/**
 * Receivable status enum
 */
export type ReceivableStatus = "Pending" | "Active" | "Settled" | "Written-Off";

/**
 * Represents a counterparty — an individual or organization.
 * Can be linked to receivables and liabilities.
 */
export interface Entity {
	id: number;
	name: string;
	phone_number?: string | null;
	is_individual: boolean;
	id_number?: string | null;
	metadata?: string | null;
	created_at: string;
}

/**
 * Represents money owed to the user.
 * Receivables are "Asset Accounts" that track obligations from entities.
 */
export interface Receivable {
	id: number;
	entity_id: number;
	title: string;
	type: ReceivableType;
	currency: string;
	principal: number;
	interest_rate: number;
	current_balance: number;
	status: ReceivableStatus;
	requires_outflow: boolean;
	due_date?: string | null;
	notes?: string | null;
	created_at: string;
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
	initial_cost: number; // First out-of-pocket cash payment
	contributions: number; // Total subsequent manual cash top-ups
	reinvestments: number; // Total interest/dividends kept inside the asset
	withdrawals: number; // Total value/principal taken back out
	current_valuation: number; // Current market/sellable value
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
	entity_id?: number | null;
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
	category_id: number | null; // Foreign key to Category (null for Transfer transactions)
	asset_id?: number | null; // Foreign key to Asset (optional)
	liability_id?: number | null; // Foreign key to Liability (optional)
	from_account_id?: number | null;
	to_account_id?: number | null;
	envelope_id?: number | null;
	bill_id?: number | null; // Foreign key to Bill (optional)
	receivable_id?: number | null;
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
 * Bill Status enum
 */
export type BillStatus = "Pending" | "Paid" | "Overdue";

/**
 * Represents a specific bill instance (obligation event).
 * Corresponds to the 'bills' table/model.
 */
export interface Bill {
	id: number;
	name: string;
	currency: string;
	due_date: string; // ISO date string
	amount: number;
	paid_amount: number;
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
	accountId?: number;
	assetId?: number;
	liabilityId?: number;
	envelopeId?: number;
	billId?: number;
	receivableId?: number;
};

// React Navigation root stack param list
export type RootStackParamList = {
	Main: undefined;
	Categories: undefined;
	Assets: undefined;
	Liabilities: undefined;
	Types: undefined;
	BackupRestore: undefined;
	Bills: undefined;
	TransactionDetail: { transactionId: number };
	AccountDetail: { accountId: number };
	AssetDetail: { assetId: number };
	LiabilityDetail: { liabilityId: number };
	EnvelopeDetail: { envelopeId: number };
	Entities: undefined;
	EntityDetail: { entityId: number };
	Receivables: undefined;
	ReceivableDetail: { receivableId: number };
};
