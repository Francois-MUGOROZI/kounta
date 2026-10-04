import { Liability, Transaction } from "../types";
import { toDayKey } from "./date";

/** Share of the original amount already repaid, 0..1. */
export const repaidRatio = (l: Liability) =>
	l.total_amount > 0 ? Math.min(1, Math.max(0, (l.total_amount - l.current_balance) / l.total_amount)) : 0;

export interface LiabilityBreakdown {
	/** Cash received (or the opening amount owed, for liabilities created without an account). */
	borrowed: number;
	/** Interest, fees and penalties added to the debt. */
	charges: number;
	paidBack: number;
	/** What's still owed, split interest-first: payments cover charges before principal. */
	principalLeft: number;
	chargesLeft: number;
}

const settled = (n: number) => (n < 0.005 ? 0 : n);

/**
 * Splits a liability into borrowed / charges / paid back, and what's still owed
 * into principal and charges. Payments are applied interest-first in date order,
 * so a payment only covers charges that existed when it was made.
 */
export const liabilityBreakdown = (
	l: Liability,
	transactions: Transaction[],
	typeName: (typeId: number) => string | undefined
): LiabilityBreakdown => {
	const rows = transactions
		.filter((t) => t.liability_id === l.id)
		.map((t) => {
			const type = typeName(t.transaction_type_id);
			const kind =
				type === "Expense" && !t.from_account_id
					? "charge"
					: type === "Transfer" && t.to_account_id && !t.from_account_id
					? "borrow"
					: type === "Transfer" && t.from_account_id && !t.to_account_id
					? "repay"
					: null;
			return { t, kind };
		})
		.filter((r) => r.kind)
		.sort((a, b) => toDayKey(a.t.date).localeCompare(toDayKey(b.t.date)) || a.t.id - b.t.id);

	const sum = (kind: string) => rows.filter((r) => r.kind === kind).reduce((s, r) => s + r.t.amount, 0);
	const charges = sum("charge");
	const paidBack = l.total_amount - l.current_balance;

	// Opening state: anything owed or paid that isn't one of these transactions
	// (e.g. a liability created without an account) is treated as principal.
	let principal = l.total_amount - charges - sum("borrow") - (paidBack - sum("repay"));
	let chargesOutstanding = 0;
	for (const { t, kind } of rows) {
		if (kind === "charge") {
			// A payment dated earlier may have overpaid principal; that credit covers the charge first.
			const credit = Math.min(Math.max(0, -principal), t.amount);
			principal += credit;
			chargesOutstanding += t.amount - credit;
		}
		else if (kind === "borrow") principal += t.amount;
		else {
			const toCharges = Math.min(chargesOutstanding, t.amount);
			chargesOutstanding -= toCharges;
			principal -= t.amount - toCharges;
		}
	}

	return {
		borrowed: l.total_amount - charges,
		charges,
		paidBack,
		principalLeft: settled(principal),
		chargesLeft: settled(chargesOutstanding),
	};
};
