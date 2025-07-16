# Kounta: Core Type Definitions

This file contains all the core TypeScript types, interfaces, and enums for the
Kounta application. It is based on the established technical guidelines and
serves as a single source of truth for our data structures.

**Version:** 1.0  
**Date:** July 15, 2025

---

## Enums

### TransactionType

```typescript
/**
 * Defines the fundamental types of transactions.
 */
export enum TransactionType {
	Income = "Income",
	Expense = "Expense",
}
```

### AccountType

```typescript
/**
 * Defines the types of financial accounts a user can have.
 */
export enum AccountType {
	BankAccount = "Bank Account",
	MobileMoney = "Mobile Money",
	Cash = "Cash",
	CreditCard = "Credit Card",
	Investment = "Investment Account",
	Other = "Other",
}
```

### AssetType

```typescript
/**
 * Defines the types of assets a user can own.
 */
export enum AssetType {
	RealEstate = "Real Estate",
	Vehicle = "Vehicle",
	Stock = "Stock",
	Bond = "Bond",
	Crypto = "Cryptocurrency",
	PhysicalGood = "Physical Good",
	Other = "Other",
}
```

### LiabilityType

```typescript
/**
 * Defines the types of liabilities a user can have.
 */
export enum LiabilityType {
	PersonalLoan = "Personal Loan",
	CarLoan = "Car Loan",
	Mortgage = "Mortgage",
	CreditCardDebt = "Credit Card Debt",
	StudentLoan = "Student Loan",
	Other = "Other",
}
```

---

## Core Entity Interfaces

These interfaces represent the main records in our database.

### Account

```typescript
/**
 * Represents a financial account where money is held.
 * Corresponds to the 'accounts' table/model.
 */
export interface Account {
	id: string; // Unique ID from WatermelonDB
	name: string;
	type: AccountType;
	currency: string; // ISO 4217 currency code (e.g., "RWF", "USD")
	opening_balance: number;
	created_at: Date;
}
```

### Category

```typescript
/**
 * Represents a category for classifying transactions.
 * Corresponds to the 'categories' table/model.
 */
export interface Category {
	id: string;
	name: string;
	type: TransactionType; // Can only be 'Income' or 'Expense'
	created_at: Date;
}
```

### Asset

```typescript
/**
 * Represents an item of value that the user owns.
 * Corresponds to the 'assets' table/model.
 */
export interface Asset {
	id: string;
	name: string;
	type: AssetType;
	currency: string;
	value: number; // Current market value
	created_at: Date;
}
```

### Liability

```typescript
/**
 * Represents a debt or financial obligation.
 * Corresponds to the 'liabilities' table/model.
 */
export interface Liability {
	id: string;
	name: string;
	type: LiabilityType;
	currency: string;
	total_amount: number; // The original amount of the debt
	current_balance: number; // The remaining amount to be paid
	created_at: Date;
}
```

### Transaction

```typescript
/**
 * Represents a single financial transaction.
 * This is the central entity of the application.
 * Corresponds to the 'transactions' table/model.
 */
export interface Transaction {
	id: string;
	description: string;
	amount: number; // Always a positive value
	type: TransactionType;
	date: Date;

	// Foreign Keys (as stored in the DB)
	account_id: string;
	category_id: string;
	asset_id?: string | null;
	liability_id?: string | null;

	// Populated relations (for use in the app)
	account?: Account;
	category?: Category;
	asset?: Asset;
	liability?: Liability;
}
```

---

## Feature & UI-Specific Types

### Budget

```typescript
/**
 * Represents a user-defined budget for a specific category.
 */
export interface Budget {
	id: string;
	category_id: string;
	amount: number; // The budgeted amount for the period
	period: "Monthly" | "Yearly"; // The budget period
	created_at: Date;
}
```

### SavingsGoal

```typescript
/**
 * Represents a user-defined savings goal.
 */
export interface SavingsGoal {
	id: string;
	name: string;
	target_amount: number;
	current_amount: number;
	target_date?: Date | null;
	created_at: Date;
}
```

### DashboardData

```typescript
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
```
