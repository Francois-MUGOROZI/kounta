import React, { useLayoutEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeroCard from "../components/ui/HeroCard";
import AmountText from "../components/ui/AmountText";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import ActionRow, { RowAction } from "../components/ui/ActionRow";
import StatGrid, { Stat } from "../components/ui/StatGrid";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { useConfirm } from "../components/ui/Confirm";
import TransactionSectionList, { useDescribedTransactions } from "../components/TransactionSectionList";
import ReceivableFormSheet, { ReceivableFormValues } from "../components/ReceivableFormSheet";
import {
	ReceivableStatusPill,
	receivableCollected,
	receivableTypeIcon,
	receivableTypeLabel,
} from "../components/ReceivableRow";
import { EntityAvatar } from "../components/EntityAvatar";
import { useQuery } from "../hooks/useQuery";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useUpdateReceivable } from "../hooks/receivable/useUpdateReceivable";
import { useWriteOffReceivable } from "../hooks/receivable/useWriteOffReceivable";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import { ReceivableRepository } from "../repositories/ReceivableRepository";
import { Receivable, RootStackParamList } from "../types";
import { formatAmount } from "../utils/currency";
import { daysUntil, formatShortDate } from "../utils/date";
import { spacing, useKTheme } from "../theme/theme";
import IconBadge from "../components/ui/IconBadge";

type Route = RouteProp<RootStackParamList, "ReceivableDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const ReceivableDetailScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { receivableId } = useRoute<Route>().params;
	const toast = useToast();
	const confirm = useConfirm();
	const { openComposer } = useTransactionComposer();
	const { entities } = useGetEntities();
	const { updateReceivable } = useUpdateReceivable();
	const { writeOffReceivable } = useWriteOffReceivable();
	const [editVisible, setEditVisible] = useState(false);

	const {
		data: receivable,
		loading,
		error,
		refresh,
	} = useQuery<Receivable | null>(
		(db) => ReceivableRepository.getById(db, receivableId),
		[receivableId],
		null,
		"Failed to load receivable"
	);
	const filter = useMemo(() => ({ receivableId }), [receivableId]);
	const { transactions, loading: loadingTx, refreshing, pullToRefresh } = useGetTransactions(filter);
	const rows = useDescribedTransactions(transactions);

	// Settled and written-off receivables are final — no further edits.
	const isOpen = !!receivable && (receivable.status === "Active" || receivable.status === "Pending");

	useLayoutEffect(() => {
		navigation.setOptions({
			title: receivable?.title ?? "Receivable",
			headerRight: () =>
				isOpen ? (
					<IconButton icon="pencil-outline" onPress={() => setEditVisible(true)} accessibilityLabel="Edit receivable" />
				) : null,
		});
	}, [navigation, receivable, isOpen]);

	if (loading) {
		return (
			<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
				<SkeletonList rows={6} />
			</View>
		);
	}

	if (!receivable) {
		return (
			<View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon={error ? "cloud-alert" : "hand-coin-outline"}
					tone={error ? "error" : "default"}
					title={error ? "Couldn't load this receivable" : "Receivable not found"}
					message={error ?? "It may have been removed."}
					actionLabel={error ? "Try again" : undefined}
					onAction={error ? refresh : undefined}
				/>
			</View>
		);
	}

	const entity = entities.find((e) => e.id === receivable.entity_id);
	const awaitingFunds = receivable.status === "Pending" && !!receivable.requires_outflow;
	const collected = receivableCollected(receivable);
	const progress = receivable.principal > 0 ? Math.min(collected / receivable.principal, 1) : 0;
	const cur = receivable.currency;

	const handleEdit = async (values: ReceivableFormValues) => {
		await updateReceivable(receivable.id, values);
		setEditVisible(false);
		toast.success("Receivable updated");
	};

	const handleWriteOff = async () => {
		const ok = await confirm({
			title: "Write off this receivable?",
			message: `You'll stop expecting the remaining ${formatAmount(
				receivable.current_balance,
				cur
			)} and your net worth will drop by that amount. This can't be undone.`,
			confirmLabel: "Write off",
			destructive: true,
		});
		if (!ok) return;
		try {
			await writeOffReceivable(receivable.id);
			toast.success("Receivable written off");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Couldn't write off the receivable");
		}
	};

	const actions: RowAction[] = [];
	if (awaitingFunds) {
		actions.push({
			label: "Lend",
			icon: "cash-fast",
			color: theme.custom.transfer,
			background: theme.custom.transferContainer,
			onPress: () => openComposer({ type: "Transfer", transferDirection: "account-to-receivable", receivableId: receivable.id }),
		});
	}
	if (receivable.status === "Active") {
		actions.push({
			label: "Record repayment",
			icon: "cash-check",
			color: theme.custom.income,
			background: theme.custom.incomeContainer,
			onPress: () => openComposer({ type: "Transfer", transferDirection: "receivable-to-account", receivableId: receivable.id }),
		});
	}
	if (isOpen) {
		actions.push({
			label: "Write off",
			icon: "close-circle-outline",
			color: theme.custom.expense,
			background: theme.custom.expenseContainer,
			onPress: handleWriteOff,
		});
	}

	const dueDays = receivable.due_date ? daysUntil(receivable.due_date) : null;
	const stats: Stat[] = [
		{ label: "Principal", value: formatAmount(receivable.principal, cur) },
		{ label: "Collected", value: formatAmount(collected, cur), tone: collected > 0 ? "income" : "default" },
		{ label: "Interest rate", value: receivable.interest_rate > 0 ? `${receivable.interest_rate}%` : "None" },
		{
			label: "Due date",
			value: receivable.due_date ? formatShortDate(receivable.due_date) : "Not set",
			tone: isOpen && dueDays !== null && dueDays < 0 ? "expense" : "default",
			caption:
				isOpen && dueDays !== null
					? dueDays < 0
						? `${-dueDays} day${dueDays === -1 ? "" : "s"} overdue`
						: dueDays === 0
						? "Due today"
						: `In ${dueDays} day${dueDays === 1 ? "" : "s"}`
					: undefined,
		},
	];

	const statusNote =
		awaitingFunds
			? "Waiting for the lending transfer. Tap Lend to record the money leaving your account — the receivable becomes active at its full principal."
			: receivable.status === "Settled"
			? "Fully repaid. Nice."
			: receivable.status === "Written-Off"
			? `Written off with ${formatAmount(receivable.current_balance, cur)} still unpaid.`
			: null;

	const header = (
		<View>
			<HeroCard>
				<View style={styles.heroTop}>
					<IconBadge icon={receivableTypeIcon(receivable.type)} color={theme.custom.onHero} background="rgba(255,255,255,0.16)" />
					<View style={{ flex: 1, marginLeft: spacing.md }}>
						<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
							{receivableTypeLabel(receivable.type)}
						</Text>
						<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted }}>
							{awaitingFunds ? "To be lent" : "Still owed to you"}
						</Text>
					</View>
					<ReceivableStatusPill status={receivable.status} onHero />
				</View>
				<AmountText
					amount={awaitingFunds ? receivable.principal : receivable.current_balance}
					currency={cur}
					tone="onHero"
					variant="displaySmall"
					style={{ marginTop: spacing.md }}
				/>
				{!awaitingFunds ? (
					<View style={{ marginTop: spacing.md }}>
						<ProgressBar progress={progress} height={6} color={theme.custom.onHero} trackColor="rgba(255,255,255,0.2)" />
						<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: 6 }}>
							{`${Math.round(progress * 100)}% collected`}
						</Text>
					</View>
				) : null}
			</HeroCard>

			{actions.length > 0 ? <ActionRow actions={actions} /> : null}

			{statusNote ? (
				<View style={[styles.note, { backgroundColor: theme.colors.surfaceVariant }]}>
					<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
						{statusNote}
					</Text>
				</View>
			) : null}

			<StatGrid items={stats} />

			{entity ? (
				<Card padded={false} style={{ marginTop: spacing.lg }}>
					<ListItem
						title={entity.name}
						subtitle={entity.is_individual ? "Owes you · Person" : "Owes you · Organisation"}
						left={<EntityAvatar name={entity.name} individual={!!entity.is_individual} />}
						chevron
						onPress={() => navigation.navigate("EntityDetail", { entityId: entity.id })}
					/>
				</Card>
			) : null}

			{receivable.notes ? (
				<Card style={{ marginTop: spacing.lg }}>
					<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
						Notes
					</Text>
					<Text variant="bodyMedium" selectable style={{ color: theme.colors.onSurface, marginTop: spacing.xs }}>
						{receivable.notes}
					</Text>
				</Card>
			) : null}
			<Text variant="bodySmall" style={[styles.created, { color: theme.colors.onSurfaceVariant }]}>
				{`Added ${formatShortDate(receivable.created_at)}`}
			</Text>
		</View>
	);

	return (
		<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
			<TransactionSectionList
				rows={rows}
				header={header}
				sectionTitle="Payment history"
				refreshing={refreshing}
				onRefresh={pullToRefresh}
				empty={
					loadingTx ? (
						<SkeletonList rows={3} />
					) : (
						<EmptyState
							compact
							icon="receipt"
							title="No payments yet"
							message={
								awaitingFunds
									? "The lending transfer and repayments will show up here."
									: "Repayments you record will show up here."
							}
						/>
					)
				}
			/>
			<ReceivableFormSheet
				visible={editVisible}
				onDismiss={() => setEditVisible(false)}
				entities={entities}
				receivable={receivable}
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
	note: {
		marginTop: spacing.lg,
		padding: spacing.md,
		borderRadius: 12,
	},
	created: {
		marginTop: spacing.md,
		marginLeft: spacing.xs,
	},
});

export default ReceivableDetailScreen;
