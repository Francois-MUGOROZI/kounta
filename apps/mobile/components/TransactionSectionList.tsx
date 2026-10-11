import React, { useCallback, useMemo } from "react";
import {
	NativeScrollEvent,
	NativeSyntheticEvent,
	RefreshControl,
	SectionList,
	StyleSheet,
	View,
} from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TransactionRow from "./TransactionRow";
import {
	TransactionView,
	useTransactionPresenter,
} from "../hooks/transaction/useTransactionPresenter";
import { radius, spacing, tabularNums, useKTheme } from "../theme/theme";
import { formatAmount } from "../utils/currency";
import { formatDayHeading, formatMonthYear, parseLocalDate, toDayKey } from "../utils/date";
import type { RootStackParamList, Transaction } from "../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export interface TransactionListRow {
	tx: Transaction;
	view: TransactionView;
}

interface Section {
	key: string;
	title: string;
	net: Record<string, number>;
	data: TransactionListRow[];
}

/** Pairs each transaction with its display view (names, currency, icon). */
export const useDescribedTransactions = (transactions: Transaction[]): TransactionListRow[] => {
	const { describe } = useTransactionPresenter();
	return useMemo(() => transactions.map((tx) => ({ tx, view: describe(tx) })), [transactions, describe]);
};

interface TransactionSectionListProps {
	rows: TransactionListRow[];
	header?: React.ReactElement | null;
	empty?: React.ReactElement | null;
	refreshing?: boolean;
	onRefresh?: () => void;
	onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
	/** Shown under the list header — e.g. a "Transactions" title. */
	sectionTitle?: string;
	/** Shown at the right of `sectionTitle` — e.g. a period picker. */
	sectionAction?: React.ReactNode;
	/** Group into month cards (default) or day cards, for busy histories like the main Transactions list. */
	groupBy?: "day" | "month";
}

const buildSections = (rows: TransactionListRow[], groupBy: "day" | "month"): Section[] => {
	const map = new Map<string, Section>();
	rows.forEach((row) => {
		const dayKey = toDayKey(row.tx.date);
		// "YYYY-MM" for months; rows arrive newest first, so sections do too.
		const key = groupBy === "month" ? dayKey.slice(0, 7) : dayKey;
		let section = map.get(key);
		if (!section) {
			const title = groupBy === "month" ? formatMonthYear(parseLocalDate(`${key}-01`)) : formatDayHeading(key);
			section = { key, title, net: {}, data: [] };
			map.set(key, section);
		}
		section.data.push(row);
		if (row.view.kind !== "transfer") {
			const sign = row.view.kind === "income" ? 1 : -1;
			section.net[row.view.currency] =
				(section.net[row.view.currency] ?? 0) + sign * row.tx.amount;
		}
	});
	return Array.from(map.values());
};

/** Transactions grouped into month (or day) cards with a net per card, ready to drop into any screen. */
const TransactionSectionList: React.FC<TransactionSectionListProps> = ({
	rows,
	header,
	empty,
	refreshing = false,
	onRefresh,
	onScroll,
	sectionTitle,
	sectionAction,
	groupBy = "month",
}) => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const sections = useMemo(() => buildSections(rows, groupBy), [rows, groupBy]);

	const openTransaction = useCallback(
		(tx: Transaction) => navigation.navigate("TransactionDetail", { transactionId: tx.id }),
		[navigation]
	);

	const listHeader = (
		<View>
			{header}
			{sectionTitle ? (
				<View style={styles.sectionTitle}>
					<Text variant="titleMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
						{sectionTitle}
					</Text>
					{sectionAction}
				</View>
			) : null}
		</View>
	);

	return (
		<SectionList
			sections={sections}
			keyExtractor={(row) => String(row.tx.id)}
			ListHeaderComponent={listHeader}
			ListEmptyComponent={empty}
			stickySectionHeadersEnabled={false}
			keyboardShouldPersistTaps="handled"
			keyboardDismissMode="on-drag"
			onScroll={onScroll}
			scrollEventThrottle={64}
			initialNumToRender={14}
			windowSize={11}
			style={{ backgroundColor: theme.colors.background }}
			contentContainerStyle={styles.content}
			refreshControl={
				onRefresh ? (
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={[theme.colors.primary]}
						progressBackgroundColor={theme.colors.surface}
					/>
				) : undefined
			}
			renderSectionHeader={({ section }) => (
				<View style={styles.dayHeader}>
					<Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
						{section.title}
					</Text>
					<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, ...tabularNums }}>
						{Object.entries(section.net)
							.map(([cur, v]) => `${v > 0 ? "+" : v < 0 ? "-" : ""}${formatAmount(Math.abs(v), cur)}`)
							.join("  ·  ")}
					</Text>
				</View>
			)}
			renderItem={({ item, index, section }) => (
				<View
					style={[
						styles.rowWrap,
						{ backgroundColor: theme.colors.surface, borderColor: theme.custom.cardBorder },
						index === 0 && styles.rowFirst,
						index === section.data.length - 1 && styles.rowLast,
					]}
				>
					{index > 0 ? (
						<View style={[styles.innerDivider, { backgroundColor: theme.colors.outlineVariant }]} />
					) : null}
					<TransactionRow transaction={item.tx} view={item.view} onPress={openTransaction} />
				</View>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: spacing.lg,
		paddingBottom: 120,
	},
	sectionTitle: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.xxl,
		marginBottom: -spacing.sm,
	},
	dayHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.xs,
		paddingTop: spacing.xl,
		paddingBottom: spacing.sm,
	},
	rowWrap: {
		borderLeftWidth: StyleSheet.hairlineWidth,
		borderRightWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},
	rowFirst: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopLeftRadius: radius.xl,
		borderTopRightRadius: radius.xl,
	},
	rowLast: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomLeftRadius: radius.xl,
		borderBottomRightRadius: radius.xl,
	},
	innerDivider: {
		height: StyleSheet.hairlineWidth,
		marginLeft: 68,
	},
});

export default TransactionSectionList;
