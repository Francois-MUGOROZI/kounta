import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SQLiteDatabase } from "expo-sqlite";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import IconBadge from "../components/ui/IconBadge";
import EmptyState from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import type { IconName } from "../components/ui/icons";
import { useQuery } from "../hooks/useQuery";
import { useTransactionPresenter } from "../hooks/transaction/useTransactionPresenter";
import { RootStackParamList, Tag, Transaction } from "../types";
import { TagRepository } from "../repositories/TagRepository";
import { formatTransactionAmount } from "../utils/currency";
import { formatLongDate } from "../utils/date";
import { radius, spacing, tabularNums, useKTheme } from "../theme/theme";

type Route = RouteProp<RootStackParamList, "TransactionDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Linked {
	transaction: Transaction | null;
	fromAccount?: { id: number; name: string } | null;
	toAccount?: { id: number; name: string } | null;
	asset?: { id: number; name: string } | null;
	liability?: { id: number; name: string } | null;
	envelope?: { id: number; name: string } | null;
	bill?: { id: number; name: string } | null;
	receivable?: { id: number; name: string } | null;
	entity?: { id: number; name: string } | null;
	tags?: Tag[];
}

type Named = { id: number; name: string };

/** One query for the transaction and the names of everything it touches. */
const loadTransaction = async (db: SQLiteDatabase, id: number): Promise<Linked> => {
	const transaction = await db.getFirstAsync<Transaction>("SELECT * FROM transactions WHERE id = ?", [id]);
	if (!transaction) return { transaction: null };
	const one = (sql: string, ref?: number | null) =>
		ref ? db.getFirstAsync<Named>(sql, [ref]) : Promise.resolve(null);
	const [fromAccount, toAccount, asset, liability, envelope, bill, receivable, entity, tags] = await Promise.all([
		one("SELECT id, name FROM accounts WHERE id = ?", transaction.from_account_id),
		one("SELECT id, name FROM accounts WHERE id = ?", transaction.to_account_id),
		one("SELECT id, name FROM assets WHERE id = ?", transaction.asset_id),
		one("SELECT id, name FROM liabilities WHERE id = ?", transaction.liability_id),
		one("SELECT id, name FROM envelopes WHERE id = ?", transaction.envelope_id),
		one("SELECT id, name FROM bills WHERE id = ?", transaction.bill_id),
		one("SELECT id, title AS name FROM receivables WHERE id = ?", transaction.receivable_id),
		one("SELECT id, name FROM entities WHERE id = ?", transaction.entity_id),
		TagRepository.getByTransactionId(db, id),
	]);
	return { transaction, fromAccount, toAccount, asset, liability, envelope, bill, receivable, entity, tags };
};

const TransactionDetailScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { transactionId } = useRoute<Route>().params;
	const { describe } = useTransactionPresenter();
	const { data, loading, error, refresh } = useQuery<Linked>(
		(db) => loadTransaction(db, transactionId),
		[transactionId],
		{ transaction: null },
		"Failed to load transaction"
	);

	if (loading) {
		return (
			<View style={[styles.fill, { backgroundColor: theme.colors.background, padding: spacing.lg }]}>
				<Skeleton height={220} borderRadius={radius.xxl} />
				<Skeleton height={180} borderRadius={radius.xl} style={{ marginTop: spacing.lg }} />
			</View>
		);
	}

	const tx = data.transaction;
	if (!tx) {
		return (
			<View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon={error ? "cloud-alert" : "receipt"}
					tone={error ? "error" : "default"}
					title={error ? "Couldn't load this transaction" : "Transaction not found"}
					message={error ?? "It may have been removed."}
					actionLabel={error ? "Try again" : undefined}
					onAction={error ? refresh : undefined}
				/>
			</View>
		);
	}

	const view = describe(tx);
	const palette = {
		income: { fg: theme.custom.income, bg: theme.custom.incomeContainer },
		expense: { fg: theme.custom.expense, bg: theme.custom.expenseContainer },
		transfer: { fg: theme.custom.transfer, bg: theme.custom.transferContainer },
	}[view.kind];
	const amountColor = view.kind === "income" ? theme.custom.income : view.kind === "transfer" ? theme.custom.transfer : theme.colors.onSurface;

	const detailRows: { label: string; value: string; icon: IconName; onPress?: () => void }[] = [];
	detailRows.push({ label: "Type", value: view.typeName, icon: view.kind === "transfer" ? "swap-horizontal" : view.kind === "income" ? "arrow-bottom-left" : "arrow-top-right" });
	if (view.categoryName && tx.category_id) {
		const categoryId = tx.category_id;
		detailRows.push({
			label: "Category",
			value: view.categoryName,
			icon: "shape-outline",
			onPress: () => navigation.navigate("CategoryDetail", { categoryId }),
		});
	}
	if (data.fromAccount) {
		const acc = data.fromAccount;
		detailRows.push({ label: view.kind === "transfer" ? "From" : "Paid from", value: acc.name, icon: "wallet-outline", onPress: () => navigation.navigate("AccountDetail", { accountId: acc.id }) });
	}
	// A charge is paid from the debt it adds to, not from an account.
	const isCharge = !data.fromAccount && !data.toAccount && view.kind === "expense" && !!data.liability;
	if (isCharge && data.liability) {
		const l = data.liability;
		detailRows.push({ label: "Paid from", value: `${l.name} (debt)`, icon: "credit-card-clock-outline", onPress: () => navigation.navigate("LiabilityDetail", { liabilityId: l.id }) });
	}
	if (data.toAccount) {
		const acc = data.toAccount;
		detailRows.push({ label: view.kind === "transfer" ? "To" : "Received into", value: acc.name, icon: "wallet-plus-outline", onPress: () => navigation.navigate("AccountDetail", { accountId: acc.id }) });
	}
	detailRows.push({ label: "Date", value: formatLongDate(tx.date), icon: "calendar-blank-outline" });

	const links: { label: string; value: string; icon: IconName; onPress?: () => void }[] = [];
	if (data.asset) {
		const a = data.asset;
		links.push({ label: "Asset", value: a.name, icon: "diamond-stone", onPress: () => navigation.navigate("AssetDetail", { assetId: a.id }) });
	}
	if (data.receivable) {
		const r = data.receivable;
		links.push({ label: "Receivable", value: r.name, icon: "hand-coin-outline", onPress: () => navigation.navigate("ReceivableDetail", { receivableId: r.id }) });
	}
	if (data.envelope) {
		const e = data.envelope;
		links.push({ label: "Envelope", value: e.name, icon: "email-outline", onPress: () => navigation.navigate("EnvelopeDetail", { envelopeId: e.id }) });
	}
	if (data.liability && !isCharge) {
		const l = data.liability;
		links.push({ label: "Liability", value: l.name, icon: "credit-card-clock-outline", onPress: () => navigation.navigate("LiabilityDetail", { liabilityId: l.id }) });
	}
	if (data.bill) {
		links.push({ label: "Bill", value: data.bill.name, icon: "calendar-clock-outline", onPress: () => navigation.navigate("Bills") });
	}
	if (data.entity) {
		const en = data.entity;
		links.push({ label: "Entity", value: en.name, icon: "account-group-outline", onPress: () => navigation.navigate("EntityDetail", { entityId: en.id }) });
	}

	const renderRows = (rows: typeof detailRows) =>
		rows.map((row, i) => (
			<ListItem
				key={row.label}
				title={row.value}
				subtitle={row.label}
				left={<IconBadge icon={row.icon} size={36} background={theme.colors.surfaceVariant} color={theme.colors.onSurfaceVariant} />}
				chevron={!!row.onPress}
				onPress={row.onPress}
				style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }}
			/>
		));

	return (
		<ScrollView style={[styles.fill, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
			<Card style={styles.hero}>
				<IconBadge icon={view.icon} size={56} rounded="full" color={palette.fg} background={palette.bg} />
				<Text variant="displaySmall" style={[styles.amount, { color: amountColor, ...tabularNums }]} numberOfLines={1} adjustsFontSizeToFit>
					{formatTransactionAmount(tx.amount, view.currency, view.kind === "income", view.kind === "transfer")}
				</Text>
				<Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
					{view.title}
				</Text>
				<Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
					{view.kind === "transfer" ? view.subtitle : formatLongDate(tx.date)}
				</Text>
			</Card>

			<Text variant="labelMedium" style={[styles.groupTitle, { color: theme.colors.onSurfaceVariant }]}>
				DETAILS
			</Text>
			<Card padded={false}>{renderRows(detailRows)}</Card>

			{links.length > 0 ? (
				<>
					<Text variant="labelMedium" style={[styles.groupTitle, { color: theme.colors.onSurfaceVariant }]}>
						LINKED TO
					</Text>
					<Card padded={false}>{renderRows(links)}</Card>
				</>
			) : null}

			{data.tags?.length ? (
				<>
					<Text variant="labelMedium" style={[styles.groupTitle, { color: theme.colors.onSurfaceVariant }]}>
						TAGS
					</Text>
					<Card style={styles.tags}>
						{data.tags.map((tag) => (
							<View key={tag.id} style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant }]}>
								<MaterialCommunityIcons name="tag-outline" size={14} color={theme.colors.onSurfaceVariant} />
								<Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
									{tag.name}
								</Text>
							</View>
						))}
					</Card>
				</>
			) : null}

			<Text variant="bodySmall" style={[styles.footnote, { color: theme.colors.onSurfaceVariant }]}>
				{"Transactions can't be edited once saved, so your balances always add up."}
			</Text>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	center: {
		justifyContent: "center",
	},
	content: {
		padding: spacing.lg,
		paddingBottom: spacing.xxxl * 2,
	},
	hero: {
		alignItems: "center",
		paddingVertical: spacing.xxl,
	},
	amount: {
		marginTop: spacing.lg,
	},
	title: {
		marginTop: spacing.xs,
		textAlign: "center",
	},
	groupTitle: {
		marginTop: spacing.xl,
		marginBottom: spacing.sm,
		marginLeft: spacing.xs,
		letterSpacing: 0.8,
	},
	tags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
	},
	tag: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: spacing.md,
		paddingVertical: 6,
		borderRadius: radius.pill,
	},
	footnote: {
		textAlign: "center",
		marginTop: spacing.xl,
		paddingHorizontal: spacing.xl,
	},
});

export default TransactionDetailScreen;
