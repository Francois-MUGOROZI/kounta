import { SQLiteDatabase } from "expo-sqlite";
import type {
	DashboardTotals,
	GroupedByType,
	CategoryTotal,
	Envelope,
	EnvelopeTotal,
} from "../types";

export const DashboardRepository = {
	// Get all top-level stats grouped by currency
	async getTotalsByCurrency(db: SQLiteDatabase): Promise<DashboardTotals[]> {
		// Accounts
		const accounts = await db.getAllAsync(
			`SELECT currency, SUM(current_balance) as accountBalance FROM accounts GROUP BY currency`
		);
		// Assets
		const assets = await db.getAllAsync(
			`SELECT currency, SUM(current_value) as assetValue FROM assets GROUP BY currency`
		);
		// Liabilities
		const liabilities = await db.getAllAsync(
			`SELECT currency, SUM(current_balance) as liabilityValue FROM liabilities WHERE current_balance > 0 GROUP BY currency`
		);
		// Transactions (income/expense)
		const income = await db.getAllAsync(
			`SELECT a.currency, SUM(t.amount) as totalIncome FROM transactions t JOIN accounts a ON t.to_account_id = a.id WHERE t.transaction_type_id = 1 GROUP BY a.currency`
		);
		const expenses = await db.getAllAsync(
			`SELECT a.currency, SUM(t.amount) as totalExpenses FROM transactions t JOIN accounts a ON t.from_account_id = a.id WHERE t.transaction_type_id = 2 GROUP BY a.currency`
		);

		// Merge all by currency
		const currencies = [
			...new Set([
				...accounts.map((a: any) => a.currency),
				...assets.map((a: any) => a.currency),
				...liabilities.map((l: any) => l.currency),
				...income.map((i: any) => i.currency),
				...expenses.map((e: any) => e.currency),
			]),
		];

		return currencies.map((currency) => {
			const acc = accounts.find((a: any) => a.currency === currency);
			const ast = assets.find((a: any) => a.currency === currency);
			const liab = liabilities.find((l: any) => l.currency === currency);
			const inc = income.find((i: any) => i.currency === currency);
			const exp = expenses.find((e: any) => e.currency === currency);

			const accountBalance =
				acc && (acc as any)["accountBalance"]
					? Number((acc as any)["accountBalance"])
					: 0;
			const assetValue =
				ast && (ast as any)["assetValue"]
					? Number((ast as any)["assetValue"])
					: 0;
			const liabilityValue =
				liab && (liab as any)["liabilityValue"]
					? Number((liab as any)["liabilityValue"])
					: 0;
			const totalIncome =
				inc && (inc as any)["totalIncome"]
					? Number((inc as any)["totalIncome"])
					: 0;
			const totalExpenses =
				exp && (exp as any)["totalExpenses"]
					? Number((exp as any)["totalExpenses"])
					: 0;
			const netWorth = accountBalance + assetValue - liabilityValue;

			const returnValue = {
				currency,
				totalIncome,
				totalExpenses,
				accountBalance,
				assetValue,
				liabilityValue,
				netWorth,
			};
			return returnValue;
		});
	},

	// Grouped summaries by type (accounts, assets, liabilities)
	async getAccountsByTypeAndCurrency(
		db: SQLiteDatabase
	): Promise<GroupedByType[]> {
		return await db.getAllAsync(
			`SELECT at.name as type, a.currency, COUNT(a.id) as count, SUM(a.current_balance) as total FROM accounts a JOIN account_types at ON a.account_type_id = at.id GROUP BY a.currency, at.name`
		);
	},
	async getAssetsByTypeAndCurrency(
		db: SQLiteDatabase
	): Promise<GroupedByType[]> {
		return await db.getAllAsync(
			`SELECT at.name as type, a.currency, COUNT(a.id) as count, SUM(a.current_value) as total FROM assets a JOIN asset_types at ON a.asset_type_id = at.id GROUP BY a.currency, at.name`
		);
	},
	async getLiabilitiesByTypeAndCurrency(
		db: SQLiteDatabase
	): Promise<GroupedByType[]> {
		return await db.getAllAsync(
			`SELECT lt.name as type, l.currency, COUNT(l.id) as count, SUM(l.current_balance) as total FROM liabilities l JOIN liability_types lt ON l.liability_type_id = lt.id WHERE l.current_balance > 0 GROUP BY l.currency, lt.name`
		);
	},

	// Expenses by category (this month, per currency)
	async getExpensesByCategoryThisMonth(
		db: SQLiteDatabase,
		currency: string
	): Promise<CategoryTotal[]> {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
		const end = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			0,
			23,
			59,
			59,
			999
		).toISOString();
		return await db.getAllAsync(
			`SELECT c.name as category, SUM(t.amount) as total, a.currency FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.from_account_id = a.id WHERE t.transaction_type_id = 2 AND a.currency = ? AND t.date >= ? AND t.date <= ? GROUP BY c.name, a.currency`,
			[currency, start, end]
		);
	},

	async getExpensesByCategoryAndCurrency(
		db: SQLiteDatabase
	): Promise<CategoryTotal[]> {
		return await db.getAllAsync(
			`SELECT c.name as category, SUM(t.amount) as total, a.currency FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.from_account_id = a.id WHERE t.transaction_type_id = 2 GROUP BY c.name, a.currency ORDER BY total DESC`
		);
	},
	// Income by category (this month, per currency)
	async getIncomeByCategoryThisMonth(
		db: SQLiteDatabase,
		currency: string
	): Promise<CategoryTotal[]> {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
		const end = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			0,
			23,
			59,
			59,
			999
		).toISOString();
		return await db.getAllAsync(
			`SELECT c.name as category, SUM(t.amount) as total, a.currency FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.to_account_id = a.id WHERE t.transaction_type_id = 1 AND a.currency = ? AND t.date >= ? AND t.date <= ? GROUP BY c.name, a.currency`,
			[currency, start, end]
		);
	},

	async getEnvelopeByCurrency(db: SQLiteDatabase): Promise<EnvelopeTotal[]> {
		return await db.getAllAsync(
			`SELECT currency,name, SUM(total_amount) as total, SUM(current_balance) as balance FROM envelopes GROUP BY currency,name`
		);
	},
};
