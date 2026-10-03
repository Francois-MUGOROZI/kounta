import React, { useCallback, useMemo, useRef, useState } from "react";
import {
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeroCard from "../components/ui/HeroCard";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import IconBadge from "../components/ui/IconBadge";
import ProgressBar from "../components/ui/ProgressBar";
import ActionRow from "../components/ui/ActionRow";
import EmptyState from "../components/ui/EmptyState";
import ListItem from "../components/ui/ListItem";
import AmountText from "../components/ui/AmountText";
import StatGrid from "../components/ui/StatGrid";
import Dropdown, { Option } from "../components/ui/Dropdown";
import { DashboardRepository } from "../repositories/DashboardRepository";
import CurrencyPicker from "../components/CurrencyPicker";
import { Skeleton } from "../components/ui/Skeleton";
import DonutChart from "../components/charts/DonutChart";
import TransactionRow from "../components/TransactionRow";
import { useHomeData } from "../hooks/dashboard/useHomeData";
import { useQuery } from "../hooks/useQuery";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { useActiveCurrency } from "../contexts/PreferencesContext";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetEnvelopes } from "../hooks/envelope/useGetEnvelope";
import { useGetBills } from "../hooks/bill/useGetBills";
import { useTransactionPresenter } from "../hooks/transaction/useTransactionPresenter";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import { chartPalette, radius, spacing, useKTheme, tabularNums } from "../theme/theme";
import { formatAmount, formatCompactAmount } from "../utils/currency";
import { addMonths, daysUntil, formatMonthYear, formatShortDate, greeting, monthRange } from "../utils/date";
import { getCategoryIcon } from "../constants/categoryIcons";
import { CategoryTotal, RootStackParamList, Transaction } from "../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type BreakdownPeriod = "this-month" | "last-month" | "this-year" | "all";

const BREAKDOWN_PERIODS: Option<BreakdownPeriod>[] = [
	{ value: "this-month", label: "This month", icon: "calendar-today" },
	{ value: "last-month", label: "Last month", icon: "calendar-arrow-left" },
	{ value: "this-year", label: "This year", icon: "calendar-range" },
	{ value: "all", label: "All time", icon: "infinity" },
];

const breakdownRange = (period: BreakdownPeriod) => {
	const now = new Date();
	switch (period) {
		case "this-month":
			return monthRange(now);
		case "last-month":
			return monthRange(addMonths(now, -1));
		case "this-year":
			return { startDate: `${now.getFullYear()}-01-01`, endDate: `${now.getFullYear()}-12-31` };
		default:
			return { startDate: "0000-01-01", endDate: "9999-12-31" };
	}
};

const HeroStat: React.FC<{ label: string; value: string }> = ({ label, value }) => {
	const theme = useKTheme();
	return (
		<View style={styles.heroStat}>
			<Text variant="labelSmall" style={{ color: theme.custom.onHeroMuted }}>
				{label}
			</Text>
			<Text
				variant="titleSmall"
				numberOfLines={1}
				adjustsFontSizeToFit
				style={{ color: theme.custom.onHero, ...tabularNums }}
			>
				{value}
			</Text>
		</View>
	);
};

const DashboardScreen: React.FC = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { openComposer } = useTransactionComposer();
	const { data, loading, error, refreshing, pullToRefresh, refresh } = useHomeData();
	const { accounts } = useGetAccounts();
	const { envelopes } = useGetEnvelopes();
	const { bills } = useGetBills(undefined, true);
	const { describe } = useTransactionPresenter();

	const currencies = useMemo(() => {
		// Most-used currency first (by number of accounts), then the rest.
		const counts: Record<string, number> = {};
		accounts.forEach((a) => (counts[a.currency] = (counts[a.currency] ?? 0) + 1));
		return Object.keys(data.totals).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
	}, [data.totals, accounts]);

	const [currency, setCurrency] = useActiveCurrency(currencies);
	const [showAllCategories, setShowAllCategories] = useState(false);
	const [breakdownPeriod, setBreakdownPeriod] = useState<BreakdownPeriod>("this-month");
	const [periodOpen, setPeriodOpen] = useState(false);
	const periodAnchor = useRef<View>(null);
	const { data: breakdown } = useQuery<CategoryTotal[]>(
		(db) => {
			const { startDate, endDate } = breakdownRange(breakdownPeriod);
			return DashboardRepository.getExpensesByCategoryInRange(db, startDate, endDate);
		},
		[breakdownPeriod],
		[]
	);
	const { data: recent } = useQuery<Transaction[]>(
		(db) => (currency ? TransactionRepository.getRecentInCurrency(db, currency, 5) : Promise.resolve([])),
		[currency],
		[]
	);

	const openTransaction = useCallback(
		(tx: Transaction) => navigation.navigate("TransactionDetail", { transactionId: tx.id }),
		[navigation]
	);

	const goToTab = (tab: "Accounts" | "Transactions" | "Envelopes") =>
		navigation.navigate("Main", { screen: tab });

	const palette = chartPalette(theme.dark);

	if (loading) {
		return (
			<ScrollView
				style={{ backgroundColor: theme.colors.background }}
				contentContainerStyle={styles.content}
			>
				<Skeleton height={190} borderRadius={radius.xxl} />
				<View style={[styles.quickRow, { marginTop: spacing.lg }]}>
					{[0, 1, 2].map((i) => (
						<Skeleton key={i} height={88} borderRadius={radius.xl} style={{ flex: 1 }} />
					))}
				</View>
				<Skeleton height={140} borderRadius={radius.xl} style={{ marginTop: spacing.lg }} />
				<Skeleton height={220} borderRadius={radius.xl} style={{ marginTop: spacing.lg }} />
			</ScrollView>
		);
	}

	if (error && currencies.length === 0) {
		return (
			<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon="cloud-alert"
					tone="error"
					title="Couldn't load your overview"
					message={error}
					actionLabel="Try again"
					onAction={refresh}
				/>
			</View>
		);
	}

	const quickActions = (
		<ActionRow
			actions={[
				{ label: "Expense", icon: "arrow-top-right", color: theme.custom.expense, background: theme.custom.expenseContainer, onPress: () => openComposer({ type: "Expense" }) },
				{ label: "Income", icon: "arrow-bottom-left", color: theme.custom.income, background: theme.custom.incomeContainer, onPress: () => openComposer({ type: "Income" }) },
				{ label: "Transfer", icon: "swap-horizontal", color: theme.custom.transfer, background: theme.custom.transferContainer, onPress: () => openComposer({ type: "Transfer" }) },
			]}
		/>
	);

	if (!currency) {
		return (
			<ScrollView
				style={{ backgroundColor: theme.colors.background }}
				contentContainerStyle={styles.content}
			>
				<EmptyState
					icon="wallet-plus-outline"
					title="Welcome to Kounta"
					message="Start by adding the accounts you keep money in — a bank account, mobile money or cash."
					actionLabel="Add an account"
					onAction={() => goToTab("Accounts")}
				/>
			</ScrollView>
		);
	}

	const totals = data.totals[currency];
	const month = data.thisMonth[currency] ?? { income: 0, expenses: 0 };
	const last = data.lastMonthToDate[currency] ?? { income: 0, expenses: 0 };
	const net = month.income - month.expenses;
	const spendDiff = month.expenses - last.expenses;
	const flowMax = Math.max(month.income, month.expenses, 1);

	const categories = breakdown.filter((c) => c.currency === currency);
	const periodLabel = BREAKDOWN_PERIODS.find((p) => p.value === breakdownPeriod)!.label;
	const topCategories = categories.slice(0, 5);
	const otherTotal = categories.slice(5).reduce((s, c) => s + c.total, 0);
	const categoryTotal = categories.reduce((s, c) => s + c.total, 0);
	const slices = [
		...topCategories.map((c, i) => ({ value: c.total, color: palette[i % palette.length] })),
		...(otherTotal > 0 ? [{ value: otherTotal, color: palette[palette.length - 1] }] : []),
	];

	const currencyAccounts = accounts.filter((a) => a.currency === currency);
	const currencyEnvelopes = envelopes
		.filter((e) => e.currency === currency)
		.sort((a, b) => a.current_balance / (a.total_amount || 1) - b.current_balance / (b.total_amount || 1));
	const upcomingBills = bills.filter((b) => b.currency === currency).slice(0, 3);

	return (
		<>
			<ScrollView
				style={{ backgroundColor: theme.colors.background }}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={pullToRefresh}
						colors={[theme.colors.primary]}
						progressBackgroundColor={theme.colors.surface}
					/>
				}
			>
				<View style={styles.greetingRow}>
					<Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
						{greeting()}
					</Text>
					{currencies.length > 1 ? (
						<CurrencyPicker
							currencies={currencies}
							value={currency}
							onChange={setCurrency}
							trailing={(c) => formatCompactAmount(data.totals[c]?.netWorth ?? 0, c)}
						/>
					) : null}
				</View>

				{/* Net worth */}
				<HeroCard>
					<View style={styles.heroTop}>
						<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
							Net worth
						</Text>
					</View>
					<AmountText
						amount={totals?.netWorth ?? 0}
						currency={currency}
						tone="onHero"
						variant="displaySmall"
						style={styles.heroAmount}
					/>
					<View style={[styles.heroStats, { borderTopColor: "rgba(255,255,255,0.16)" }]}>
						<HeroStat label="Cash" value={formatCompactAmount(totals?.accountBalance ?? 0, currency)} />
						<HeroStat
							label="Assets"
							value={formatCompactAmount((totals?.assetValue ?? 0) + (totals?.receivableValue ?? 0), currency)}
						/>
						<HeroStat label="Debts" value={formatCompactAmount(totals?.liabilityValue ?? 0, currency)} />
					</View>
				</HeroCard>

				{quickActions}

				{/* This month */}
				<Card style={styles.section}>
					<View style={styles.rowBetween}>
						<Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
							{formatMonthYear(new Date())}
						</Text>
						<View
							style={[
								styles.netPill,
								{ backgroundColor: net >= 0 ? theme.custom.incomeContainer : theme.custom.expenseContainer },
							]}
						>
							<Text
								variant="labelMedium"
								style={{ color: net >= 0 ? theme.custom.income : theme.custom.expense }}
							>
								{`${net >= 0 ? "+" : "-"}${formatCompactAmount(Math.abs(net), currency)} net`}
							</Text>
						</View>
					</View>
					<View style={styles.flowRow}>
						<View style={styles.flowLabel}>
							<MaterialCommunityIcons name="arrow-bottom-left" size={16} color={theme.custom.income} />
							<Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
								Money in
							</Text>
						</View>
						<AmountText amount={month.income} currency={currency} />
					</View>
					<ProgressBar progress={month.income / flowMax} color={theme.custom.income} height={6} />
					<View style={styles.flowRow}>
						<View style={styles.flowLabel}>
							<MaterialCommunityIcons name="arrow-top-right" size={16} color={theme.custom.expense} />
							<Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}>
								Money out
							</Text>
						</View>
						<AmountText amount={month.expenses} currency={currency} />
					</View>
					<ProgressBar progress={month.expenses / flowMax} color={theme.custom.expense} height={6} />
					{last.expenses > 0 && spendDiff !== 0 ? (
						<View style={[styles.footnoteRow, { backgroundColor: theme.colors.surfaceVariant }]}>
							<MaterialCommunityIcons
								name={spendDiff > 0 ? "trending-up" : "trending-down"}
								size={16}
								color={spendDiff > 0 ? theme.custom.expense : theme.custom.income}
							/>
							<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
								{`You've spent ${formatCompactAmount(Math.abs(spendDiff), currency)} ${
									spendDiff > 0 ? "more" : "less"
								} than this time last month.`}
							</Text>
						</View>
					) : null}
				</Card>

				{/* All-time totals */}
				<SectionHeader title="All time" style={styles.sectionTitle} />
				<StatGrid
					style={{ marginTop: 0 }}
					items={[
						{ label: "Total income", value: formatAmount(totals?.totalIncome ?? 0, currency), tone: "income" },
						{ label: "Total expenses", value: formatAmount(totals?.totalExpenses ?? 0, currency), tone: "expense" },
						{ label: "Account balance", value: formatAmount(totals?.accountBalance ?? 0, currency) },
						{ label: "Asset value", value: formatAmount(totals?.assetValue ?? 0, currency) },
						{ label: "Receivables", value: formatAmount(totals?.receivableValue ?? 0, currency) },
						{ label: "Liabilities", value: formatAmount(totals?.liabilityValue ?? 0, currency), tone: (totals?.liabilityValue ?? 0) > 0 ? "expense" : "default" },
					]}
				/>

				{/* Spending by category */}
				<View style={[styles.rowBetween, styles.sectionTitle, { marginBottom: spacing.sm }]}>
					<Text variant="titleMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
						Where your money went
					</Text>
					<Pressable
						ref={periodAnchor}
						onPress={() => setPeriodOpen(true)}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel={`Period: ${periodLabel}. Change period`}
						style={[styles.periodPill, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}
					>
						<Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
							{periodLabel}
						</Text>
						<MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.onSurface} />
					</Pressable>
				</View>
				<Dropdown
					visible={periodOpen}
					onDismiss={() => setPeriodOpen(false)}
					anchor={periodAnchor}
					variant="menu"
					alignRight
					minWidth={190}
					options={BREAKDOWN_PERIODS}
					onSelect={(v) => {
						setPeriodOpen(false);
						if (v) setBreakdownPeriod(v);
					}}
				/>
				<Card>
					{categoryTotal > 0 ? (
						<>
						<View style={styles.donutRow}>
							<DonutChart slices={slices} size={128} thickness={14}>
								<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
									Spent
								</Text>
								<Text
									variant="titleSmall"
									style={{ color: theme.colors.onSurface, ...tabularNums }}
								>
									{formatCompactAmount(categoryTotal, currency)}
								</Text>
							</DonutChart>
							<View style={styles.legend}>
								{topCategories.map((c, i) => (
									<View key={c.category} style={styles.legendRow}>
										<View style={[styles.dot, { backgroundColor: palette[i % palette.length] }]} />
										<Text variant="bodySmall" numberOfLines={1} style={{ flex: 1, color: theme.colors.onSurface }}>
											{c.category}
										</Text>
										<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, ...tabularNums }}>
											{`${Math.round((c.total / categoryTotal) * 100)}%`}
										</Text>
									</View>
								))}
								{otherTotal > 0 ? (
									<View style={styles.legendRow}>
										<View style={[styles.dot, { backgroundColor: palette[palette.length - 1] }]} />
										<Text variant="bodySmall" style={{ flex: 1, color: theme.colors.onSurface }}>
											{`${categories.length - topCategories.length} more`}
										</Text>
										<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, ...tabularNums }}>
											{`${Math.round((otherTotal / categoryTotal) * 100)}%`}
										</Text>
									</View>
								) : null}
							</View>
						</View>
						{showAllCategories ? (
							<View style={styles.categoryList}>
								{categories.map((c, i) => (
									<Pressable
										key={c.category}
										onPress={() => c.categoryId && navigation.navigate("CategoryDetail", { categoryId: c.categoryId })}
										android_ripple={{ color: theme.colors.surfaceDisabled }}
										accessibilityRole="button"
										accessibilityLabel={`${c.category}, ${formatAmount(c.total, currency)}`}
										style={styles.categoryRow}
									>
										<View style={styles.rowBetween}>
											<View style={[styles.legendRow, { flex: 1 }]}>
												<IconBadge icon={getCategoryIcon(c.category)} size={28} />
												<Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1, color: theme.colors.onSurface }}>
													{c.category}
												</Text>
											</View>
											<Text variant="labelLarge" style={{ color: theme.colors.onSurface, ...tabularNums }}>
												{formatAmount(c.total, currency)}
											</Text>
										</View>
										<ProgressBar
											progress={c.total / (categories[0]?.total || 1)}
											color={palette[Math.min(i, palette.length - 1)]}
											height={4}
											style={{ marginTop: 6, marginLeft: 36, width: "auto" }}
										/>
									</Pressable>
								))}
							</View>
						) : null}
						<Pressable
							onPress={() => setShowAllCategories((v) => !v)}
							style={styles.toggle}
							accessibilityRole="button"
							accessibilityState={{ expanded: showAllCategories }}
						>
							<Text variant="labelLarge" style={{ color: theme.colors.primary }}>
								{showAllCategories ? "Show less" : `Show all ${categories.length} categories`}
							</Text>
							<MaterialCommunityIcons
								name={showAllCategories ? "chevron-up" : "chevron-down"}
								size={18}
								color={theme.colors.primary}
							/>
						</Pressable>
					</>
					) : (
						<View style={styles.inlineEmpty}>
							<IconBadge icon={getCategoryIcon("misc")} size={36} rounded="full" />
							<Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1, marginLeft: spacing.md }}>
								{`No spending recorded ${breakdownPeriod === "all" ? "yet" : periodLabel.toLowerCase()}.`}
							</Text>
						</View>
					)}
				</Card>

				{/* Accounts */}
				<SectionHeader
					title="Accounts"
					actionLabel="See all"
					onAction={() => goToTab("Accounts")}
					style={styles.sectionTitle}
				/>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.accountsRow}
					style={styles.bleed}
				>
					{currencyAccounts.map((a) => (
						<Card
							key={a.id}
							style={styles.accountCard}
							onPress={() => navigation.navigate("AccountDetail", { accountId: a.id })}
							accessibilityLabel={`${a.name}, ${formatAmount(a.current_balance, a.currency)}`}
						>
							<IconBadge icon="wallet-outline" size={32} />
							<Text
								variant="bodySmall"
								numberOfLines={1}
								style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.md }}
							>
								{a.name}
							</Text>
							<AmountText amount={a.current_balance} currency={a.currency} tone="auto" variant="titleMedium" />
						</Card>
					))}
				</ScrollView>

				{/* Envelopes */}
				{currencyEnvelopes.length > 0 ? (
					<>
						<SectionHeader
							title="Envelopes"
							actionLabel="See all"
							onAction={() => goToTab("Envelopes")}
							style={styles.sectionTitle}
						/>
						<Card padded={false}>
							{currencyEnvelopes.map((e, i) => {
								const ratio = e.total_amount > 0 ? e.current_balance / e.total_amount : 0;
								const color =
									e.current_balance < 0
										? theme.custom.expense
										: ratio < 0.2
										? theme.custom.warning
										: theme.colors.primary;
								return (
									<Pressable
										key={e.id}
										onPress={() => navigation.navigate("EnvelopeDetail", { envelopeId: e.id })}
										android_ripple={{ color: theme.colors.surfaceDisabled }}
										style={[
											styles.envelopeRow,
											i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant },
										]}
										accessibilityRole="button"
									>
										<View style={styles.rowBetween}>
											<Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface, flex: 1 }}>
												{e.name}
											</Text>
											<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
												<Text variant="labelLarge" style={{ color }}>
													{formatAmount(e.current_balance, e.currency)}
												</Text>
												{` left of ${formatCompactAmount(e.total_amount, e.currency)}`}
											</Text>
										</View>
										<ProgressBar progress={ratio} color={color} height={6} style={{ marginTop: spacing.sm }} />
									</Pressable>
								);
							})}
						</Card>
					</>
				) : null}

				{/* Bills */}
				{upcomingBills.length > 0 ? (
					<>
						<SectionHeader
							title="Upcoming bills"
							actionLabel="See all"
							onAction={() => navigation.navigate("Bills")}
							style={styles.sectionTitle}
						/>
						<Card padded={false}>
							{upcomingBills.map((b, i) => {
								const days = daysUntil(b.due_date);
								const overdue = b.status === "Overdue" || days < 0;
								const when = overdue
									? `Overdue · ${formatShortDate(b.due_date)}`
									: days === 0
									? "Due today"
									: days === 1
									? "Due tomorrow"
									: `Due in ${days} days`;
								return (
									<ListItem
										key={b.id}
										title={b.name}
										subtitle={when}
										left={
											<IconBadge
												icon="calendar-clock-outline"
												color={overdue ? theme.custom.expense : theme.custom.warning}
												background={overdue ? theme.custom.expenseContainer : theme.custom.warningContainer}
											/>
										}
										right={<AmountText amount={b.amount - (b.paid_amount ?? 0)} currency={b.currency} />}
										onPress={() => navigation.navigate("Bills")}
										style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }}
									/>
								);
							})}
						</Card>
					</>
				) : null}

				{/* Recent */}
				<SectionHeader
					title="Recent activity"
					actionLabel="See all"
					onAction={() => goToTab("Transactions")}
					style={styles.sectionTitle}
				/>
				<Card padded={false}>
					{recent.length === 0 ? (
						<EmptyState
							compact
							icon="receipt"
							title="No transactions yet"
							message="Record your first expense or income to see it here."
						/>
					) : (
						recent.map((tx, i) => (
							<View
								key={tx.id}
								style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }}
							>
								<TransactionRow transaction={tx} view={describe(tx)} onPress={openTransaction} showDate />
							</View>
						))
					)}
				</Card>
			</ScrollView>

		</>
	);
};

const styles = StyleSheet.create({
	fill: {
		flex: 1,
		justifyContent: "center",
	},
	content: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.xxxl * 2,
	},
	greetingRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		minHeight: 34,
		marginBottom: spacing.md,
		marginTop: -spacing.xs,
		marginLeft: spacing.xs,
	},
	heroTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	heroAmount: {
		marginTop: spacing.xs,
	},
	heroStats: {
		flexDirection: "row",
		marginTop: spacing.lg,
		paddingTop: spacing.md,
		borderTopWidth: 1,
	},
	heroStat: {
		flex: 1,
	},
	quickRow: {
		flexDirection: "row",
		gap: spacing.md,
		marginTop: spacing.lg,
	},
	quickAction: {
		flex: 1,
		alignItems: "center",
		paddingVertical: spacing.lg,
		borderRadius: radius.xl,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},
	section: {
		marginTop: spacing.lg,
	},
	sectionTitle: {
		marginTop: spacing.xxl,
	},
	rowBetween: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.sm,
	},
	netPill: {
		paddingHorizontal: spacing.md,
		paddingVertical: 4,
		borderRadius: radius.pill,
	},
	flowRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
	},
	flowLabel: {
		flexDirection: "row",
		alignItems: "center",
	},
	footnoteRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginTop: spacing.lg,
		padding: spacing.md,
		borderRadius: radius.md,
	},
	donutRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xl,
	},
	legend: {
		flex: 1,
		gap: spacing.sm,
	},
	legendRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	periodPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		height: 32,
		paddingHorizontal: spacing.md,
		borderRadius: radius.pill,
		borderWidth: StyleSheet.hairlineWidth,
	},
	categoryList: {
		marginTop: spacing.lg,
		gap: spacing.xs,
	},
	categoryRow: {
		paddingVertical: spacing.sm,
	},
	toggle: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		marginTop: spacing.md,
		paddingVertical: spacing.xs,
	},
	inlineEmpty: {
		flexDirection: "row",
		alignItems: "center",
	},
	bleed: {
		marginHorizontal: -spacing.lg,
	},
	accountsRow: {
		paddingHorizontal: spacing.lg,
		gap: spacing.md,
	},
	accountCard: {
		width: 168,
	},
	envelopeRow: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
});

export default DashboardScreen;
