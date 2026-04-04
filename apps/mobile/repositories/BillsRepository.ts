import { SQLiteDatabase } from "expo-sqlite";
import { Bill, BillStatus } from "../types";
import { emitEvent, EVENTS } from "../utils/events";
import { format } from "date-fns";

export const BillsRepository = {
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

		// Check for duplicate bills by name and due_date
		const existingBill = await db.getFirstAsync<Bill>(
			"SELECT * FROM bills WHERE due_date = ? AND name = ?",
			[due_date, name]
		);

		if (existingBill) {
			throw new Error("Bill already exists with the same name and due date");
		}

		const paid_amount: number =
			typeof bill.paid_amount === "number" ? bill.paid_amount : 0;

		const result = await db.runAsync(
			`INSERT INTO bills (due_date, amount, paid_amount, status, transaction_id, paid_at, created_at, category_id, name, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				due_date,
				amount,
				paid_amount,
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
	},

	/**
	 * Check and update overdue bills
	 * Should be called on app load
	 * @param db Database instance
	 */
	async checkOverdueBills(db: SQLiteDatabase): Promise<void> {
		const today = format(new Date(), "yyyy-MM-dd");

		// Get all pending bills that are past due
		const overdueBills = await db.getAllAsync<Bill>(
			"SELECT * FROM bills WHERE status != 'Paid' AND date(due_date) < date(?)",
			[today]
		);

		// Update each to Overdue status
		for (const bill of overdueBills) {
			await this.updateBill(db, bill.id, { status: "Overdue" });
		}
	},
};
