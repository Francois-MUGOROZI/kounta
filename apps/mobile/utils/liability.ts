import { Liability } from "../types";

/** Share of the original amount already repaid, 0..1. */
export const repaidRatio = (l: Liability) =>
	l.total_amount > 0 ? Math.min(1, Math.max(0, (l.total_amount - l.current_balance) / l.total_amount)) : 0;
