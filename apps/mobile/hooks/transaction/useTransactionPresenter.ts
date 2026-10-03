import { useCallback } from "react";
import { SQLiteDatabase } from "expo-sqlite";
import { useQuery } from "../useQuery";
import { Transaction } from "../../types";
import { getCategoryIcon } from "../../constants/categoryIcons";
import type { IconName } from "../../components/ui/icons";

type Named = { name: string; currency?: string };

interface Lookups {
	types: Record<number, string>;
	categories: Record<number, string>;
	accounts: Record<number, Named>;
	assets: Record<number, Named>;
	receivables: Record<number, Named>;
}

const EMPTY: Lookups = {
	types: {},
	categories: {},
	accounts: {},
	assets: {},
	receivables: {},
};

const loadLookups = async (db: SQLiteDatabase): Promise<Lookups> => {
	const [types, categories, accounts, assets, receivables] = await Promise.all([
		db.getAllAsync<{ id: number; name: string }>("SELECT id, name FROM transaction_types"),
		db.getAllAsync<{ id: number; name: string }>("SELECT id, name FROM categories"),
		db.getAllAsync<{ id: number; name: string; currency: string }>(
			"SELECT id, name, currency FROM accounts"
		),
		db.getAllAsync<{ id: number; name: string; currency: string }>(
			"SELECT id, name, currency FROM assets"
		),
		db.getAllAsync<{ id: number; name: string; currency: string }>(
			"SELECT id, title AS name, currency FROM receivables"
		),
	]);
	const byId = <T extends { id: number }, V>(rows: T[], map: (r: T) => V) =>
		Object.fromEntries(rows.map((r) => [r.id, map(r)])) as Record<number, V>;
	return {
		types: byId(types, (r) => r.name),
		categories: byId(categories, (r) => r.name),
		accounts: byId(accounts, (r) => ({ name: r.name, currency: r.currency })),
		assets: byId(assets, (r) => ({ name: r.name, currency: r.currency })),
		receivables: byId(receivables, (r) => ({ name: r.name, currency: r.currency })),
	};
};

export type TransactionKind = "income" | "expense" | "transfer";

export interface TransactionView {
	kind: TransactionKind;
	typeName: string;
	title: string;
	/** Category · account, or source → destination for transfers. */
	subtitle: string;
	categoryName: string;
	currency: string;
	icon: IconName;
	fromLabel: string;
	toLabel: string;
	linkCount: number;
}

// Auto-generated descriptions end in " — Sep 25, 2026"; the date is shown elsewhere.
const AUTO_DATE_SUFFIX = / — [A-Z][a-z]{2,8} \d{1,2}, \d{4}$/;

/**
 * Resolves the names, currency, icon and wording needed to display a
 * transaction. One query loads every lookup table the app needs for this.
 */
export function useTransactionPresenter() {
	const { data: lookups, loading } = useQuery<Lookups>(loadLookups, [], EMPTY);

	const describe = useCallback(
		(tx: Transaction): TransactionView => {
			const typeName = lookups.types[tx.transaction_type_id] ?? "";
			const kind: TransactionKind =
				typeName === "Income" ? "income" : typeName === "Transfer" ? "transfer" : "expense";
			const account = (id?: number | null) => (id ? lookups.accounts[id] : undefined);
			const asset = tx.asset_id ? lookups.assets[tx.asset_id] : undefined;
			const receivable = tx.receivable_id ? lookups.receivables[tx.receivable_id] : undefined;
			const from = account(tx.from_account_id);
			const to = account(tx.to_account_id);
			const categoryName = tx.category_id ? lookups.categories[tx.category_id] ?? "" : "";

			const currency =
				from?.currency ?? to?.currency ?? asset?.currency ?? receivable?.currency ?? "RWF";

			let fromLabel = "";
			let toLabel = "";
			let subtitle: string;
			let icon: IconName;

			if (kind === "transfer") {
				const counterpart = receivable?.name ?? asset?.name ?? "";
				fromLabel = from?.name ?? counterpart;
				toLabel = to?.name ?? counterpart;
				if (!from && !to && asset) {
					subtitle = `Reinvested in ${asset.name}`;
					icon = "autorenew";
				} else {
					subtitle = `${fromLabel || "—"} → ${toLabel || "—"}`;
					icon = receivable ? "hand-coin-outline" : asset ? "chart-line" : "swap-horizontal";
				}
			} else {
				const accountName = (from ?? to)?.name ?? asset?.name ?? "";
				fromLabel = kind === "expense" ? accountName : "";
				toLabel = kind === "income" ? accountName : "";
				subtitle = [categoryName, accountName].filter(Boolean).join(" · ");
				icon = getCategoryIcon(categoryName, kind);
			}

			const linkCount = [
				tx.liability_id,
				tx.envelope_id,
				tx.bill_id,
				tx.entity_id,
				kind !== "transfer" ? tx.asset_id : null,
			].filter(Boolean).length;

			const title =
				(tx.description ?? "").trim().replace(AUTO_DATE_SUFFIX, "") ||
				categoryName ||
				typeName ||
				"Transaction";

			return {
				kind,
				typeName,
				title,
				// Avoid repeating the title (e.g. auto-named transfers).
				subtitle: title === subtitle ? typeName : subtitle,
				categoryName,
				currency,
				icon,
				fromLabel,
				toLabel,
				linkCount,
			};
		},
		[lookups]
	);

	return { describe, loading };
}
