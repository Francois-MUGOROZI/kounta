import { SQLiteDatabase } from "expo-sqlite";
import { Bill, BillRule, BillStatus } from "../types";
import { emitEvent, EVENTS } from "../utils/events";

export const BillsRepository = {
	// ============ BILL RULES (Master) ============

	async getAllRules(db: SQLiteDatabase): Promise<BillRule[]> {
		return await db.getAllAsync<BillRule>(
			"SELECT * FROM bill_rules ORDER BY created_at DESC"
		);
	},

	async getRuleById(db: SQLiteDatabase, id: number): Promise<BillRule | null> {
		return await db.getFirstAsync<BillRule>(
			"SELECT * FROM bill_rules WHERE id = ?",
			[id]
		);
	},

	async createRule(
		db: SQLiteDatabase,
		rule: Omit<BillRule, "id">
	): Promise<number> {
		const name: string = rule.name ?? "";
		const amount: number = typeof rule.amount === "number" ? rule.amount : 0;
		const frequency: string = rule.frequency ?? "Monthly";
		const category_id: number =
			typeof rule.category_id === "number" ? rule.category_id : 0;
		const is_active: number = rule.is_active ? 1 : 0;
		const start_date: string = rule.start_date ?? new Date().toISOString();
		const auto_next: number = rule.auto_next ? 1 : 0;
		const currency: string = rule.currency ?? "RWF";
		const created_at: string = rule.created_at ?? new Date().toISOString();

		const result = await db.runAsync(
			`INSERT INTO bill_rules (name, amount, frequency, category_id, is_active, start_date, auto_next, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				name,
				amount,
				frequency,
				category_id,
				is_active,
				start_date,
				auto_next,
				currency,
				created_at,
			]
		);

		// Generate the first bill instance if the rule is active
		if (rule.is_active && result.lastInsertRowId) {
			await this.generateNextBill(db, result.lastInsertRowId);
		}

		emitEvent(EVENTS.DATA_CHANGED);
		return result.lastInsertRowId;
	},

	async updateRule(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<BillRule>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];

		for (const key in updates) {
			const value = updates[key as keyof BillRule];
			if (value !== undefined) {
				// Convert boolean fields to integers for SQLite
				if (key === "is_active" || key === "auto_next") {
					fields.push(`${key} = ?`);
					values.push(value ? 1 : 0);
				} else {
					fields.push(`${key} = ?`);
					values.push(value as string | number | null);
				}
			}
		}

		if (fields.length === 0) return;

		values.push(id as number);
		await db.runAsync(
			`UPDATE bill_rules SET ${fields.join(", ")} WHERE id = ?`,
			values
		);

		emitEvent(EVENTS.DATA_CHANGED);
	},



	// ============ BILLS (Instance) ============

	async getAllBills(db: SQLiteDatabase): Promise<Bill[]> {
		return await db.getAllAsync<Bill>(
			`SELECT 
				bills.*, 
				bill_rules.name as name,
				bill_rules.currency as currency
			FROM bills 
			JOIN bill_rules ON bills.bill_rule_id = bill_rules.id 
			ORDER BY bills.due_date ASC`
		);
	},

	async getBillById(db: SQLiteDatabase, id: number): Promise<Bill | null> {
		return await db.getFirstAsync<Bill>("SELECT * FROM bills WHERE id = ?", [
			id,
		]);
	},

	async getBillsByStatus(
		db: SQLiteDatabase,
		status: BillStatus
	): Promise<Bill[]> {
		return await db.getAllAsync<Bill>(
			`SELECT 
				bills.*, 
				bill_rules.name as name,
				bill_rules.currency as currency
			FROM bills
			JOIN bill_rules ON bills.bill_rule_id = bill_rules.id
			WHERE bills.status = ?
			ORDER BY bills.due_date ASC`,
			[status]
		);
	},

	async getPendingBills(db: SQLiteDatabase): Promise<Bill[]> {
		return await this.getBillsByStatus(db, "Pending");
	},

	async getOverdueBills(db: SQLiteDatabase): Promise<Bill[]> {
		return await this.getBillsByStatus(db, "Overdue");
	},

	async createBill(
		db: SQLiteDatabase,
		bill: Omit<Bill, "id">
	): Promise<number> {
		const bill_rule_id: number =
			typeof bill.bill_rule_id === "number" ? bill.bill_rule_id : 0;
		const due_date: string = bill.due_date ?? new Date().toISOString();
		const amount: number = typeof bill.amount === "number" ? bill.amount : 0;
		const status: string = bill.status ?? "Pending";
		const transaction_id: number | null = bill.transaction_id ?? null;
		const paid_at: string | null = bill.paid_at ?? null;
		const created_at: string = bill.created_at ?? new Date().toISOString();

		const result = await db.runAsync(
			`INSERT INTO bills (bill_rule_id, due_date, amount, status, transaction_id, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				bill_rule_id,
				due_date,
				amount,
				status,
				transaction_id,
				paid_at,
				created_at,
			]
		);

		emitEvent(EVENTS.DATA_CHANGED);
		return result.lastInsertRowId;
	},

	async updateBill(
		db: SQLiteDatabase,
		id: number,
		updates: Partial<Bill>
	): Promise<void> {
		const fields: string[] = [];
		const values: (string | number | null)[] = [];

		for (const key in updates) {
			const value = updates[key as keyof Bill];
			if (value !== undefined) {
				fields.push(`${key} = ?`);
				values.push(value as string | number | null);
			}
		}

		if (fields.length === 0) return;

		values.push(id as number);
		await db.runAsync(
			`UPDATE bills SET ${fields.join(", ")} WHERE id = ?`,
			values
		);

		emitEvent(EVENTS.DATA_CHANGED);
	},

	// ============ BUSINESS LOGIC ============

	/**
	 * Mark a bill as paid
	 * @param db Database instance
	 * @param billId Bill ID
	 * @param transactionId Transaction ID (optional)
	 */
	async markAsPaid(
		db: SQLiteDatabase,
		billId: number,
		transactionId?: number
	): Promise<void> {
		const updates: Partial<Bill> = {
			status: "Paid",
			paid_at: new Date().toISOString(),
		};

		if (transactionId) {
			updates.transaction_id = transactionId;
		}

		await this.updateBill(db, billId, updates);

		// Check if we need to generate the next bill
		const bill = await this.getBillById(db, billId);
		if (bill) {
			const rule = await this.getRuleById(db, bill.bill_rule_id);
			if (rule && rule.is_active && rule.auto_next) {
				await this.generateNextBill(db, rule.id);
			}
		}
	},

	/**
	 * Generate the next bill instance for a rule
	 * @param db Database instance
	 * @param ruleId Bill Rule ID
	 */
	async generateNextBill(
		db: SQLiteDatabase,
		ruleId: number
	): Promise<number | null> {
		const rule = await this.getRuleById(db, ruleId);
		if (!rule || !rule.is_active) return null;

		// Check if there's already a pending bill that's not yet overdue
		const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD
		const existingPendingBills = await db.getAllAsync<Bill>(
			"SELECT * FROM bills WHERE bill_rule_id = ? AND date(due_date) >= date(?) ORDER BY due_date DESC LIMIT 1",
			[ruleId, today]
		);

		if (existingPendingBills.length > 0) {
			// There's already a pending bill that's not yet due, don't create another
			return null;
		}

		// Calculate the next due date
		const lastBill = await db.getFirstAsync<Bill>(
			"SELECT * FROM bills WHERE bill_rule_id = ? ORDER BY due_date DESC LIMIT 1",
			[ruleId]
		);

		let nextDueDate: Date;
		const baseDate = lastBill
			? new Date(lastBill.due_date)
			: new Date(rule.start_date);

		switch (rule.frequency) {
			case "Weekly":
				nextDueDate = new Date(baseDate);
				nextDueDate.setDate(baseDate.getDate() + 7);
				break;
			case "Monthly":
				nextDueDate = new Date(baseDate);
				nextDueDate.setDate(baseDate.getDate() + 30);
				break;
			case "Quarterly":
				nextDueDate = new Date(baseDate);
				nextDueDate.setMonth(baseDate.getMonth() + 3);
				break;
			case "Yearly":
				nextDueDate = new Date(baseDate);
				nextDueDate.setFullYear(baseDate.getFullYear() + 1);
				break;
			case "OneTime":
				// For one-time bills, use the start date if no bill exists
				if (lastBill) return null;
				nextDueDate = new Date(rule.start_date);
				break;
			default:
				nextDueDate = new Date(baseDate);
		}

		// Robust duplication check: Ensure no bill exists with the exact same due date for this rule
		const existingWithSameDate = await db.getAllAsync<Bill>(
			"SELECT * FROM bills WHERE bill_rule_id = ? AND date(due_date) = date(?)",
			[ruleId, nextDueDate.toISOString()]
		);

		if (existingWithSameDate.length > 0) {
			return null;
		}

		// Create the new bill
		const billId = await this.createBill(db, {
			bill_rule_id: ruleId,
			due_date: nextDueDate.toISOString(),
			amount: rule.amount,
			status: "Pending",
			created_at: new Date().toISOString(),
		});

		return billId;
	},

	/**
	 * Check and update overdue bills
	 * Should be called on app load
	 * @param db Database instance
	 */
	async checkOverdueBills(db: SQLiteDatabase): Promise<void> {
		const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD

		// Get all pending bills that are past due
		const overdueBills = await db.getAllAsync<Bill>(
			"SELECT * FROM bills WHERE status = 'Pending' AND date(due_date) < date(?)",
			[today]
		);

		// Update each to Overdue status
		for (const bill of overdueBills) {
			await this.updateBill(db, bill.id, { status: "Overdue" });

			// If auto_next is enabled, generate the next bill
			const rule = await this.getRuleById(db, bill.bill_rule_id);
			if (rule && rule.is_active && rule.auto_next) {
				await this.generateNextBill(db, rule.id);
			}
		}
	},
};
