import { SQLiteDatabase } from "expo-sqlite";
import { Bill, BillRule, BillStatus } from "../types";
import { emitEvent, EVENTS } from "../utils/events";
import { format } from "date-fns";
import { generateBillName, getNextDueDate } from "../utils/bills";

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

		for (const [key, value] of Object.entries(updates)) {
			if (key !== "id" && value !== undefined) {
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
			`SELECT * FROM bills ORDER BY CASE status WHEN 'Overdue' THEN 0 WHEN 'Pending' THEN 1 WHEN 'Paid' THEN 2 ELSE 3 END, CASE WHEN status = 'Paid' THEN date(due_date) END DESC, CASE WHEN status != 'Paid' THEN date(due_date) END ASC`
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
		const orderBy =
			status === "Paid"
				? "ORDER BY date(due_date) DESC"
				: "ORDER BY date(due_date) ASC";
		return await db.getAllAsync<Bill>(
			`SELECT * FROM bills WHERE status = ? ${orderBy}`,
			[status]
		);
	},
	async getUnpaidBills(db: SQLiteDatabase): Promise<Bill[]> {
		return await db.getAllAsync<Bill>(
			`SELECT * FROM bills WHERE status != 'Paid' ORDER BY CASE status WHEN 'Overdue' THEN 0 WHEN 'Pending' THEN 1 ELSE 2 END, date(due_date) ASC`
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
		const bill_rule_id: number | null = bill.bill_rule_id ?? null;
		const due_date: string = bill.due_date;
		const amount: number = typeof bill.amount === "number" ? bill.amount : 0;
		const status: string = bill.status ?? "Pending";
		const transaction_id: number | null = bill.transaction_id ?? null;
		const paid_at: string | null = bill.paid_at ?? null;
		const created_at: string =
			bill.created_at ?? format(new Date(), "yyyy-MM-dd");
		const category_id: number =
			typeof bill.category_id === "number" ? bill.category_id : 0;
		const name: string = bill.name;
		const currency: string = bill.currency;

		// Check for duplicate bills - handle NULL bill_rule_id properly
		let existingBill: Bill | null = null;
		if (bill_rule_id === null) {
			// For one-time bills, check by name and due_date
			existingBill = await db.getFirstAsync<Bill>(
				"SELECT * FROM bills WHERE bill_rule_id IS NULL AND due_date = ? AND name = ?",
				[due_date, name]
			);
		} else {
			// For recurring bills, check by bill_rule_id and due_date
			existingBill = await db.getFirstAsync<Bill>(
				"SELECT * FROM bills WHERE bill_rule_id = ? AND due_date = ?",
				[bill_rule_id, due_date]
			);
		}

		if (existingBill) {
			throw new Error("Bill already exists with the same due date");
		}

		const result = await db.runAsync(
			`INSERT INTO bills (bill_rule_id, due_date, amount, status, transaction_id, paid_at, created_at, category_id, name, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				bill_rule_id,
				due_date,
				amount,
				status,
				transaction_id,
				paid_at,
				created_at,
				category_id,
				name,
				currency,
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

		for (const [key, value] of Object.entries(updates)) {
			if (key !== "id" && value !== undefined) {
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
	 * Mark a bill as paid (manually or fully)
	 * @param db Database instance
	 * @param billId Bill ID
	 * @param transactionId Transaction ID (optional)
	 */
	async markAsPaid(
		db: SQLiteDatabase,
		billId: number,
		transactionId?: number
	): Promise<void> {
		const bill = await this.getBillById(db, billId);
		if (!bill) return;

		const updates: Partial<Bill> = {
			status: "Paid",
			paid_amount: bill.amount,
			paid_at: new Date().toISOString(),
		};

		if (transactionId) {
			updates.transaction_id = transactionId;
		}

		await this.updateBill(db, billId, updates);

		// Check if we need to generate the next bill (only for recurring bills with auto_next enabled)
		if (bill.bill_rule_id !== null) {
			const rule = await this.getRuleById(db, bill.bill_rule_id);
			// Only generate next bill for recurring rules (not OneTime) with auto_next enabled
			if (
				rule &&
				rule.is_active &&
				rule.auto_next &&
				rule.frequency !== "OneTime"
			) {
				await this.generateNextBill(db, rule.id);
			}
		}
	},

	/**
	 * Record a payment for a bill
	 * @param db Database instance
	 * @param billId Bill ID
	 * @param paymentAmount Amount paid
	 * @param transactionId Transaction ID (optional)
	 */
	async recordPayment(
		db: SQLiteDatabase,
		billId: number,
		paymentAmount: number,
		transactionId?: number
	): Promise<void> {
		const bill = await this.getBillById(db, billId);
		if (!bill) return;

		const currentPaid = bill.paid_amount || 0;
		const rawPaidAmount = currentPaid + paymentAmount;
		const clampedPaidAmount = Math.min(Math.max(rawPaidAmount, 0), bill.amount);
		const updates: Partial<Bill> = {
			paid_amount: clampedPaidAmount,
		};

		if (transactionId) {
			updates.transaction_id = transactionId;
		}

		// If fully paid, update status and paid_at
		if (clampedPaidAmount >= bill.amount) {
			updates.status = "Paid";
			updates.paid_at = new Date().toISOString();
		} else {
			updates.status = "Pending";
			updates.paid_at = null;
		}

		await this.updateBill(db, billId, updates);

		// If it's now paid, check if we need to generate the next bill
		if (updates.status === "Paid" && bill.bill_rule_id !== null) {
			const rule = await this.getRuleById(db, bill.bill_rule_id);
			if (
				rule &&
				rule.is_active &&
				rule.auto_next &&
				rule.frequency !== "OneTime"
			) {
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
		const today = format(new Date(), "yyyy-MM-dd"); // Get YYYY-MM-DD
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

		// If no bills exist yet, create the first bill from start_date (for all frequencies including OneTime)
		let nextDueDate: Date;
		let nextDueDateString: string;

		if (!lastBill) {
			// Create first bill from rule's start_date (works for all frequencies)
			nextDueDate = new Date(rule.start_date);
			nextDueDateString = format(nextDueDate, "yyyy-MM-dd");
		} else {
			// For OneTime frequency rules, don't generate subsequent bills
			if (rule.frequency === "OneTime") {
				return null;
			}
			// Calculate next due date from last bill (for recurring rules)
			nextDueDate = getNextDueDate(lastBill.due_date, rule.frequency);
			nextDueDateString = format(nextDueDate, "yyyy-MM-dd");
		}

		// Robust duplication check: Ensure no bill exists with the exact same due date for this rule
		const existingWithSameDate = await db.getAllAsync<Bill>(
			"SELECT * FROM bills WHERE bill_rule_id = ? AND date(due_date) = date(?)",
			[ruleId, nextDueDateString]
		);

		if (existingWithSameDate.length > 0) {
			return null;
		}

		const newBill: Omit<Bill, "id"> = {
			bill_rule_id: ruleId,
			due_date: nextDueDateString,
			amount: rule.amount,
			paid_amount: 0,
			status: "Pending",
			name: generateBillName(nextDueDateString, rule.name, rule.frequency),
			currency: rule.currency,
			category_id: rule.category_id,
			created_at: format(new Date(), "yyyy-MM-dd"),
		};

		// Create the new bill
		const billId = await this.createBill(db, newBill);

		return billId;
	},

	/**
	 * Check and update overdue bills
	 * Should be called on app load
	 * @param db Database instance
	 */
	async checkOverdueBills(db: SQLiteDatabase): Promise<void> {
		const today = format(new Date(), "yyyy-MM-dd"); // Get YYYY-MM-DD

		// Get all pending bills that are past due
		const overdueBills = await db.getAllAsync<Bill>(
			"SELECT * FROM bills WHERE status != 'Paid' AND date(due_date) < date(?)",
			[today]
		);

		// Update each to Overdue status
		for (const bill of overdueBills) {
			await this.updateBill(db, bill.id, { status: "Overdue" });

			// If auto_next is enabled, generate the next bill (only for recurring bills, not OneTime)
			if (bill.bill_rule_id !== null) {
				const rule = await this.getRuleById(db, bill.bill_rule_id);
				// Only generate next bill for recurring rules (not OneTime) with auto_next enabled
				if (
					rule &&
					rule.is_active &&
					rule.auto_next &&
					rule.frequency !== "OneTime"
				) {
					await this.generateNextBill(db, rule.id);
				}
			}
		}
	},
};
