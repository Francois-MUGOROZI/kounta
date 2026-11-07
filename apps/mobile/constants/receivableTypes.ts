import type { IconName } from "../components/ui/icons";

export interface ReceivableTypeDef {
	label: string;
	description: string;
	icon: IconName;
	/** Whether a new receivable of this type starts Pending until money is sent out. */
	requiresOutflowByDefault: boolean;
	/** How collecting it is recorded: as earned Income, or as a Transfer of money already yours. */
	collection: "income" | "transfer";
}

// Single source of truth for receivable types. Add a type here and every
// picker, label and collection rule picks it up.
export const RECEIVABLE_TYPE_DEFS = {
	Loan: {
		label: "Loan",
		description: "Money you lent",
		icon: "account-cash-outline",
		requiresOutflowByDefault: true,
		collection: "transfer",
	},
	"Accrued-Income": {
		label: "Accrued income",
		description: "Earned, not yet paid: salary, invoices, interest",
		icon: "briefcase-outline",
		requiresOutflowByDefault: false,
		collection: "income",
	},
	Refund: {
		label: "Refund",
		description: "Money owed back to you",
		icon: "cash-refund",
		requiresOutflowByDefault: false,
		collection: "transfer",
	},
	"Refundable-Deposit": {
		label: "Refundable deposit",
		description: "Security deposit you'll get back: rent, utilities",
		icon: "safe",
		requiresOutflowByDefault: false,
		collection: "transfer",
	},
} as const satisfies Record<string, ReceivableTypeDef>;

export type ReceivableType = keyof typeof RECEIVABLE_TYPE_DEFS;

export const RECEIVABLE_TYPE_KEYS = Object.keys(RECEIVABLE_TYPE_DEFS) as ReceivableType[];

export const receivableTypeDef = (type: string): ReceivableTypeDef | undefined =>
	(RECEIVABLE_TYPE_DEFS as Record<string, ReceivableTypeDef>)[type];

/** Unknown or legacy types fall back to "transfer", the historical behaviour. */
export const receivableCollection = (type: string): ReceivableTypeDef["collection"] =>
	receivableTypeDef(type)?.collection ?? "transfer";
