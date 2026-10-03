import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Card from "../components/ui/Card";
import IconBadge from "../components/ui/IconBadge";
import AmountText from "../components/ui/AmountText";
import AppButton from "../components/ui/AppButton";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import EmptyState from "../components/ui/EmptyState";
import HeroCard from "../components/ui/HeroCard";
import ProgressBar from "../components/ui/ProgressBar";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { useConfirm } from "../components/ui/Confirm";
import BillFormSheet, { BillFormValues } from "../components/BillFormSheet";
import { useGetBills } from "../hooks/bill/useGetBills";
import { useCreateBill } from "../hooks/bill/useCreateBill";
import { useUpdateBill } from "../hooks/bill/useUpdateBill";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { getCategoryIcon } from "../constants/categoryIcons";
import type { Bill } from "../types";
import { formatAmount, formatCompactAmount } from "../utils/currency";
import { daysUntil, formatShortDate } from "../utils/date";
import { radius, spacing, useKTheme } from "../theme/theme";

const DUE_SOON_DAYS = 7;

type Group = "overdue" | "soon" | "upcoming" | "paid";

const GROUP_TITLES: Record<Group, string> = {
	overdue: "Overdue",
	soon: "Due this week",
	upcoming: "Upcoming",
	paid: "Paid",
};

const groupOf = (bill: Bill): Group => {
	if (bill.status === "Paid") return "paid";
	const days = daysUntil(bill.due_date);
	// Status is refreshed on launch; also treat past-due dates as overdue in between.
	if (bill.status === "Overdue" || days < 0) return "overdue";
	return days <= DUE_SOON_DAYS ? "soon" : "upcoming";
};

const dueLabel = (bill: Bill): string => {
	if (bill.status === "Paid") {
		return bill.paid_at ? `Paid ${formatShortDate(bill.paid_at)}` : "Paid";
	}
	const days = daysUntil(bill.due_date);
	if (days < 0) return `Overdue by ${-days} day${days === -1 ? "" : "s"}`;
	if (days === 0) return "Due today";
	if (days === 1) return "Due tomorrow";
	if (days <= 30) return `Due in ${days} days`;
	return `Due ${formatShortDate(bill.due_date)}`;
};

const BillsScreen = () => {
	const theme = useKTheme();
	const toast = useToast();
	const confirm = useConfirm();
	const { bills, loading, error, refresh, refreshing, pullToRefresh } = useGetBills();
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();
	const { createBill } = useCreateBill();
	const { updateBill, markAsPaid } = useUpdateBill();
	const { openComposer } = useTransactionComposer();

	const [formVisible, setFormVisible] = useState(false);
	const [editing, setEditing] = useState<Bill | null>(null);
	const [showPaid, setShowPaid] = useState(false);
	const [payingId, setPayingId] = useState<number | null>(null);
	const [fabExtended, setFabExtended] = useState(true);

	const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? "";

	const groups = useMemo(() => {
		const map: Record<Group, Bill[]> = { overdue: [], soon: [], upcoming: [], paid: [] };
		bills.forEach((b) => map[groupOf(b)].push(b));
		return map;
	}, [bills]);

	// Same window as the Home screen: overdue plus anything due in the next 30 days.
	const dueTotals = useMemo(() => {
		const map: Record<string, number> = {};
		bills.forEach((b) => {
			if (b.status === "Paid" || daysUntil(b.due_date) > 30) return;
			map[b.currency] = (map[b.currency] ?? 0) + (b.amount - (b.paid_amount ?? 0));
		});
		return Object.entries(map).sort((a, b) => b[1] - a[1]);
	}, [bills]);

	const openCreate = () => {
		setEditing(null);
		setFormVisible(true);
	};

	const openEdit = (bill: Bill) => {
		setEditing(bill);
		setFormVisible(true);
	};

	const handleSubmit = async (values: BillFormValues) => {
		if (editing) {
			await updateBill(editing.id, values);
			toast.success("Bill updated");
		} else {
			await createBill({ ...values, paid_amount: 0 });
			toast.success(`${values.name} added`);
		}
		setFormVisible(false);
	};

	const handleMarkPaid = async (bill: Bill) => {
		const ok = await confirm({
			title: `Mark “${bill.name}” as paid?`,
			message:
				"This only updates the bill. If money left one of your accounts, record it as an expense too so your balances stay right.",
			confirmLabel: "Mark as paid",
		});
		if (!ok) return;
		setPayingId(bill.id);
		try {
			await markAsPaid(bill.id);
			toast.success(`${bill.name} marked as paid`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Couldn't update the bill");
		} finally {
			setPayingId(null);
		}
	};

	const renderBill = (bill: Bill, index: number) => {
		const group = groupOf(bill);
		const paid = group === "paid";
		const remaining = bill.amount - (bill.paid_amount ?? 0);
		const partial = !paid && (bill.paid_amount ?? 0) > 0;
		const tint =
			group === "overdue"
				? { fg: theme.custom.expense, bg: theme.custom.expenseContainer }
				: group === "soon"
				? { fg: theme.custom.warning, bg: theme.custom.warningContainer }
				: paid
				? { fg: theme.custom.income, bg: theme.custom.incomeContainer }
				: { fg: theme.colors.onPrimaryContainer, bg: theme.colors.primaryContainer };
		const category = categoryName(bill.category_id);
		// Only pending bills are editable — overdue/paid bills keep their record.
		const editable = bill.status === "Pending";

		return (
			<Pressable
				key={bill.id}
				onPress={editable ? () => openEdit(bill) : undefined}
				disabled={!editable}
				android_ripple={{ color: theme.colors.surfaceDisabled }}
				accessibilityRole={editable ? "button" : undefined}
				accessibilityLabel={`${bill.name}, ${formatAmount(remaining, bill.currency)}, ${dueLabel(bill)}`}
				style={[
					styles.bill,
					index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant },
					paid && { opacity: 0.7 },
				]}
			>
				<View style={styles.billTop}>
					<IconBadge icon={paid ? "check" : getCategoryIcon(category)} color={tint.fg} background={tint.bg} />
					<View style={styles.billBody}>
						<Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
							{bill.name}
						</Text>
						<Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
							{category ? `${category}  ·  ` : ""}
							<Text
								variant="bodySmall"
								style={{ color: group === "overdue" ? theme.custom.expense : group === "soon" ? theme.custom.warning : theme.colors.onSurfaceVariant }}
							>
								{dueLabel(bill)}
							</Text>
						</Text>
					</View>
					<View style={styles.billRight}>
						<AmountText amount={paid ? bill.amount : remaining} currency={bill.currency} tone={paid ? "muted" : "default"} />
						{partial ? (
							<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
								{`of ${formatAmount(bill.amount, bill.currency)}`}
							</Text>
						) : null}
					</View>
				</View>
				{partial ? (
					<ProgressBar
						progress={(bill.paid_amount ?? 0) / bill.amount}
						color={theme.custom.income}
						height={6}
						style={styles.progress}
					/>
				) : null}
				{!paid ? (
					<View style={styles.billActions}>
						<AppButton
							mode="text"
							compact
							icon="check"
							onPress={() => handleMarkPaid(bill)}
							loading={payingId === bill.id}
							accessibilityLabel={`Mark ${bill.name} as paid without recording a transaction`}
						>
							Mark as paid
						</AppButton>
						<AppButton
							mode="contained-tonal"
							compact
							icon="cash-fast"
							onPress={() =>
								openComposer({
									type: "Expense",
									billId: bill.id,
									categoryId: bill.category_id || undefined,
									amount: remaining,
								})
							}
							accessibilityLabel={`Pay ${bill.name}`}
						>
							Pay
						</AppButton>
					</View>
				) : null}
			</Pressable>
		);
	};

	const renderGroup = (group: Group) => {
		const list = groups[group];
		if (list.length === 0) return null;
		return (
			<View key={group}>
				<Text variant="titleSmall" style={[styles.groupTitle, { color: group === "overdue" ? theme.custom.expense : theme.colors.onSurface }]}>
					{`${GROUP_TITLES[group]} · ${list.length}`}
				</Text>
				<Card padded={false}>{list.map(renderBill)}</Card>
			</View>
		);
	};

	const renderBody = () => {
		if (loading) return <SkeletonList rows={6} />;
		if (error && bills.length === 0) {
			return (
				<EmptyState icon="cloud-alert" tone="error" title="Couldn't load bills" message={error} actionLabel="Try again" onAction={refresh} />
			);
		}
		if (bills.length === 0) {
			return (
				<EmptyState
					icon="calendar-clock-outline"
					title="No bills yet"
					message="Add rent, school fees, utilities and other payments so you can see what's coming up."
					actionLabel="Add bill"
					onAction={openCreate}
				/>
			);
		}
		const [main, ...others] = dueTotals;
		const overdueCount = groups.overdue.length;
		const unpaid = groups.overdue.length + groups.soon.length + groups.upcoming.length;
		return (
			<>
				<HeroCard>
					<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
						Due in the next 30 days
					</Text>
					{main ? (
						<AmountText amount={main[1]} currency={main[0]} tone="onHero" variant="displaySmall" />
					) : (
						<Text variant="headlineMedium" style={{ color: theme.custom.onHero }}>
							Nothing due
						</Text>
					)}
					<View style={styles.heroMeta}>
						{overdueCount > 0 ? (
							<View style={styles.overduePill}>
								<MaterialCommunityIcons name="alert-circle" size={14} color={theme.custom.onHero} />
								<Text variant="labelMedium" style={{ color: theme.custom.onHero }}>
									{`${overdueCount} overdue`}
								</Text>
							</View>
						) : null}
						<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted }}>
							{`${unpaid} unpaid`}
							{others.map(([cur, v]) => `  ·  ${formatCompactAmount(v, cur)}`).join("")}
						</Text>
					</View>
				</HeroCard>

				{renderGroup("overdue")}
				{renderGroup("soon")}
				{renderGroup("upcoming")}
				{unpaid === 0 ? (
					<EmptyState compact icon="check-all" title="All caught up" message="Every bill is paid." />
				) : null}

				{groups.paid.length > 0 ? (
					<>
						<Pressable
							onPress={() => setShowPaid((v) => !v)}
							style={styles.paidToggle}
							accessibilityRole="button"
							accessibilityState={{ expanded: showPaid }}
						>
							<Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
								{`Paid · ${groups.paid.length}`}
							</Text>
							<MaterialCommunityIcons
								name={showPaid ? "chevron-up" : "chevron-down"}
								size={20}
								color={theme.colors.onSurfaceVariant}
							/>
						</Pressable>
						{showPaid ? <Card padded={false}>{groups.paid.map(renderBill)}</Card> : null}
					</>
				) : null}
				{unpaid > 0 ? (
					<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
						Tap a pending bill to edit it.
					</Text>
				) : null}
			</>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<ScrollView
				contentContainerStyle={styles.content}
				onScroll={(e) => setFabExtended(e.nativeEvent.contentOffset.y <= 8)}
				scrollEventThrottle={64}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={pullToRefresh}
						colors={[theme.colors.primary]}
						progressBackgroundColor={theme.colors.surface}
					/>
				}
			>
				{renderBody()}
			</ScrollView>
			{bills.length > 0 ? (
				<AnimatedFAB
					icon="plus"
					label="Add bill"
					extended={fabExtended}
					onPress={openCreate}
					style={styles.fab}
					color={theme.colors.onPrimary}
					theme={{ colors: { primaryContainer: theme.colors.primary } }}
					accessibilityLabel="Add bill"
				/>
			) : null}
			<BillFormSheet
				visible={formVisible}
				onDismiss={() => setFormVisible(false)}
				categories={categories}
				transactionTypes={transactionTypes}
				bill={editing}
				onSubmit={handleSubmit}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.lg,
		paddingBottom: 120,
	},
	heroMeta: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	overduePill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "rgba(255,255,255,0.18)",
		paddingHorizontal: spacing.sm,
		paddingVertical: 3,
		borderRadius: radius.pill,
	},
	groupTitle: {
		marginTop: spacing.xxl,
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.xs,
	},
	bill: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
	billTop: {
		flexDirection: "row",
		alignItems: "center",
	},
	billBody: {
		flex: 1,
		marginLeft: spacing.md,
	},
	billRight: {
		alignItems: "flex-end",
		marginLeft: spacing.md,
		flexShrink: 0,
	},
	progress: {
		marginTop: spacing.md,
	},
	billActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	paidToggle: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: spacing.xxl,
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.xs,
		paddingVertical: spacing.xs,
	},
	hint: {
		textAlign: "center",
		marginTop: spacing.xl,
	},
	fab: {
		position: "absolute",
		right: spacing.lg,
		bottom: spacing.lg,
		borderRadius: radius.lg,
	},
});

export default BillsScreen;
