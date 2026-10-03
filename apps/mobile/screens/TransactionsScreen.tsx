import React, { useMemo, useRef, useState } from "react";
import {
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
} from "react-native";
import { AnimatedFAB, IconButton, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DatePickerModal } from "react-native-paper-dates";
import TransactionSectionList, {
	TransactionListRow,
	useDescribedTransactions,
} from "../components/TransactionSectionList";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonList } from "../components/ui/Skeleton";
import Dropdown from "../components/ui/Dropdown";
import CurrencyPicker from "../components/CurrencyPicker";
import { useActiveCurrency } from "../contexts/PreferencesContext";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import type { IconName } from "../components/ui/icons";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import { fontFamily, radius, spacing, useKTheme, tabularNums } from "../theme/theme";
import { formatCompactAmount } from "../utils/currency";
import {
	addMonths,
	formatMonthYear,
	formatShortDate,
	isSameMonth,
	monthName,
	monthRange,
	parseLocalDate,
	toLocalISODate,
} from "../utils/date";
import { getCategoryIcon } from "../constants/categoryIcons";
import type { TransactionFilter } from "../types";

type Period =
	| { mode: "month"; anchor: Date }
	| { mode: "year"; year: number }
	| { mode: "all" }
	| { mode: "custom"; start: string; end: string };

type KindFilter = "all" | "Expense" | "Income" | "Transfer";

const KIND_CHIPS: { value: KindFilter; label: string; icon?: IconName }[] = [
	{ value: "all", label: "All" },
	{ value: "Expense", label: "Expenses", icon: "arrow-top-right" },
	{ value: "Income", label: "Income", icon: "arrow-bottom-left" },
	{ value: "Transfer", label: "Transfers", icon: "swap-horizontal" },
];

const periodRange = (period: Period): { startDate?: string; endDate?: string } => {
	switch (period.mode) {
		case "month":
			return monthRange(period.anchor);
		case "year":
			return { startDate: `${period.year}-01-01`, endDate: `${period.year}-12-31` };
		case "custom":
			return { startDate: period.start, endDate: period.end };
		default:
			return {};
	}
};

const periodLabel = (period: Period) => {
	switch (period.mode) {
		case "month":
			return formatMonthYear(period.anchor);
		case "year":
			return String(period.year);
		case "custom":
			return `${formatShortDate(period.start)} – ${formatShortDate(period.end)}`;
		default:
			return "All time";
	}
};

const Chip: React.FC<{
	label: string;
	icon?: IconName;
	active: boolean;
	onPress: () => void;
	trailingIcon?: IconName;
}> = ({ label, icon, active, onPress, trailingIcon }) => {
	const theme = useKTheme();
	const fg = active ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant;
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityState={{ selected: active }}
			style={[
				styles.chip,
				{
					backgroundColor: active ? theme.colors.primaryContainer : theme.colors.surface,
					borderColor: active ? theme.colors.primaryContainer : theme.colors.outlineVariant,
				},
			]}
		>
			{icon ? <MaterialCommunityIcons name={icon} size={15} color={fg} /> : null}
			<Text variant="labelLarge" style={{ color: fg }} numberOfLines={1}>
				{label}
			</Text>
			{trailingIcon ? <MaterialCommunityIcons name={trailingIcon} size={16} color={fg} /> : null}
		</Pressable>
	);
};

const TransactionsScreen = () => {
	const theme = useKTheme();
	const { openComposer } = useTransactionComposer();
	const { transactionTypes } = useGetTransactionTypes();
	const { accounts } = useGetAccounts();
	const { categories } = useGetCategories();

	const [period, setPeriod] = useState<Period>({ mode: "month", anchor: new Date() });
	const [kind, setKind] = useState<KindFilter>("all");
	const [categoryId, setCategoryId] = useState<number | null>(null);
	const [query, setQuery] = useState("");
	const [periodSheet, setPeriodSheet] = useState(false);
	const [categorySheet, setCategorySheet] = useState(false);
	const periodAnchor = useRef<View>(null);
	const categoryAnchor = useRef<View>(null);
	const [rangePicker, setRangePicker] = useState(false);
	const [fabExtended, setFabExtended] = useState(true);

	const filter = useMemo<TransactionFilter>(() => {
		const typeId =
			kind === "all" ? undefined : transactionTypes.find((t) => t.name === kind)?.id;
		return {
			...periodRange(period),
			transactionTypeId: typeId,
			categoryId: categoryId ?? undefined,
		};
	}, [period, kind, categoryId, transactionTypes]);

	const { transactions, loading, error, refresh, refreshing, pullToRefresh } =
		useGetTransactions(filter);

	const described = useDescribedTransactions(transactions);
	// One currency at a time: amounts in different currencies can't be summed.
	const currencies = useMemo(() => {
		const counts: Record<string, number> = {};
		accounts.forEach((a) => (counts[a.currency] = (counts[a.currency] ?? 0) + 1));
		return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
	}, [accounts]);
	const [currency, setCurrency] = useActiveCurrency(currencies);

	const rows = useMemo<TransactionListRow[]>(() => {
		const q = query.trim().toLowerCase();
		const inCurrency = currency ? described.filter(({ view }) => view.currency === currency) : described;
		if (!q) return inCurrency;
		return inCurrency.filter(
			({ tx, view }) =>
				view.title.toLowerCase().includes(q) ||
				view.subtitle.toLowerCase().includes(q) ||
				String(tx.amount).includes(q.replace(/,/g, ""))
		);
	}, [described, query, currency]);

	const summary = useMemo(() => {
		const totals: Record<string, { income: number; expenses: number }> = {};
		rows.forEach(({ tx, view }) => {
			if (view.kind === "transfer") return;
			const t = (totals[view.currency] ??= { income: 0, expenses: 0 });
			if (view.kind === "income") t.income += tx.amount;
			else t.expenses += tx.amount;
		});
		return Object.entries(totals);
	}, [rows]);

	const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const y = e.nativeEvent.contentOffset.y;
		setFabExtended(y <= 8);
	};

	const shiftMonth = (delta: number) => {
		if (period.mode === "month") {
			setPeriod({ mode: "month", anchor: addMonths(period.anchor, delta) });
		} else if (period.mode === "year") {
			setPeriod({ mode: "year", year: period.year + delta });
		}
	};

	const canShift = period.mode === "month" || period.mode === "year";
	const atPresent =
		(period.mode === "month" && isSameMonth(period.anchor, new Date())) ||
		(period.mode === "year" && period.year === new Date().getFullYear());

	const categoryOptions = useMemo(() => {
		const typeId =
			kind === "all" || kind === "Transfer"
				? undefined
				: transactionTypes.find((t) => t.name === kind)?.id;
		return categories
			.filter((c) => !typeId || c.transaction_type_id === typeId)
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((c) => {
				const typeName = transactionTypes.find((t) => t.id === c.transaction_type_id)?.name;
				return {
					value: c.id,
					label: c.name,
					description: kind === "all" ? typeName : undefined,
					icon: getCategoryIcon(c.name, typeName === "Income" ? "income" : "expense"),
				};
			});
	}, [categories, kind, transactionTypes]);

	const selectedCategory = categories.find((c) => c.id === categoryId);
	const hasFilters = kind !== "all" || !!categoryId || !!query;

	const header = (
		<View>
			{/* Search + currency */}
			<View style={styles.searchRow}>
			<View
				style={[
					styles.search,
					{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
				]}
			>
				<MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceVariant} />
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder="Search transactions"
					placeholderTextColor={theme.colors.onSurfaceVariant}
					style={[styles.searchInput, { color: theme.colors.onSurface }]}
					returnKeyType="search"
					autoCorrect={false}
					accessibilityLabel="Search transactions"
				/>
				{query ? (
					<IconButton icon="close-circle" size={18} onPress={() => setQuery("")} style={{ margin: 0 }} accessibilityLabel="Clear search" />
				) : null}
			</View>
			{currencies.length > 1 && currency ? (
				<CurrencyPicker currencies={currencies} value={currency} onChange={setCurrency} />
			) : null}
			</View>

			{/* Period navigator */}
			<View style={styles.periodRow}>
				<IconButton
					icon="chevron-left"
					onPress={() => shiftMonth(-1)}
					disabled={!canShift}
					accessibilityLabel="Previous period"
				/>
				<Pressable
					ref={periodAnchor}
					onPress={() => setPeriodSheet(true)}
					style={styles.periodLabel}
					accessibilityRole="button"
					accessibilityLabel={`Period: ${periodLabel(period)}. Change period`}
				>
					<Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
						{periodLabel(period)}
					</Text>
					<MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.onSurfaceVariant} />
				</Pressable>
				<IconButton
					icon="chevron-right"
					onPress={() => shiftMonth(1)}
					disabled={!canShift || atPresent}
					accessibilityLabel="Next period"
				/>
			</View>

			{/* Summary */}
			{summary.length > 0 ? (
				<View style={styles.summaryWrap}>
					{summary.map(([cur, t]) => {
						const net = t.income - t.expenses;
						return (
							<View
								key={cur}
								style={[styles.summary, { backgroundColor: theme.colors.surface, borderColor: theme.custom.cardBorder }]}
							>
								<View style={styles.summaryCell}>
									<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
										IN
									</Text>
									<Text variant="titleSmall" numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.custom.income, ...tabularNums }}>
										{formatCompactAmount(t.income, cur)}
									</Text>
								</View>
								<View style={[styles.summaryDivider, { backgroundColor: theme.colors.outlineVariant }]} />
								<View style={styles.summaryCell}>
									<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
										OUT
									</Text>
									<Text variant="titleSmall" numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.colors.onSurface, ...tabularNums }}>
										{formatCompactAmount(t.expenses, cur)}
									</Text>
								</View>
								<View style={[styles.summaryDivider, { backgroundColor: theme.colors.outlineVariant }]} />
								<View style={styles.summaryCell}>
									<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
										NET
									</Text>
									<Text
										variant="titleSmall"
										numberOfLines={1}
										adjustsFontSizeToFit
										style={{ color: net < 0 ? theme.custom.expense : theme.custom.income, ...tabularNums }}
									>
										{`${net >= 0 ? "+" : "-"}${formatCompactAmount(Math.abs(net), cur)}`}
									</Text>
								</View>
							</View>
						);
					})}
				</View>
			) : null}

			{/* Filters */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.chips}
				style={styles.chipsScroll}
				keyboardShouldPersistTaps="handled"
			>
				{KIND_CHIPS.map((chip) => (
					<Chip
						key={chip.value}
						label={chip.label}
						icon={chip.icon}
						active={kind === chip.value}
						onPress={() => {
							setKind(chip.value);
							setCategoryId(null);
						}}
					/>
				))}
				{kind !== "Transfer" ? (
					<View ref={categoryAnchor} collapsable={false}>
						<Chip
							label={selectedCategory ? selectedCategory.name : "Category"}
							icon="shape-outline"
							trailingIcon="chevron-down"
							active={!!categoryId}
							onPress={() => setCategorySheet(true)}
						/>
					</View>
				) : null}
			</ScrollView>
		</View>
	);

	const renderEmpty = () => {
		if (loading) return <SkeletonList rows={7} />;
		if (error) {
			return (
				<EmptyState
					icon="cloud-alert"
					tone="error"
					title="Couldn't load transactions"
					message={error}
					actionLabel="Try again"
					onAction={refresh}
				/>
			);
		}
		if (hasFilters) {
			return (
				<EmptyState
					icon="filter-remove-outline"
					title="No matches"
					message="Nothing matches these filters for this period."
					actionLabel="Clear filters"
					actionIcon="filter-remove-outline"
					onAction={() => {
						setKind("all");
						setCategoryId(null);
						setQuery("");
					}}
				/>
			);
		}
		if (period.mode === "month") {
			const previous = addMonths(period.anchor, -1);
			return (
				<EmptyState
					icon="calendar-blank-outline"
					title={`Nothing in ${formatMonthYear(period.anchor)} yet`}
					message={`Add a transaction, or look back at ${monthName(previous)}.`}
					actionLabel={`View ${monthName(previous)}`}
					onAction={() => shiftMonth(-1)}
					actionIcon="arrow-left"
				/>
			);
		}
		return (
			<EmptyState
				icon="receipt"
				title="No transactions"
				message="Record an expense, income or transfer to see it here."
				actionLabel="Add transaction"
				onAction={() => openComposer()}
			/>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<TransactionSectionList
				rows={loading ? [] : rows}
				header={header}
				empty={renderEmpty()}
				refreshing={refreshing}
				onRefresh={pullToRefresh}
				onScroll={onScroll}
			/>

			<AnimatedFAB
				icon="plus"
				label="New"
				extended={fabExtended}
				onPress={() =>
					openComposer(kind === "all" ? undefined : { type: kind })
				}
				style={styles.fab}
				color={theme.colors.onPrimary}
				accessibilityLabel="New transaction"
				theme={{ colors: { primaryContainer: theme.colors.primary } }}
			/>

			<Dropdown
				visible={periodSheet}
				onDismiss={() => setPeriodSheet(false)}
				anchor={periodAnchor}
				variant="menu"
				options={[
					{ value: "this-month", label: "This month", icon: "calendar-today" },
					{ value: "last-month", label: "Last month", icon: "calendar-arrow-left" },
					{ value: "this-year", label: "This year", icon: "calendar-range" },
					{ value: "all", label: "All time", icon: "infinity" },
					{ value: "custom", label: "Custom range…", icon: "calendar-edit" },
				]}
				onSelect={(v) => {
					setPeriodSheet(false);
					const now = new Date();
					if (v === "this-month") setPeriod({ mode: "month", anchor: now });
					else if (v === "last-month") setPeriod({ mode: "month", anchor: addMonths(now, -1) });
					else if (v === "this-year") setPeriod({ mode: "year", year: now.getFullYear() });
					else if (v === "all") setPeriod({ mode: "all" });
					else if (v === "custom") setRangePicker(true);
				}}
			/>

			<Dropdown
				visible={categorySheet}
				onDismiss={() => setCategorySheet(false)}
				anchor={categoryAnchor}
				minWidth={260}
				options={categoryOptions}
				selected={categoryId}
				clearable
				onSelect={(v) => {
					setCategoryId(v);
					setCategorySheet(false);
				}}
			/>

			<DatePickerModal
				locale="en-GB"
				mode="range"
				visible={rangePicker}
				startDate={period.mode === "custom" ? parseLocalDate(period.start) : undefined}
				endDate={period.mode === "custom" ? parseLocalDate(period.end) : undefined}
				onDismiss={() => setRangePicker(false)}
				onConfirm={({ startDate, endDate }) => {
					setRangePicker(false);
					if (startDate && endDate) {
						setPeriod({
							mode: "custom",
							start: toLocalISODate(startDate),
							end: toLocalISODate(endDate),
						});
					}
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingHorizontal: spacing.lg,
		paddingBottom: 120,
	},
	searchRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	search: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		height: 46,
		borderRadius: radius.pill,
		borderWidth: StyleSheet.hairlineWidth,
		paddingLeft: spacing.lg,
		paddingRight: spacing.xs,
	},
	searchInput: {
		flex: 1,
		marginLeft: spacing.sm,
		fontFamily: fontFamily.regular,
		fontSize: 15,
		paddingVertical: 0,
	},
	periodRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: spacing.sm,
		marginHorizontal: -spacing.sm,
	},
	periodLabel: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	summaryWrap: {
		gap: spacing.sm,
	},
	summary: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: radius.xl,
		borderWidth: StyleSheet.hairlineWidth,
		paddingVertical: spacing.md,
	},
	summaryCell: {
		flex: 1,
		alignItems: "center",
		paddingHorizontal: spacing.sm,
	},
	summaryDivider: {
		width: StyleSheet.hairlineWidth,
		alignSelf: "stretch",
	},
	chipsScroll: {
		marginHorizontal: -spacing.lg,
		marginTop: spacing.md,
	},
	chips: {
		paddingHorizontal: spacing.lg,
		gap: spacing.sm,
		paddingBottom: spacing.xs,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		height: 36,
		paddingHorizontal: spacing.md,
		borderRadius: radius.pill,
		borderWidth: 1,
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
	fab: {
		position: "absolute",
		right: spacing.lg,
		bottom: spacing.lg,
	},
});

export default TransactionsScreen;
