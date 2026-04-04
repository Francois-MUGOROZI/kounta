import { SQLiteDatabase } from "expo-sqlite";
import type {
	DashboardTotals,
	GroupedByType,
	CategoryTotal,
	EnvelopeTotal,
} from "../types";
import { addDays, format } from "date-fns";

export const DashboardRepository = {
	// Get all top-level stats grouped by currency
	async getTotalsByCurrency(db: SQLiteDatabase): Promise<DashboardTotals[]> {
		const today = format(new Date(), "yyyy-MM-dd");
		const nextThirtyDays = format(addDays(new Date(), 30), "yyyy-MM-dd");
		// Accounts
		const accounts = await db.getAllAsync(
			`SELECT currency, SUM(current_balance) as accountBalance FROM accounts GROUP BY currency`
		);
		// Assets
		const assets = await db.getAllAsync(
			`SELECT currency, SUM(current_valuation) as assetValue FROM assets GROUP BY currency`
		);
		// Liabilities
		const liabilities = await db.getAllAsync(
			`SELECT currency, SUM(current_balance) as liabilityValue FROM liabilities WHERE current_balance > 0 GROUP BY currency`
		);
		// Receivables (Active only)
		const receivables = await db.getAllAsync(
			`SELECT currency, SUM(current_balance) as receivableValue FROM receivables WHERE status = 'Active' GROUP BY currency`
		);
		// Transactions (income/expense)
		const income = await db.getAllAsync(
			`SELECT a.currency, SUM(t.amount) as totalIncome FROM transactions t JOIN accounts a ON t.to_account_id = a.id WHERE t.transaction_type_id = (SELECT id FROM transaction_types WHERE name = 'Income') GROUP BY a.currency`
		);
		const expenses = await db.getAllAsync(
			`SELECT a.currency, SUM(t.amount) as totalExpenses FROM transactions t JOIN accounts a ON t.from_account_id = a.id WHERE t.transaction_type_id = (SELECT id FROM transaction_types WHERE name = 'Expense') GROUP BY a.currency`
		);

		const unpaidBills = await db.getAllAsync(
			`SELECT SUM(bills.amount - bills.paid_amount) as totalUnpaidBills, bills.currency as currency FROM bills WHERE bills.status != 'Paid' AND (date(bills.due_date) < date(?) OR (date(bills.due_date) >= date(?) AND date(bills.due_date) <= date(?))) GROUP BY bills.currency`,
			[today, today, nextThirtyDays]
		);

		// Merge all by currency
		const currencies = [
			...new Set([
				...accounts.map((a: any) => a.currency),
				...assets.map((a: any) => a.currency),
				...liabilities.map((l: any) => l.currency),
				...receivables.map((r: any) => r.currency),
				...income.map((i: any) => i.currency),
				...expenses.map((e: any) => e.currency),
				...unpaidBills.map((b: any) => b.currency),
			]),
		];

		return currencies.map((currency) => {
			const acc = accounts.find((a: any) => a.currency === currency);
			const ast = assets.find((a: any) => a.currency === currency);
			const liab = liabilities.find((l: any) => l.currency === currency);
			const inc = income.find((i: any) => i.currency === currency);
			const exp = expenses.find((e: any) => e.currency === currency);
			const unpaid = unpaidBills.find((b: any) => b.currency === currency);

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
			const recv = receivables.find((r: any) => r.currency === currency);
			const receivableValue =
				recv && (recv as any)["receivableValue"]
					? Number((recv as any)["receivableValue"])
					: 0;
			const totalIncome =
				inc && (inc as any)["totalIncome"]
					? Number((inc as any)["totalIncome"])
					: 0;
			const totalExpenses =
				exp && (exp as any)["totalExpenses"]
					? Number((exp as any)["totalExpenses"])
					: 0;
			const totalUnpaidBills =
				unpaid && (unpaid as any)["totalUnpaidBills"]
					? Number((unpaid as any)["totalUnpaidBills"])
					: 0;

			const netWorth = accountBalance + assetValue + receivableValue - liabilityValue;

			const returnValue = {
				currency,
				totalIncome,
				totalExpenses,
				totalUnpaidBills,
				accountBalance,
				assetValue,
				liabilityValue,
				receivableValue,
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
			`SELECT at.name as type, a.currency, COUNT(a.id) as count, SUM(a.current_valuation) as total FROM assets a JOIN asset_types at ON a.asset_type_id = at.id GROUP BY a.currency, at.name`
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
		const start = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
		const end = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");
		return await db.getAllAsync(
			`SELECT c.name as category, SUM(t.amount) as total, a.currency FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.from_account_id = a.id WHERE t.transaction_type_id = (SELECT id FROM transaction_types WHERE name = 'Expense') AND a.currency = ? AND t.date >= ? AND t.date <= ? GROUP BY c.name, a.currency`,
			[currency, start, end]
		);
	},

	async getExpensesByCategoryAndCurrency(
		db: SQLiteDatabase
	): Promise<CategoryTotal[]> {
		return await db.getAllAsync(
			`SELECT c.name as category, SUM(t.amount) as total, COALESCE(a.currency, ast.currency) as currency FROM transactions t JOIN categories c ON t.category_id = c.id LEFT JOIN accounts a ON t.from_account_id = a.id LEFT JOIN assets ast ON t.asset_id = ast.id WHERE t.transaction_type_id = (SELECT id FROM transaction_types WHERE name = 'Expense') GROUP BY c.name, COALESCE(a.currency, ast.currency) ORDER BY total DESC`
		);
	},
	// Income by category (this month, per currency)
	async getIncomeByCategoryThisMonth(
		db: SQLiteDatabase,
		currency: string
	): Promise<CategoryTotal[]> {
		const now = new Date();
		const start = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
		const end = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");
		return await db.getAllAsync(
			`SELECT c.name as category, SUM(t.amount) as total, a.currency FROM transactions t JOIN categories c ON t.category_id = c.id JOIN accounts a ON t.to_account_id = a.id WHERE t.transaction_type_id = (SELECT id FROM transaction_types WHERE name = 'Income') AND a.currency = ? AND t.date >= ? AND t.date <= ? GROUP BY c.name, a.currency`,
			[currency, start, end]
		);
	},

	async getEnvelopeByCurrency(db: SQLiteDatabase): Promise<EnvelopeTotal[]> {
		return await db.getAllAsync(
			`SELECT currency,name, SUM(total_amount) as total, SUM(current_balance) as balance FROM envelopes GROUP BY currency,name`
		);
	},

	async getReceivablesByTypeAndCurrency(
		db: SQLiteDatabase
	): Promise<GroupedByType[]> {
		return await db.getAllAsync(
			`SELECT r.type as type, r.currency, COUNT(r.id) as count, SUM(r.current_balance) as total FROM receivables r WHERE r.status = 'Active' GROUP BY r.currency, r.type`
		);
	},
};
