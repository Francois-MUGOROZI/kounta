import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { Option } from "./ui/Dropdown";
import type { IconName } from "./ui/icons";
import IconBadge from "./ui/IconBadge";
import AmountText from "./ui/AmountText";
import ProgressBar from "./ui/ProgressBar";
import { Receivable, ReceivableStatus, ReceivableType } from "../types";
import { formatAmount } from "../utils/currency";
import { daysUntil } from "../utils/date";
import { AppTheme, radius, spacing, useKTheme } from "../theme/theme";

/* ───────────── Shared receivable presentation helpers ───────────── */

export const RECEIVABLE_TYPES: Option<ReceivableType>[] = [
	{ value: "Personal-Loan", label: "Personal loan", icon: "account-cash-outline" },
	{ value: "IOU", label: "IOU", icon: "handshake-outline" },
	{ value: "Salary", label: "Salary", icon: "briefcase-outline" },
	{ value: "Refund", label: "Refund", icon: "cash-refund" },
	{ value: "Deposit", label: "Deposit", icon: "safe" },
	{ value: "Interest", label: "Interest", icon: "percent-outline" },
];

export const receivableTypeLabel = (type: ReceivableType) =>
	RECEIVABLE_TYPES.find((t) => t.value === type)?.label ?? type;

export const receivableTypeIcon = (type: ReceivableType): IconName =>
	RECEIVABLE_TYPES.find((t) => t.value === type)?.icon ?? "hand-coin-outline";

export const receivableStatusLabel = (status: ReceivableStatus) =>
	status === "Written-Off" ? "Written off" : status;

export const receivableStatusColors = (status: ReceivableStatus, theme: AppTheme) => {
	switch (status) {
		case "Active":
			return { fg: theme.colors.onPrimaryContainer, bg: theme.colors.primaryContainer };
		case "Pending":
			return { fg: theme.custom.warning, bg: theme.custom.warningContainer };
		case "Settled":
			return { fg: theme.custom.income, bg: theme.custom.incomeContainer };
		default:
			return { fg: theme.custom.expense, bg: theme.custom.expenseContainer };
	}
};

/** Small coloured status label. */
export const ReceivableStatusPill: React.FC<{ status: ReceivableStatus; onHero?: boolean }> = ({
	status,
	onHero,
}) => {
	const theme = useKTheme();
	const { fg, bg } = receivableStatusColors(status, theme);
	return (
		<View
			style={[
				pillStyles.pill,
				{ backgroundColor: onHero ? "rgba(255,255,255,0.18)" : bg },
			]}
		>
			<Text variant="labelSmall" style={{ color: onHero ? theme.custom.onHero : fg }}>
				{receivableStatusLabel(status)}
			</Text>
		</View>
	);
};

const pillStyles = StyleSheet.create({
	pill: {
		alignSelf: "flex-start",
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: radius.pill,
	},
});

/** Amount already collected — zero while a lending receivable awaits funding. */
export const receivableCollected = (r: Receivable) =>
	r.status === "Pending" && r.requires_outflow ? 0 : Math.max(0, r.principal - r.current_balance);

const dueContext = (r: Receivable): string | null => {
	if (!r.due_date || r.status === "Settled" || r.status === "Written-Off") return null;
	const days = daysUntil(r.due_date);
	if (days < 0) return `Overdue by ${-days} day${days === -1 ? "" : "s"}`;
	if (days === 0) return "Due today";
	if (days === 1) return "Due tomorrow";
	return `Due in ${days} days`;
};

/** Receivable summary row: type icon, who, status, due context, collection progress. */
export const ReceivableRow: React.FC<{
	receivable: Receivable;
	entityName?: string;
	onPress: () => void;
	onLongPress?: () => void;
	divider?: boolean;
}> = ({ receivable: r, entityName, onPress, onLongPress, divider }) => {
	const theme = useKTheme();
	const { fg, bg } = receivableStatusColors(r.status, theme);
	const collected = receivableCollected(r);
	const progress = r.principal > 0 ? collected / r.principal : 0;
	const due = dueContext(r);
	const overdue = !!due && due.startsWith("Overdue");
	const awaitingFunds = r.status === "Pending" && !!r.requires_outflow;
	const meta = [entityName, receivableTypeLabel(r.type)].filter(Boolean).join(" · ");
	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			android_ripple={{ color: theme.colors.surfaceDisabled }}
			accessibilityRole="button"
			accessibilityLabel={`${r.title}, ${receivableStatusLabel(r.status)}, ${formatAmount(r.current_balance, r.currency)} outstanding`}
			style={({ pressed }) => [
				rowStyles.row,
				divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant },
				pressed && { backgroundColor: theme.colors.surfaceVariant },
			]}
		>
			<View style={rowStyles.top}>
				<IconBadge icon={receivableTypeIcon(r.type)} color={fg} background={bg} />
				<View style={rowStyles.body}>
					<Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
						{r.title}
					</Text>
					<Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
						{meta}
					</Text>
				</View>
				<View style={rowStyles.right}>
					<AmountText
						amount={awaitingFunds ? r.principal : r.current_balance}
						currency={r.currency}
						tone={r.status === "Written-Off" ? "muted" : "default"}
					/>
					<View style={{ marginTop: 4 }}>
						<ReceivableStatusPill status={r.status} />
					</View>
				</View>
			</View>
			{r.status === "Active" || r.status === "Settled" ? (
				<View style={rowStyles.progress}>
					<ProgressBar progress={progress} height={5} color={r.status === "Settled" ? theme.custom.income : theme.colors.primary} />
					<View style={rowStyles.progressLabels}>
						<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
							{`${formatAmount(collected, r.currency)} of ${formatAmount(r.principal, r.currency)} collected`}
						</Text>
						{due ? (
							<Text variant="labelSmall" style={{ color: overdue ? theme.custom.expense : theme.colors.onSurfaceVariant }}>
								{due}
							</Text>
						) : null}
					</View>
				</View>
			) : awaitingFunds || due ? (
				<Text
					variant="bodySmall"
					style={[rowStyles.note, { color: overdue ? theme.custom.expense : theme.colors.onSurfaceVariant }]}
				>
					{[awaitingFunds ? "Waiting for the lending transfer" : null, due].filter(Boolean).join(" · ")}
				</Text>
			) : null}
		</Pressable>
	);
};

const rowStyles = StyleSheet.create({
	row: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
	top: {
		flexDirection: "row",
		alignItems: "center",
	},
	body: {
		flex: 1,
		marginHorizontal: spacing.md,
	},
	right: {
		alignItems: "flex-end",
		flexShrink: 0,
	},
	progress: {
		marginTop: spacing.md,
		marginLeft: 52,
	},
	progressLabels: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 6,
		gap: spacing.sm,
	},
	note: {
		marginTop: spacing.sm,
		marginLeft: 52,
	},
});
