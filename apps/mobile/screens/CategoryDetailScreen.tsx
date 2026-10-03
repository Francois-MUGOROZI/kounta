import React, { useLayoutEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeroCard from "../components/ui/HeroCard";
import AmountText from "../components/ui/AmountText";
import EmptyState from "../components/ui/EmptyState";
import IconBadge from "../components/ui/IconBadge";
import ActionRow from "../components/ui/ActionRow";
import StatGrid from "../components/ui/StatGrid";
import Card from "../components/ui/Card";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import CurrencyPicker from "../components/CurrencyPicker";
import TransactionSectionList, { useDescribedTransactions } from "../components/TransactionSectionList";
import CategoryFormSheet, { CategoryFormValues } from "../components/CategoryFormSheet";
import { useQuery } from "../hooks/useQuery";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { useUpdateCategory } from "../hooks/category/useUpdateCategory";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import { useActiveCurrency } from "../contexts/PreferencesContext";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { getCategoryIcon } from "../constants/categoryIcons";
import { Category, RootStackParamList } from "../types";
import { formatAmount, formatCompactAmount } from "../utils/currency";
import { addMonths, isSameMonth, parseLocalDate } from "../utils/date";
import { radius, spacing, tabularNums, useKTheme } from "../theme/theme";

type Route = RouteProp<RootStackParamList, "CategoryDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const MONTHS_SHOWN = 6;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Simple monthly bar chart; the current month is highlighted. */
const MonthBars: React.FC<{ values: { label: string; value: number }[]; color: string; currency: string }> = ({
	values,
	color,
	currency,
}) => {
	const theme = useKTheme();
	const max = Math.max(...values.map((v) => v.value), 1);
	return (
		<View style={styles.bars}>
			{values.map((v, i) => {
				const current = i === values.length - 1;
				return (
					<View key={v.label} style={styles.barCol} accessibilityLabel={`${v.label}: ${formatAmount(v.value, currency)}`}>
						<Text
							variant="labelSmall"
							numberOfLines={1}
							style={{ color: current ? theme.colors.onSurface : theme.colors.onSurfaceVariant, ...tabularNums }}
						>
							{v.value > 0 ? formatCompactAmount(v.value, currency).replace(/^[^\d-]+/, "") : ""}
						</Text>
						<View style={styles.barTrack}>
							<View
								style={[
									styles.bar,
									{
										height: `${Math.max(v.value > 0 ? 4 : 0, (v.value / max) * 100)}%`,
										backgroundColor: color,
										opacity: current ? 1 : 0.45,
									},
								]}
							/>
						</View>
						<Text variant="labelSmall" style={{ color: current ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
							{v.label}
						</Text>
					</View>
				);
			})}
		</View>
	);
};

const CategoryDetailScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { categoryId } = useRoute<Route>().params;
	const toast = useToast();
	const { openComposer } = useTransactionComposer();
	const { transactionTypes } = useGetTransactionTypes();
	const { updateCategory } = useUpdateCategory();
	const [editVisible, setEditVisible] = useState(false);

	const { data: category, loading, error, refresh } = useQuery<Category | null>(
		(db) => CategoryRepository.getById(db, categoryId),
		[categoryId],
		null,
		"Failed to load category"
	);
	const filter = useMemo(() => ({ categoryId }), [categoryId]);
	const { transactions, loading: loadingTx, refreshing, pullToRefresh } = useGetTransactions(filter);
	const rows = useDescribedTransactions(transactions);

	const currencies = useMemo(() => {
		const counts: Record<string, number> = {};
		rows.forEach((r) => (counts[r.view.currency] = (counts[r.view.currency] ?? 0) + 1));
		return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
	}, [rows]);
	const [currency, setCurrency] = useActiveCurrency(currencies);
	const visibleRows = useMemo(
		() => (currency ? rows.filter((r) => r.view.currency === currency) : rows),
		[rows, currency]
	);

	const typeName = transactionTypes.find((t) => t.id === category?.transaction_type_id)?.name ?? "";
	const isIncome = typeName === "Income";
	const kindColor = isIncome ? theme.custom.income : theme.custom.expense;

	const stats = useMemo(() => {
		const now = new Date();
		const months = Array.from({ length: MONTHS_SHOWN }, (_, i) => addMonths(now, i - (MONTHS_SHOWN - 1)));
		const perMonth = months.map((m) => ({ label: MONTH_LABELS[m.getMonth()], value: 0, date: m }));
		let total = 0;
		let lastMonthToDate = 0;
		let firstDate: Date | null = null;
		const prev = addMonths(now, -1);
		visibleRows.forEach(({ tx }) => {
			const d = parseLocalDate(tx.date);
			total += tx.amount;
			if (!firstDate || d < firstDate) firstDate = d;
			const bucket = perMonth.find((p) => isSameMonth(p.date, d));
			if (bucket) bucket.value += tx.amount;
			// Same point last month — a fair comparison for a month in progress.
			if (isSameMonth(d, prev) && d.getDate() <= now.getDate()) lastMonthToDate += tx.amount;
		});
		const thisMonth = perMonth[perMonth.length - 1].value;
		const lastMonth = perMonth[perMonth.length - 2].value;
		// Average over the months since the first transaction (at least one).
		const start = firstDate as Date | null;
		const monthsActive = start
			? (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1
			: 1;
		return { total, thisMonth, lastMonth, lastMonthToDate, average: total / Math.max(1, monthsActive), perMonth };
	}, [visibleRows]);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: category?.name ?? "Category",
			headerRight: () =>
				category ? (
					<IconButton icon="pencil-outline" onPress={() => setEditVisible(true)} accessibilityLabel="Edit category" />
				) : null,
		});
	}, [navigation, category]);

	if (loading) {
		return (
			<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
				<SkeletonList rows={6} />
			</View>
		);
	}

	if (!category) {
		return (
			<View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon={error ? "cloud-alert" : "shape-outline"}
					tone={error ? "error" : "default"}
					title={error ? "Couldn't load this category" : "Category not found"}
					message={error ?? "It may have been removed."}
					actionLabel={error ? "Try again" : undefined}
					onAction={error ? refresh : undefined}
				/>
			</View>
		);
	}

	const kind = isIncome ? "Income" : "Expense";
	const cur = currency ?? "RWF";

	const handleEdit = async (values: CategoryFormValues) => {
		await updateCategory(category.id, values);
		setEditVisible(false);
		toast.success("Category updated");
	};

	const header = (
		<View>
			<HeroCard>
				<View style={styles.heroTop}>
					<IconBadge
						icon={getCategoryIcon(category.name, isIncome ? "income" : "expense")}
						color={theme.custom.onHero}
						background="rgba(255,255,255,0.16)"
					/>
					<View style={{ flex: 1, marginLeft: spacing.md }}>
						<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
							{isIncome ? "Earned all time" : "Spent all time"}
						</Text>
						<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted }}>
							{`${visibleRows.length} transaction${visibleRows.length === 1 ? "" : "s"} · ${kind}`}
						</Text>
					</View>
					{currencies.length > 1 && currency ? (
						<CurrencyPicker tone="hero" currencies={currencies} value={currency} onChange={setCurrency} />
					) : null}
				</View>
				<AmountText amount={stats.total} currency={cur} tone="onHero" variant="displaySmall" style={{ marginTop: spacing.md }} />
			</HeroCard>

			<ActionRow
				actions={[
					{
						label: `Add ${kind.toLowerCase()}`,
						icon: isIncome ? "arrow-bottom-left" : "arrow-top-right",
						color: kindColor,
						background: isIncome ? theme.custom.incomeContainer : theme.custom.expenseContainer,
						onPress: () => openComposer({ type: kind, categoryId: category.id }),
					},
					{
						label: "Rename",
						icon: "pencil-outline",
						color: theme.colors.onSurfaceVariant,
						background: theme.colors.surfaceVariant,
						onPress: () => setEditVisible(true),
					},
				]}
			/>

			<StatGrid
				items={[
					{
						label: "This month",
						value: formatAmount(stats.thisMonth, cur),
						caption: `${formatCompactAmount(stats.lastMonthToDate, cur)} by this day last month`,
					},
					{ label: "Last month", value: formatAmount(stats.lastMonth, cur) },
					{ label: "Monthly average", value: formatAmount(Math.round(stats.average), cur) },
					{ label: "Transactions", value: String(visibleRows.length) },
				]}
			/>

			<Card style={{ marginTop: spacing.lg }}>
				<Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
					Last 6 months
				</Text>
				<MonthBars values={stats.perMonth} color={kindColor} currency={cur} />
			</Card>
		</View>
	);

	return (
		<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
			<TransactionSectionList
				rows={visibleRows}
				header={header}
				sectionTitle="Transactions"
				refreshing={refreshing}
				onRefresh={pullToRefresh}
				empty={
					loadingTx ? (
						<SkeletonList rows={4} />
					) : (
						<EmptyState
							compact
							icon="receipt"
							title="Nothing here yet"
							message={`${kind}s in ${category.name} will show up here.`}
							actionLabel={`Add ${kind.toLowerCase()}`}
							onAction={() => openComposer({ type: kind, categoryId: category.id })}
						/>
					)
				}
			/>
			<CategoryFormSheet
				visible={editVisible}
				onDismiss={() => setEditVisible(false)}
				transactionTypes={transactionTypes}
				category={category}
				onSubmit={handleEdit}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	center: {
		justifyContent: "center",
	},
	heroTop: {
		flexDirection: "row",
		alignItems: "center",
	},
	bars: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: spacing.sm,
		marginTop: spacing.md,
	},
	barCol: {
		flex: 1,
		alignItems: "center",
		gap: 4,
	},
	barTrack: {
		height: 96,
		width: "100%",
		justifyContent: "flex-end",
		alignItems: "center",
	},
	bar: {
		width: "70%",
		borderTopLeftRadius: radius.sm,
		borderTopRightRadius: radius.sm,
	},
});

export default CategoryDetailScreen;
