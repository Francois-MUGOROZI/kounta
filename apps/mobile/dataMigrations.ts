import {
	DEFAULT_ACCOUNT_TYPES,
	DEFAULT_ASSET_TYPES,
	DEFAULT_LIABILITY_TYPES,
} from "./constants/defaultTypes";
import {
	DEFAULT_EXPENSE_CATEGORIES,
	DEFAULT_INCOME_CATEGORIES,
} from "./constants/defaultCategories";

// ─── Data migrations ──────────────────────────────────────────────────────────
// Versioned with PRAGMA user_version (stored in the database file, so restored
// backups are migrated too). Each version runs once, in order, in one SQL
// transaction; on failure it rolls back and it and later versions are retried
// on the next launch. Version 1 (loans to transfers) ran on every database in
// use and was removed in v3.1.1.

const MIGRATIONS: [number, (db: any) => Promise<void>][] = [
	[2, migrateWithdrawDepositCategories],
	[3, standardizeTypes],
	[4, standardizeIncomeCategories],
	[5, linkOwnerEntities],
	[6, standardizeExpenseCategories],
	[7, refileOwnerExpenses],
];

export async function runDataMigrations(db: any) {
	try {
		const row = await db.getFirstAsync("PRAGMA user_version;");
		const version: number = row?.user_version ?? 0;

		for (const [target, migrate] of MIGRATIONS) {
			if (version >= target) continue;
			await db.execAsync("BEGIN");
			try {
				await migrate(db);
				await db.execAsync(`PRAGMA user_version = ${target};`);
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

// v2 — one-time fix for money moved between the owner's accounts as an
// "Account Withdraw" expense and an "Account Deposit" income. Same-day pairs
// become one transfer; rows with no transfer counterpart (balance corrections,
// money of unknown source, a USD→RWF exchange) move into their account's
// opening balance. Every account's current balance stays the same. The
// repository is public, so only row IDs live here; a checksum of their amounts
// identifies the data. Any database that doesn't match is left untouched.
const V2_WITHDRAW_CATEGORY = 33;
const V2_DEPOSIT_CATEGORY = 34;
// [withdraw id, deposit id]
const V2_PAIRS: [number, number][] = [
	[11, 12],
	[20, 21],
	[37, 38],
	[49, 50],
];
const V2_TO_OPENING_BALANCE = [163, 164, 165, 232, 234, 238, 239, 572];
const V2_CHECKSUM = 1625891;
const EPSILON = 0.005;

const sameAmount = (a: number, b: number) => Math.abs(a - b) < EPSILON;
const inList = (ids: number[]) => ids.join(", ");

async function migrateWithdrawDepositCategories(db: any) {
	const categoryIds = [V2_WITHDRAW_CATEGORY, V2_DEPOSIT_CATEGORY];
	const manifestIds = [...V2_PAIRS.flat(), ...V2_TO_OPENING_BALANCE];

	// ── Applicability: only the database these IDs were taken from ───────
	const anchor = await db.getFirstAsync(
		"SELECT category_id FROM transactions WHERE id = ?",
		[V2_PAIRS[0][0]]
	);
	const categoryCount = await db.getFirstAsync(
		`SELECT COUNT(*) AS n FROM categories WHERE id IN (${inList(categoryIds)})`
	);
	const checksum = await db.getFirstAsync(
		`SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE id IN (${inList(manifestIds)})`
	);
	if (
		anchor?.category_id !== V2_WITHDRAW_CATEGORY ||
		categoryCount?.n !== 2 ||
		!sameAmount(checksum?.total ?? 0, V2_CHECKSUM)
	) {
		return;
	}

	const fail = (reason: string): never => {
		throw new Error(`Withdraw/deposit migration skipped: ${reason}`);
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
		`SELECT id, transaction_type_id FROM categories WHERE id IN (${inList(categoryIds)})`
	);
	const categoryType = (id: number) => categories.find((c) => c.id === id)?.transaction_type_id;
	if (categoryType(V2_WITHDRAW_CATEGORY) !== EXPENSE || categoryType(V2_DEPOSIT_CATEGORY) !== INCOME) {
		fail("categories changed type");
	}

	type Row = {
		id: number;
		amount: number;
		date: string;
		transaction_type_id: number;
		category_id: number | null;
		from_account_id: number | null;
		to_account_id: number | null;
		linked: number;
	};
	const rows: Row[] = await db.getAllAsync(
		`SELECT id, amount, date, transaction_type_id, category_id, from_account_id, to_account_id,
			(asset_id IS NOT NULL OR liability_id IS NOT NULL OR envelope_id IS NOT NULL OR bill_id IS NOT NULL
			 OR receivable_id IS NOT NULL OR entity_id IS NOT NULL) AS linked
		 FROM transactions WHERE category_id IN (${inList(categoryIds)})`
	);
	if (rows.length !== manifestIds.length || manifestIds.some((id) => !rows.some((r) => r.id === id))) {
		fail("the categories don't hold exactly the expected rows");
	}
	const rowById = (id: number) => rows.find((r) => r.id === id)!;

	// A withdraw only leaves an account and a deposit only enters one, with nothing else linked.
	for (const r of rows) {
		const isWithdraw =
			r.category_id === V2_WITHDRAW_CATEGORY &&
			r.transaction_type_id === EXPENSE &&
			r.from_account_id !== null &&
			r.to_account_id === null;
		const isDeposit =
			r.category_id === V2_DEPOSIT_CATEGORY &&
			r.transaction_type_id === INCOME &&
			r.to_account_id !== null &&
			r.from_account_id === null;
		if ((!isWithdraw && !isDeposit) || r.linked) fail(`row ${r.id} changed`);
	}

	const accounts: { id: number; currency: string; opening_balance: number; current_balance: number }[] =
		await db.getAllAsync("SELECT id, currency, opening_balance, current_balance FROM accounts");
	const accountById = (id: number) => accounts.find((a) => a.id === id) ?? fail(`account ${id} missing`);

	for (const [withdrawId, depositId] of V2_PAIRS) {
		const withdraw = rowById(withdrawId);
		const deposit = rowById(depositId);
		if (
			withdraw.category_id !== V2_WITHDRAW_CATEGORY ||
			deposit.category_id !== V2_DEPOSIT_CATEGORY ||
			!sameAmount(withdraw.amount, deposit.amount) ||
			withdraw.date.slice(0, 10) !== deposit.date.slice(0, 10) ||
			withdraw.from_account_id === deposit.to_account_id ||
			accountById(withdraw.from_account_id!).currency !== accountById(deposit.to_account_id!).currency
		) {
			fail(`pair ${withdrawId}/${depositId} changed`);
		}
	}

	const references = await db.getFirstAsync(
		`SELECT
			(SELECT COUNT(*) FROM bills WHERE category_id IN (${inList(categoryIds)}) OR transaction_id IN (${inList(manifestIds)})) +
			(SELECT COUNT(*) FROM budgets WHERE category_id IN (${inList(categoryIds)})) AS n`
	);
	if (references?.n) fail("a bill or budget uses these categories or rows");

	const touchedAccounts = new Set<number>();
	rows.forEach((r) => touchedAccounts.add((r.from_account_id ?? r.to_account_id)!));
	const derivedBalance = async (accountId: number) => {
		const flows = await db.getFirstAsync(
			`SELECT
				COALESCE(SUM(CASE WHEN to_account_id = ? THEN amount END), 0) AS inflow,
				COALESCE(SUM(CASE WHEN from_account_id = ? THEN amount END), 0) AS outflow
			 FROM transactions WHERE to_account_id = ? OR from_account_id = ?`,
			[accountId, accountId, accountId, accountId]
		);
		const { opening_balance } = await db.getFirstAsync(
			"SELECT opening_balance FROM accounts WHERE id = ?",
			[accountId]
		);
		return opening_balance + flows.inflow - flows.outflow;
	};
	for (const accountId of touchedAccounts) {
		if (!sameAmount(accountById(accountId).current_balance, await derivedBalance(accountId))) {
			fail(`account ${accountId} balance doesn't match its transactions`);
		}
	}

	// ── Writes ────────────────────────────────────────────────────────────
	for (const [withdrawId, depositId] of V2_PAIRS) {
		await db.runAsync(
			"UPDATE transactions SET transaction_type_id = ?, category_id = NULL, to_account_id = ? WHERE id = ?",
			[TRANSFER, rowById(depositId).to_account_id, withdrawId]
		);
	}
	await db.runAsync(
		`DELETE FROM transactions WHERE id IN (${inList(V2_PAIRS.map(([, depositId]) => depositId))})`
	);

	for (const id of V2_TO_OPENING_BALANCE) {
		const r = rowById(id);
		const signed = r.transaction_type_id === INCOME ? r.amount : -r.amount;
		await db.runAsync(
			"UPDATE accounts SET opening_balance = opening_balance + ? WHERE id = ?",
			[signed, r.from_account_id ?? r.to_account_id]
		);
	}
	await db.runAsync(`DELETE FROM transactions WHERE id IN (${inList(V2_TO_OPENING_BALANCE)})`);

	await db.runAsync(`DELETE FROM categories WHERE id IN (${inList(categoryIds)})`);

	// ── Post-checks: balances unchanged and consistent with the new rows ──
	const after: { id: number; current_balance: number }[] = await db.getAllAsync(
		"SELECT id, current_balance FROM accounts"
	);
	for (const a of after) {
		if (!sameAmount(a.current_balance, accountById(a.id).current_balance)) fail(`account ${a.id} balance changed`);
	}
	for (const accountId of touchedAccounts) {
		if (!sameAmount(accountById(accountId).current_balance, await derivedBalance(accountId))) {
			fail(`account ${accountId} no longer matches its transactions`);
		}
	}
	const leftover = await db.getFirstAsync(
		`SELECT COUNT(*) AS n FROM transactions WHERE category_id IN (${inList(categoryIds)})`
	);
	if (leftover?.n) fail("rows still use the removed categories");
}

// v3 — standard account, asset, liability and receivable types. Old default
// names merge into their new type, old defaults nobody uses are removed, and a
// type still in use without a clear new home is kept. Only type references
// change; no balance does.
const V3_TYPE_TABLES: {
	table: string;
	items: string;
	column: string;
	defaults: string[];
	merge: Record<string, string>;
	removeIfUnused: string[];
}[] = [
	{
		table: "account_types",
		items: "accounts",
		column: "account_type_id",
		defaults: DEFAULT_ACCOUNT_TYPES,
		merge: {},
		removeIfUnused: ["Credit Card", "Other"],
	},
	{
		table: "asset_types",
		items: "assets",
		column: "asset_type_id",
		defaults: DEFAULT_ASSET_TYPES,
		merge: {
			Stock: "Investments",
			Bond: "Investments",
			"Mutual Fund": "Investments",
			Cryptocurrency: "Crypto",
			"Physical Good": "Valuables",
		},
		removeIfUnused: [],
	},
	{
		table: "liability_types",
		items: "liabilities",
		column: "liability_type_id",
		defaults: DEFAULT_LIABILITY_TYPES,
		merge: {
			"Personal Loan": "Loan",
			"Car Loan": "Loan",
			Mortgage: "Loan",
			"Student Loan": "Loan",
			"Credit Card Debt": "Credit Card",
		},
		removeIfUnused: ["Other"],
	},
];
// Receivable types live in code (ReceivableType); old value → new value.
const V3_RECEIVABLE_TYPES: Record<string, string> = {
	"Personal-Loan": "Loan",
	IOU: "Loan",
	Salary: "Accrued-Income",
	Interest: "Accrued-Income",
	Deposit: "Refundable-Deposit",
};
const V3_RECEIVABLE_VALUES = ["Loan", "Accrued-Income", "Refund", "Refundable-Deposit"];
// The owner's money kept for someone, filed under "Other": IDs and a checksum
// of their amounts only, as the repository is public.
const V3_HELD_FOR_OTHERS = [2, 7];
const V3_HELD_CHECKSUM = 250219;

async function standardizeTypes(db: any) {
	const fail = (reason: string): never => {
		throw new Error(`Type migration skipped: ${reason}`);
	};
	const totals = () =>
		db.getFirstAsync(
			`SELECT
				(SELECT COUNT(*) FROM accounts) AS accounts,
				(SELECT COUNT(*) FROM assets) AS assets,
				(SELECT COUNT(*) FROM liabilities) AS liabilities,
				(SELECT COUNT(*) FROM receivables) AS receivables,
				(SELECT COALESCE(SUM(current_balance), 0) FROM accounts) AS account_balance,
				(SELECT COALESCE(SUM(current_valuation), 0) FROM assets) AS asset_value,
				(SELECT COALESCE(SUM(current_balance), 0) FROM liabilities) AS liability_balance,
				(SELECT COALESCE(SUM(current_balance), 0) FROM receivables) AS receivable_balance`
		);
	const before = await totals();

	const typeId = async (table: string, name: string): Promise<number | undefined> =>
		(await db.getFirstAsync(`SELECT id FROM ${table} WHERE name = ?`, [name]))?.id;

	for (const { table, items, column, defaults, merge } of V3_TYPE_TABLES) {
		for (const name of defaults) {
			await db.runAsync(`INSERT OR IGNORE INTO ${table} (name) VALUES (?)`, [name]);
		}
		for (const [oldName, newName] of Object.entries(merge)) {
			const oldId = await typeId(table, oldName);
			if (oldId === undefined) continue;
			const newId = (await typeId(table, newName)) ?? fail(`${newName} missing`);
			await db.runAsync(`UPDATE ${items} SET ${column} = ? WHERE ${column} = ?`, [newId, oldId]);
			await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [oldId]);
		}
	}

	const held: { id: number; total_amount: number; type: string }[] = await db.getAllAsync(
		`SELECT l.id, l.total_amount, t.name AS type FROM liabilities l
		 JOIN liability_types t ON t.id = l.liability_type_id
		 WHERE l.id IN (${inList(V3_HELD_FOR_OTHERS)})`
	);
	if (
		held.length === V3_HELD_FOR_OTHERS.length &&
		held.every((l) => l.type === "Other") &&
		sameAmount(held.reduce((sum, l) => sum + l.total_amount, 0), V3_HELD_CHECKSUM)
	) {
		await db.runAsync(
			`UPDATE liabilities SET liability_type_id = ? WHERE id IN (${inList(V3_HELD_FOR_OTHERS)})`,
			[(await typeId("liability_types", "Held for Others")) ?? fail("Held for Others missing")]
		);
	}

	for (const { table, items, column, removeIfUnused } of V3_TYPE_TABLES) {
		for (const name of removeIfUnused) {
			await db.runAsync(
				`DELETE FROM ${table} WHERE name = ? AND NOT EXISTS (SELECT 1 FROM ${items} WHERE ${column} = ${table}.id)`,
				[name]
			);
		}
	}

	for (const [oldValue, newValue] of Object.entries(V3_RECEIVABLE_TYPES)) {
		await db.runAsync("UPDATE receivables SET type = ? WHERE type = ?", [newValue, oldValue]);
	}

	// ── Post-checks: same rows and balances, every row on a valid type ────
	const after = await totals();
	for (const key of Object.keys(before)) {
		if (!sameAmount(before[key], after[key])) fail(`${key} changed`);
	}
	for (const { table, items, column } of V3_TYPE_TABLES) {
		const orphan = await db.getFirstAsync(
			`SELECT COUNT(*) AS n FROM ${items} WHERE ${column} NOT IN (SELECT id FROM ${table})`
		);
		if (orphan?.n) fail(`${items} without a type`);
	}
	const unknown = await db.getFirstAsync(
		`SELECT COUNT(*) AS n FROM receivables WHERE type NOT IN (${V3_RECEIVABLE_VALUES.map(() => "?").join(", ")})`,
		V3_RECEIVABLE_VALUES
	);
	if (unknown?.n) fail("a receivable has an unknown type");
}

// v4 — standard income categories. Old default names merge into their new
// category; an old default nobody uses is removed, and one still in use without
// a clear new home is kept. On the owner's data, an asset sale filed as income
// becomes a transfer from the asset, and two balance corrections move into
// their account's opening balance, as in v2.
const V4_INCOME_MERGE: Record<string, string> = {
	Salary: "Salary & Wages",
	Business: "Business Revenue",
	Freelance: "Freelance & Contracting",
	Investment: "Investment Returns",
	Interest: "Investment Returns",
	Dividends: "Investment Returns",
	Gifts: "Gifts & Windfalls",
	Refunds: "Other Income",
	"Other Earnings": "Other Income",
};
const V4_REMOVE_IF_UNUSED = ["Assets"];
const V4_ASSET_SALE = 291;
const V4_ASSET_SALE_CATEGORY = 5;
const V4_TO_OPENING_BALANCE = [506, 525];
const V4_CORRECTIONS_CATEGORY = 7;
const V4_CHECKSUM = 304842;

async function standardizeIncomeCategories(db: any) {
	const fail = (reason: string): never => {
		throw new Error(`Income category migration skipped: ${reason}`);
	};
	const types: { id: number; name: string }[] = await db.getAllAsync(
		"SELECT id, name FROM transaction_types"
	);
	const typeId = (name: string) => types.find((t) => t.name === name)?.id ?? fail(`missing ${name} type`);
	const INCOME = typeId("Income");
	const TRANSFER = typeId("Transfer");

	const totals = () =>
		db.getFirstAsync(
			`SELECT
				(SELECT COUNT(*) FROM transactions) AS transactions,
				(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type_id = ?) AS income,
				(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type_id = ?) AS transfers,
				(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type_id NOT IN (?, ?)) AS other,
				(SELECT COALESCE(SUM(initial_cost + contributions + reinvestments + withdrawals + current_valuation), 0) FROM assets) AS assets,
				(SELECT COALESCE(SUM(current_balance), 0) FROM liabilities) AS liabilities,
				(SELECT COALESCE(SUM(current_balance), 0) FROM receivables) AS receivables,
				(SELECT COALESCE(SUM(current_balance), 0) FROM envelopes) AS envelopes`,
			[INCOME, TRANSFER, INCOME, TRANSFER]
		);
	const before = await totals();
	const accounts: { id: number; current_balance: number }[] = await db.getAllAsync(
		"SELECT id, current_balance FROM accounts"
	);

	// ── The owner's rows: only the database these IDs were taken from ────
	const ownerIds = [V4_ASSET_SALE, ...V4_TO_OPENING_BALANCE];
	const anchor = await db.getFirstAsync("SELECT category_id FROM transactions WHERE id = ?", [V4_ASSET_SALE]);
	const checksum = await db.getFirstAsync(
		`SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE id IN (${inList(ownerIds)})`
	);
	const ownerData =
		anchor?.category_id === V4_ASSET_SALE_CATEGORY && sameAmount(checksum?.total ?? 0, V4_CHECKSUM);
	let saleAmount = 0;

	if (ownerData) {
		type Row = {
			id: number;
			transaction_type_id: number;
			category_id: number | null;
			from_account_id: number | null;
			to_account_id: number | null;
			asset_id: number | null;
			amount: number;
			other_links: number;
		};
		const rows: Row[] = await db.getAllAsync(
			`SELECT id, transaction_type_id, category_id, from_account_id, to_account_id, asset_id, amount,
				(liability_id IS NOT NULL OR envelope_id IS NOT NULL OR bill_id IS NOT NULL
				 OR receivable_id IS NOT NULL OR entity_id IS NOT NULL) AS other_links
			 FROM transactions WHERE id IN (${inList(ownerIds)})`
		);
		const rowById = (id: number) => rows.find((r) => r.id === id) ?? fail(`row ${id} missing`);
		const isDeposit = (r: Row, categoryId: number) =>
			r.transaction_type_id === INCOME &&
			r.category_id === categoryId &&
			r.from_account_id === null &&
			r.to_account_id !== null &&
			!r.other_links;

		const sale = rowById(V4_ASSET_SALE);
		if (!isDeposit(sale, V4_ASSET_SALE_CATEGORY) || sale.asset_id === null) fail(`row ${sale.id} changed`);
		saleAmount = sale.amount;
		for (const id of V4_TO_OPENING_BALANCE) {
			const r = rowById(id);
			if (!isDeposit(r, V4_CORRECTIONS_CATEGORY) || r.asset_id !== null) fail(`row ${id} changed`);
		}

		// Income into the account → a transfer from the asset into it. The
		// asset already counts this sale in its withdrawals.
		await db.runAsync(
			"UPDATE transactions SET transaction_type_id = ?, category_id = NULL WHERE id = ?",
			[TRANSFER, V4_ASSET_SALE]
		);
		for (const id of V4_TO_OPENING_BALANCE) {
			const r = rowById(id);
			await db.runAsync(
				"UPDATE accounts SET opening_balance = opening_balance + ? WHERE id = ?",
				[r.amount, r.to_account_id]
			);
		}
		await db.runAsync(`DELETE FROM transactions WHERE id IN (${inList(V4_TO_OPENING_BALANCE)})`);
	}

	// ── Standard income categories, on every install ──────────────────────
	const categoryId = async (name: string): Promise<number | undefined> =>
		(await db.getFirstAsync(
			"SELECT id FROM categories WHERE name = ? AND transaction_type_id = ?",
			[name, INCOME]
		))?.id;

	for (const name of DEFAULT_INCOME_CATEGORIES) {
		if ((await categoryId(name)) === undefined) {
			await db.runAsync(
				"INSERT INTO categories (name, transaction_type_id, created_at) VALUES (?, ?, ?)",
				[name, INCOME, new Date().toISOString()]
			);
		}
	}
	for (const [oldName, newName] of Object.entries(V4_INCOME_MERGE)) {
		const oldId = await categoryId(oldName);
		if (oldId === undefined) continue;
		const newId = (await categoryId(newName)) ?? fail(`${newName} missing`);
		for (const table of ["transactions", "bills", "budgets"]) {
			await db.runAsync(`UPDATE ${table} SET category_id = ? WHERE category_id = ?`, [newId, oldId]);
		}
		await db.runAsync("DELETE FROM categories WHERE id = ?", [oldId]);
	}
	for (const name of V4_REMOVE_IF_UNUSED) {
		await db.runAsync(
			`DELETE FROM categories WHERE name = ? AND transaction_type_id = ?
			   AND NOT EXISTS (SELECT 1 FROM transactions WHERE category_id = categories.id)
			   AND NOT EXISTS (SELECT 1 FROM bills WHERE category_id = categories.id)
			   AND NOT EXISTS (SELECT 1 FROM budgets WHERE category_id = categories.id)`,
			[name, INCOME]
		);
	}

	// ── Post-checks: balances unchanged; only the owner's rows moved ──────
	// Income loses the sale and the corrections; transfers gain the sale.
	const after = await totals();
	const expected: Record<string, number> = {
		...before,
		transactions: before.transactions - (ownerData ? V4_TO_OPENING_BALANCE.length : 0),
		income: before.income - (ownerData ? V4_CHECKSUM : 0),
		transfers: before.transfers + saleAmount,
	};
	for (const key of Object.keys(expected)) {
		if (!sameAmount(expected[key], after[key])) fail(`${key} changed unexpectedly`);
	}
	for (const a of accounts) {
		const now = await db.getFirstAsync(
			`SELECT current_balance,
				opening_balance
				+ COALESCE((SELECT SUM(amount) FROM transactions WHERE to_account_id = accounts.id), 0)
				- COALESCE((SELECT SUM(amount) FROM transactions WHERE from_account_id = accounts.id), 0) AS derived
			 FROM accounts WHERE id = ?`,
			[a.id]
		);
		if (!sameAmount(now.current_balance, a.current_balance)) fail(`account ${a.id} balance changed`);
		if (ownerData && !sameAmount(now.derived, now.current_balance)) {
			fail(`account ${a.id} no longer matches its transactions`);
		}
	}
}

// v5 — the owner's expenses and income that name a person in their description
// or category, every salary, and every payment for a client's projects,
// recorded before transactions could link an entity. Shared spending is left
// unlinked. Rows are identified by IDs and a checksum of their amounts; people
// without an entity yet are created (or reused if one with the same name
// exists). Links don't change any balance.
const V5_LINKS: Record<number, number[]> = {
	// entity id → transaction ids
	1: [36, 76, 117, 161, 201, 253, 283, 335, 379, 472, 508],
	2: [
		15, 29, 42, 84, 89, 95, 111, 113, 114, 127, 136, 139, 145, 146, 149,
		150, 167, 168, 185, 202, 203, 243, 244, 261, 278, 280, 285, 293, 295, 299,
		315, 317, 321, 325, 329, 330, 361, 371, 392, 407, 415, 421, 428, 432, 438,
		443, 446, 449, 450, 453, 474, 478, 486, 496, 502, 520, 545, 552, 563, 565,
		574, 584,
	],
	3: [4, 44, 69, 86, 141, 313, 377, 439, 440],
	5: [
		1, 18, 35, 55, 61, 70, 74, 101, 104, 112, 132, 138, 152, 154, 172,
		175, 195, 213, 214, 240, 255, 272, 289, 296, 323, 359, 362, 378, 400, 420,
		437, 447, 465, 477, 492, 515,
	],
	4: [10, 57, 93, 254, 311, 356, 434, 476, 566],
};
// new entity name → transaction ids
const V5_NEW_ENTITIES: Record<string, number[]> = {
	Jeanne: [82, 372],
	Pascaline: [7],
	"Eliane Ineza": [16, 24, 25, 98, 100, 128, 268],
};
const V5_CHECKSUM = 16454400;

async function linkOwnerEntities(db: any) {
	const fail = (reason: string): never => {
		throw new Error(`Entity link migration skipped: ${reason}`);
	};
	const entityIds = Object.keys(V5_LINKS).map(Number);
	const rowIds = [...Object.values(V5_LINKS), ...Object.values(V5_NEW_ENTITIES)].flat();

	// ── Applicability: only the database these IDs were taken from ───────
	const checksum = await db.getFirstAsync(
		`SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS n FROM transactions WHERE id IN (${inList(rowIds)})`
	);
	const entities = await db.getFirstAsync(
		`SELECT COUNT(*) AS n FROM entities WHERE id IN (${inList(entityIds)})`
	);
	if (
		checksum?.n !== rowIds.length ||
		!sameAmount(checksum.total, V5_CHECKSUM) ||
		entities?.n !== entityIds.length
	) {
		return;
	}

	// ── Guard: none of these rows is linked to anyone yet ─────────────────
	const linked = await db.getFirstAsync(
		`SELECT id FROM transactions WHERE id IN (${inList(rowIds)}) AND entity_id IS NOT NULL LIMIT 1`
	);
	if (linked) fail(`row ${linked.id} is already linked`);

	const links: [number, number[]][] = Object.entries(V5_LINKS).map(([id, ids]) => [Number(id), ids]);
	for (const [name, ids] of Object.entries(V5_NEW_ENTITIES)) {
		const existing = await db.getFirstAsync(
			"SELECT id FROM entities WHERE name = ? COLLATE NOCASE ORDER BY id LIMIT 1",
			[name]
		);
		const entityId =
			existing?.id ??
			(
				await db.runAsync(
					"INSERT INTO entities (name, is_individual, created_at) VALUES (?, 1, ?)",
					[name, new Date().toISOString()]
				)
			).lastInsertRowId;
		links.push([entityId, ids]);
	}

	for (const [entityId, ids] of links) {
		await db.runAsync(
			`UPDATE transactions SET entity_id = ? WHERE id IN (${inList(ids)}) AND entity_id IS NULL`,
			[entityId]
		);
	}

	// ── Post-check: every row now carries its entity ──────────────────────
	for (const [entityId, ids] of links) {
		const done = await db.getFirstAsync(
			`SELECT COUNT(*) AS n FROM transactions WHERE id IN (${inList(ids)}) AND entity_id = ?`,
			[entityId]
		);
		if (done?.n !== ids.length) fail(`entity ${entityId} links incomplete`);
	}
}

// v6 — standard expense categories. A category says what the money bought; the
// entity says who it was for. Old default names merge into their new category.
// On the owner's data, rows are first moved one by one to the category naming
// what they bought (gifts that name an expense type, a person's spending
// category), RNIT purchases filed as expenses become transfers into the asset,
// and the owner's own categories then merge into the standard ones. Plain
// giving stays in Gifts & Donations.
const V6_EXPENSE_MERGE: Record<string, string> = {
	"Food & Dining": "Food & Groceries",
	Entertainment: "Leisure & Travel",
	Travel: "Leisure & Travel",
	Shopping: "Clothing & Footwear",
	Gifts: "Gifts & Donations",
	Giveaways: "Gifts & Donations",
	"Repairs & Maintenance": "Household & Maintenance",
};
// standard category → the owner's transaction ids
const V6_ROW_MOVES: Record<string, number[]> = {
	Education: [69, 89, 167, 233, 290, 315, 456, 511],
	Healthcare: [262, 264, 372, 416, 486, 491],
	"Personal Care": [84, 136, 141, 202, 317, 392, 449, 450, 496],
	Transportation: [87, 280, 332],
	"Phone & Internet": [127, 231],
	"Eating Out": [68, 413],
	"Food & Groceries": [440],
	"Gifts & Donations": [82, 250],
};
// the owner's own category id → standard category, or null when the row moves
// above leave it empty
const V6_CATEGORY_MOVES: Record<number, string | null> = {
	11: "Food & Groceries",
	30: "Food & Groceries",
	23: "Leisure & Travel",
	35: "Phone & Internet",
	28: "Family Support",
	29: "Education",
	31: "Gifts & Donations",
	32: "Gifts & Donations",
	37: "Gifts & Donations",
	36: null,
	40: null,
	41: null,
};
// Owner categories rows may move out of: the above plus the old Gifts and Giveaways
const V6_ROW_SOURCES = [...Object.keys(V6_CATEGORY_MOVES).map(Number), 21, 26];
const V6_ASSET_PURCHASES = [48, 169, 209];
const V6_ASSET = 1;
const V6_ASSET_PURCHASE_CATEGORY = 36;
const V6_CHECKSUM = 2087273;

async function standardizeExpenseCategories(db: any) {
	const fail = (reason: string): never => {
		throw new Error(`Expense category migration skipped: ${reason}`);
	};
	const types: { id: number; name: string }[] = await db.getAllAsync(
		"SELECT id, name FROM transaction_types"
	);
	const typeId = (name: string) => types.find((t) => t.name === name)?.id ?? fail(`missing ${name} type`);
	const INCOME = typeId("Income");
	const EXPENSE = typeId("Expense");
	const TRANSFER = typeId("Transfer");

	const totals = () =>
		db.getFirstAsync(
			`SELECT
				(SELECT COUNT(*) FROM transactions) AS transactions,
				(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type_id = ?) AS income,
				(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type_id = ?) AS expenses,
				(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type_id = ?) AS transfers,
				(SELECT COALESCE(SUM(current_balance), 0) FROM accounts) AS accounts,
				(SELECT COALESCE(SUM(initial_cost + contributions + reinvestments + withdrawals + current_valuation), 0) FROM assets) AS assets,
				(SELECT COALESCE(SUM(current_balance), 0) FROM liabilities) AS liabilities,
				(SELECT COALESCE(SUM(current_balance), 0) FROM receivables) AS receivables,
				(SELECT COALESCE(SUM(current_balance), 0) FROM envelopes) AS envelopes,
				(SELECT COUNT(*) FROM bills) AS bills`,
			[INCOME, EXPENSE, TRANSFER]
		);
	const before = await totals();
	const accounts: { id: number; current_balance: number }[] = await db.getAllAsync(
		"SELECT id, current_balance FROM accounts"
	);

	const categoryId = async (name: string): Promise<number | undefined> =>
		(await db.getFirstAsync(
			"SELECT id FROM categories WHERE name = ? AND transaction_type_id = ?",
			[name, EXPENSE]
		))?.id;
	const requireCategory = async (name: string) => (await categoryId(name)) ?? fail(`${name} missing`);
	const mergeCategory = async (oldId: number, newId: number) => {
		for (const table of ["transactions", "bills", "budgets"]) {
			await db.runAsync(`UPDATE ${table} SET category_id = ? WHERE category_id = ?`, [newId, oldId]);
		}
		await db.runAsync("DELETE FROM categories WHERE id = ?", [oldId]);
	};

	for (const name of DEFAULT_EXPENSE_CATEGORIES) {
		if ((await categoryId(name)) === undefined) {
			await db.runAsync(
				"INSERT INTO categories (name, transaction_type_id, created_at) VALUES (?, ?, ?)",
				[name, EXPENSE, new Date().toISOString()]
			);
		}
	}

	// ── The owner's rows: only the database these IDs were taken from ────
	const rowIds = [...Object.values(V6_ROW_MOVES).flat(), ...V6_ASSET_PURCHASES];
	const anchor = await db.getFirstAsync("SELECT category_id FROM transactions WHERE id = ?", [V6_ASSET_PURCHASES[0]]);
	const checksum = await db.getFirstAsync(
		`SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS n FROM transactions WHERE id IN (${inList(rowIds)})`
	);
	const ownerData =
		anchor?.category_id === V6_ASSET_PURCHASE_CATEGORY &&
		checksum?.n === rowIds.length &&
		sameAmount(checksum.total, V6_CHECKSUM);
	let purchases = 0;

	if (ownerData) {
		const sources = await db.getAllAsync(
			`SELECT id FROM categories WHERE id IN (${inList(V6_ROW_SOURCES)}) AND transaction_type_id = ?`,
			[EXPENSE]
		);
		if (sources.length !== V6_ROW_SOURCES.length) fail("owner categories changed");

		const moved = await db.getFirstAsync(
			`SELECT COUNT(*) AS n FROM transactions
			 WHERE id IN (${inList(Object.values(V6_ROW_MOVES).flat())})
			   AND transaction_type_id = ? AND category_id IN (${inList(V6_ROW_SOURCES)})`,
			[EXPENSE]
		);
		if (moved?.n !== Object.values(V6_ROW_MOVES).flat().length) fail("a row to move changed");

		const bought: { id: number; amount: number; from_account_id: number | null; other_links: number }[] =
			await db.getAllAsync(
				`SELECT id, amount, from_account_id,
					(to_account_id IS NOT NULL OR asset_id IS NOT NULL OR liability_id IS NOT NULL OR envelope_id IS NOT NULL
					 OR bill_id IS NOT NULL OR receivable_id IS NOT NULL OR entity_id IS NOT NULL) AS other_links
				 FROM transactions
				 WHERE id IN (${inList(V6_ASSET_PURCHASES)}) AND transaction_type_id = ? AND category_id = ?`,
				[EXPENSE, V6_ASSET_PURCHASE_CATEGORY]
			);
		if (bought.length !== V6_ASSET_PURCHASES.length || bought.some((r) => !r.from_account_id || r.other_links)) {
			fail("an asset purchase changed");
		}
		const asset = await db.getFirstAsync("SELECT id FROM assets WHERE id = ?", [V6_ASSET]);
		if (!asset) fail("asset missing");

		// Account → asset transfers; the asset already counts these purchases.
		await db.runAsync(
			`UPDATE transactions SET transaction_type_id = ?, category_id = NULL, asset_id = ? WHERE id IN (${inList(V6_ASSET_PURCHASES)})`,
			[TRANSFER, V6_ASSET]
		);
		purchases = bought.reduce((sum, r) => sum + r.amount, 0);

		for (const [name, ids] of Object.entries(V6_ROW_MOVES)) {
			await db.runAsync(
				`UPDATE transactions SET category_id = ? WHERE id IN (${inList(ids)})`,
				[await requireCategory(name)]
			);
		}
		for (const [id, name] of Object.entries(V6_CATEGORY_MOVES)) {
			if (name) {
				await mergeCategory(Number(id), await requireCategory(name));
				continue;
			}
			const used = await db.getFirstAsync(
				`SELECT
					(SELECT COUNT(*) FROM transactions WHERE category_id = ?) +
					(SELECT COUNT(*) FROM bills WHERE category_id = ?) +
					(SELECT COUNT(*) FROM budgets WHERE category_id = ?) AS n`,
				[Number(id), Number(id), Number(id)]
			);
			if (used?.n) fail(`category ${id} isn't empty`);
			await db.runAsync("DELETE FROM categories WHERE id = ?", [Number(id)]);
		}
	}

	// ── Standard expense categories, on every install ─────────────────────
	for (const [oldName, newName] of Object.entries(V6_EXPENSE_MERGE)) {
		const oldId = await categoryId(oldName);
		if (oldId === undefined) continue;
		await mergeCategory(oldId, await requireCategory(newName));
	}

	// ── Post-checks: balances unchanged; only the asset purchases moved ───
	const after = await totals();
	const expected: Record<string, number> = {
		...before,
		expenses: before.expenses - purchases,
		transfers: before.transfers + purchases,
	};
	for (const key of Object.keys(expected)) {
		if (!sameAmount(expected[key], after[key])) fail(`${key} changed unexpectedly`);
	}
	for (const a of accounts) {
		const now = await db.getFirstAsync(
			`SELECT current_balance,
				opening_balance
				+ COALESCE((SELECT SUM(amount) FROM transactions WHERE to_account_id = accounts.id), 0)
				- COALESCE((SELECT SUM(amount) FROM transactions WHERE from_account_id = accounts.id), 0) AS derived
			 FROM accounts WHERE id = ?`,
			[a.id]
		);
		if (!sameAmount(now.current_balance, a.current_balance)) fail(`account ${a.id} balance changed`);
		if (ownerData && !sameAmount(now.derived, now.current_balance)) {
			fail(`account ${a.id} no longer matches its transactions`);
		}
	}
	if (ownerData) {
		for (const [name, ids] of Object.entries(V6_ROW_MOVES)) {
			const placed = await db.getFirstAsync(
				`SELECT COUNT(*) AS n FROM transactions WHERE id IN (${inList(ids)}) AND category_id = ?`,
				[await requireCategory(name)]
			);
			if (placed?.n !== ids.length) fail(`rows for ${name} not placed`);
		}
	}
	const mismatched = await db.getFirstAsync(
		`SELECT COUNT(*) AS n FROM transactions t JOIN categories c ON c.id = t.category_id
		 WHERE t.transaction_type_id = ? AND c.transaction_type_id <> ?`,
		[EXPENSE, EXPENSE]
	);
	if (mismatched?.n) fail("an expense uses a non-expense category");
}

// v7 — one-time fix for the owner's expenses filed under a neighbouring
// category: clothes under personal care, internet and Canal+ under utilities,
// cooking gas and the house maid under food, bank fees under miscellaneous,
// snacks bought out under groceries. A loan the owner gave, filed as an
// expense, becomes a Loan receivable that is still owed: the account balance
// stays the same, the expense becomes a transfer into the receivable.
// Row and bill IDs only; a checksum of their amounts identifies the data.
const V7_ROW_MOVES: [string, string, number[]][] = [
	["Personal Care", "Clothing & Footwear", [210, 212, 215, 216, 309]],
	["Personal Care", "Household & Maintenance", [79]],
	["Personal Care", "Leisure & Travel", [180]],
	["Personal Care", "Education", [66]],
	["Utilities", "Phone & Internet", [41, 121, 123, 191, 245, 274, 301, 353, 396, 431, 464]],
	["Utilities", "Subscriptions", [192, 354]],
	["Utilities", "Household & Maintenance", [412]],
	["Food & Groceries", "Eating Out", [34, 53, 105, 115, 133, 183, 184, 186, 448]],
	["Food & Groceries", "Utilities", [266, 373, 575]],
	["Food & Groceries", "Household & Maintenance", [103, 196, 298]],
	["Food & Groceries", "Miscellaneous", [463]],
	["Miscellaneous", "Interest & Charges", [75, 258, 346, 389, 571]],
	["Subscriptions", "Interest & Charges", [357]],
	["Miscellaneous", "Personal Care", [102]],
	["Household & Maintenance", "Phone & Internet", [8]],
];
const V7_BILL_MOVES: [string, string, number[]][] = [
	["Food & Groceries", "Household & Maintenance", [2, 12, 24, 27]],
];
// "Lending to <name>": the borrower's name comes from the row itself
const V7_LOAN = 88;
const V7_LOAN_SOURCE = "Miscellaneous";
const V7_LOAN_PREFIX = "Lending to ";
const V7_CHECKSUM = 1015797;

async function refileOwnerExpenses(db: any) {
	const fail = (reason: string): never => {
		throw new Error(`Expense refile migration skipped: ${reason}`);
	};
	const rowIds = [...V7_ROW_MOVES.flatMap(([, , ids]) => ids), V7_LOAN];

	// ── Applicability: only the database these IDs were taken from ───────
	const checksum = await db.getFirstAsync(
		`SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS n FROM transactions WHERE id IN (${inList(rowIds)})`
	);
	if (checksum?.n !== rowIds.length || !sameAmount(checksum.total, V7_CHECKSUM)) return;

	const types: { id: number; name: string }[] = await db.getAllAsync(
		"SELECT id, name FROM transaction_types"
	);
	const typeId = (name: string) => types.find((t) => t.name === name)?.id ?? fail(`missing ${name} type`);
	const INCOME = typeId("Income");
	const EXPENSE = typeId("Expense");
	const TRANSFER = typeId("Transfer");
	const categoryId = async (name: string): Promise<number> =>
		(
			await db.getFirstAsync(
				"SELECT id FROM categories WHERE name = ? AND transaction_type_id = ?",
				[name, EXPENSE]
			)
		)?.id ?? fail(`${name} missing`);

	const totals = () =>
		db.getFirstAsync(
			`SELECT
				(SELECT COUNT(*) FROM transactions) AS transactions,
				(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type_id = ?) AS income,
				(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type_id = ?) AS expenses,
				(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type_id = ?) AS transfers,
				(SELECT COALESCE(SUM(current_balance), 0) FROM accounts) AS accounts,
				(SELECT COALESCE(SUM(initial_cost + contributions + reinvestments + withdrawals + current_valuation), 0) FROM assets) AS assets,
				(SELECT COALESCE(SUM(current_balance), 0) FROM liabilities) AS liabilities,
				(SELECT COALESCE(SUM(current_balance), 0) FROM receivables) AS receivables,
				(SELECT COALESCE(SUM(current_balance), 0) FROM envelopes) AS envelopes,
				(SELECT COUNT(*) FROM bills) AS bills`,
			[INCOME, EXPENSE, TRANSFER]
		);
	const before = await totals();
	const accounts: { id: number; current_balance: number }[] = await db.getAllAsync(
		"SELECT id, current_balance FROM accounts"
	);

	// ── Guard: every row and bill is still where it was filed ─────────────
	for (const [from, , ids] of V7_ROW_MOVES) {
		const found = await db.getFirstAsync(
			`SELECT COUNT(*) AS n FROM transactions WHERE id IN (${inList(ids)}) AND transaction_type_id = ? AND category_id = ?`,
			[EXPENSE, await categoryId(from)]
		);
		if (found?.n !== ids.length) fail(`a ${from} row changed`);
	}
	for (const [from, , ids] of V7_BILL_MOVES) {
		const found = await db.getFirstAsync(
			`SELECT COUNT(*) AS n FROM bills WHERE id IN (${inList(ids)}) AND category_id = ?`,
			[await categoryId(from)]
		);
		if (found?.n !== ids.length) fail(`a ${from} bill changed`);
	}
	const loan = await db.getFirstAsync(
		`SELECT t.amount, t.description, t.date, a.currency,
			(t.to_account_id IS NOT NULL OR t.asset_id IS NOT NULL OR t.liability_id IS NOT NULL OR t.envelope_id IS NOT NULL
			 OR t.bill_id IS NOT NULL OR t.receivable_id IS NOT NULL OR t.entity_id IS NOT NULL) AS other_links
		 FROM transactions t JOIN accounts a ON a.id = t.from_account_id
		 WHERE t.id = ? AND t.transaction_type_id = ? AND t.category_id = ?`,
		[V7_LOAN, EXPENSE, await categoryId(V7_LOAN_SOURCE)]
	);
	if (!loan || loan.other_links || !loan.description.startsWith(V7_LOAN_PREFIX)) fail("the loan row changed");

	// ── Moves ─────────────────────────────────────────────────────────────
	for (const [, to, ids] of V7_ROW_MOVES) {
		await db.runAsync(
			`UPDATE transactions SET category_id = ? WHERE id IN (${inList(ids)})`,
			[await categoryId(to)]
		);
	}
	for (const [, to, ids] of V7_BILL_MOVES) {
		await db.runAsync(`UPDATE bills SET category_id = ? WHERE id IN (${inList(ids)})`, [await categoryId(to)]);
	}

	// ── The loan: borrower entity, active Loan receivable, transfer into it
	const borrower = loan.description.slice(V7_LOAN_PREFIX.length).trim();
	const existing = await db.getFirstAsync(
		"SELECT id FROM entities WHERE name = ? COLLATE NOCASE ORDER BY id LIMIT 1",
		[borrower]
	);
	const now = new Date().toISOString();
	const entityId =
		existing?.id ??
		(await db.runAsync("INSERT INTO entities (name, is_individual, created_at) VALUES (?, 1, ?)", [borrower, now]))
			.lastInsertRowId;
	const receivableId = (
		await db.runAsync(
			`INSERT INTO receivables (entity_id, title, type, currency, principal, interest_rate, current_balance, status, requires_outflow, created_at)
			 VALUES (?, ?, 'Loan', ?, ?, 0, ?, 'Active', 1, ?)`,
			[entityId, loan.description, loan.currency, loan.amount, loan.amount, loan.date]
		)
	).lastInsertRowId;
	await db.runAsync(
		"UPDATE transactions SET transaction_type_id = ?, category_id = NULL, receivable_id = ?, entity_id = ? WHERE id = ?",
		[TRANSFER, receivableId, entityId, V7_LOAN]
	);

	// ── Post-checks: balances unchanged; only the loan left expenses ──────
	const after = await totals();
	const expected: Record<string, number> = {
		...before,
		expenses: before.expenses - loan.amount,
		transfers: before.transfers + loan.amount,
		receivables: before.receivables + loan.amount,
	};
	for (const key of Object.keys(expected)) {
		if (!sameAmount(expected[key], after[key])) fail(`${key} changed unexpectedly`);
	}
	for (const a of accounts) {
		const balance = await db.getFirstAsync(
			`SELECT current_balance,
				opening_balance
				+ COALESCE((SELECT SUM(amount) FROM transactions WHERE to_account_id = accounts.id), 0)
				- COALESCE((SELECT SUM(amount) FROM transactions WHERE from_account_id = accounts.id), 0) AS derived
			 FROM accounts WHERE id = ?`,
			[a.id]
		);
		if (!sameAmount(balance.current_balance, a.current_balance)) fail(`account ${a.id} balance changed`);
		if (!sameAmount(balance.derived, balance.current_balance)) fail(`account ${a.id} no longer matches its transactions`);
	}
	for (const [, to, ids] of V7_ROW_MOVES) {
		const placed = await db.getFirstAsync(
			`SELECT COUNT(*) AS n FROM transactions WHERE id IN (${inList(ids)}) AND transaction_type_id = ? AND category_id = ?`,
			[EXPENSE, await categoryId(to)]
		);
		if (placed?.n !== ids.length) fail(`rows for ${to} not placed`);
	}
}
