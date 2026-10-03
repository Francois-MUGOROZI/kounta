import React, { useEffect, useLayoutEffect, useMemo, useState, useRef } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeroCard from "../components/ui/HeroCard";
import AmountText from "../components/ui/AmountText";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import IconBadge from "../components/ui/IconBadge";
import EmptyState from "../components/ui/EmptyState";
import ActionRow from "../components/ui/ActionRow";
import StatGrid from "../components/ui/StatGrid";
import Dropdown from "../components/ui/Dropdown";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import TransactionSectionList, { useDescribedTransactions } from "../components/TransactionSectionList";
import EntityFormSheet, { EntityFormValues } from "../components/EntityFormSheet";
import { EntityAvatar } from "../components/EntityAvatar";
import ReceivableFormSheet, { ReceivableFormValues } from "../components/ReceivableFormSheet";
import { ReceivableRow } from "../components/ReceivableRow";
import { useQuery } from "../hooks/useQuery";
import { useUpdateEntity } from "../hooks/entity/useUpdateEntity";
import { useEntityFinancialSummary } from "../hooks/entity/useEntityFinancialSummary";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { useGetReceivablesByEntityId } from "../hooks/receivable/useGetReceivablesByEntityId";
import { useCreateReceivable } from "../hooks/receivable/useCreateReceivable";
import { useUpdateReceivable } from "../hooks/receivable/useUpdateReceivable";
import { useGetLiabilities } from "../hooks/liability/useGetLiabilities";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import { EntityRepository } from "../repositories/EntityRepository";
import { Entity, Receivable, RootStackParamList } from "../types";
import { formatAmount } from "../utils/currency";
import { formatShortDate } from "../utils/date";
import { radius, spacing, useKTheme } from "../theme/theme";

type Route = RouteProp<RootStackParamList, "EntityDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const EMPTY_SUMMARY = { income: 0, expenses: 0, receivable: 0, liabilityPaid: 0, liabilityTotal: 0 };

const EntityDetailScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { entityId } = useRoute<Route>().params;
	const toast = useToast();
	const { openComposer } = useTransactionComposer();
	const { updateEntity } = useUpdateEntity();
	const { createReceivable } = useCreateReceivable();
	const { updateReceivable } = useUpdateReceivable();
	const { entities } = useGetEntities();
	const { receivables } = useGetReceivablesByEntityId(entityId);
	const { liabilities } = useGetLiabilities();
	const { summaries, error: summaryError } = useEntityFinancialSummary(entityId);
	const filter = useMemo(() => ({ entityId }), [entityId]);
	const { transactions, loading: loadingTx, refreshing, pullToRefresh } = useGetTransactions(filter);
	const described = useDescribedTransactions(transactions);

	const [editVisible, setEditVisible] = useState(false);
	const [receivableForm, setReceivableForm] = useState<{ visible: boolean; editing: Receivable | null }>({
		visible: false,
		editing: null,
	});
	const [currency, setCurrency] = useState<string | null>(null);
	const [currencySheet, setCurrencySheet] = useState(false);
	const currencyAnchor = useRef<View>(null);

	const {
		data: entity,
		loading,
		error,
		refresh,
	} = useQuery<Entity | null>((db) => EntityRepository.getById(db, entityId), [entityId], null, "Failed to load details");

	const entityLiabilities = useMemo(() => liabilities.filter((l) => l.entity_id === entityId), [liabilities, entityId]);

	// Every currency this entity has data in — drives the currency switcher.
	const currencies = useMemo(() => {
		const set = new Set<string>();
		receivables.forEach((r) => set.add(r.currency));
		entityLiabilities.forEach((l) => set.add(l.currency));
		described.forEach((row) => set.add(row.view.currency));
		Object.keys(summaries).forEach((c) => set.add(c));
		return Array.from(set);
	}, [receivables, entityLiabilities, described, summaries]);

	useEffect(() => {
		setCurrency((prev) => (prev && currencies.includes(prev) ? prev : currencies[0] ?? null));
	}, [currencies]);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: entity?.name ?? "Details",
			headerRight: () =>
				entity ? (
					<IconButton icon="pencil-outline" onPress={() => setEditVisible(true)} accessibilityLabel="Edit details" />
				) : null,
		});
	}, [navigation, entity]);

	if (loading) {
		return (
			<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
				<SkeletonList rows={6} />
			</View>
		);
	}

	if (!entity) {
		return (
			<View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon={error ? "cloud-alert" : "account-question-outline"}
					tone={error ? "error" : "default"}
					title={error ? "Couldn't load these details" : "Not found"}
					message={error ?? "This person or organisation may have been removed."}
					actionLabel={error ? "Try again" : undefined}
					onAction={error ? refresh : undefined}
				/>
			</View>
		);
	}

	const inCurrency = <T extends { currency: string }>(items: T[]) =>
		currency ? items.filter((i) => i.currency === currency) : items;
	const shownReceivables = inCurrency(receivables);
	const shownLiabilities = inCurrency(entityLiabilities);
	const shownRows = currency ? described.filter((r) => r.view.currency === currency) : described;
	const summary = currency ? summaries[currency] ?? EMPTY_SUMMARY : EMPTY_SUMMARY;
	const owedToThem = summary.liabilityTotal - summary.liabilityPaid;
	const net = summary.receivable - owedToThem;
	const cur = currency ?? "RWF";

	const handleEdit = async (values: EntityFormValues) => {
		await updateEntity(entity.id, values);
		setEditVisible(false);
		toast.success("Details updated");
	};

	const handleReceivable = async (values: ReceivableFormValues) => {
		const editing = receivableForm.editing;
		if (editing) {
			await updateReceivable(editing.id, values);
			toast.success("Receivable updated");
		} else {
			await createReceivable({
				...values,
				// The repository sets the starting balance and status from requires_outflow.
				current_balance: 0,
				status: "Pending",
				created_at: new Date().toISOString(),
			});
			toast.success("Receivable added");
		}
		setReceivableForm({ visible: false, editing: null });
	};

	const header = (
		<View>
			<HeroCard>
				<View style={styles.heroTop}>
					<EntityAvatar name={entity.name} individual={!!entity.is_individual} size={44} onHero />
					<View style={{ flex: 1, marginLeft: spacing.md }}>
						<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
							{entity.is_individual ? "Person" : "Organisation"}
						</Text>
						<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted }}>
							{net > 0 ? "Owes you, on balance" : net < 0 ? "You owe, on balance" : "All square"}
						</Text>
					</View>
					{currencies.length > 1 && currency ? (
						<Pressable
							ref={currencyAnchor}
							onPress={() => setCurrencySheet(true)}
							style={styles.currencyPill}
							accessibilityRole="button"
							accessibilityLabel={`Currency ${currency}. Change currency`}
							hitSlop={8}
						>
							<Text variant="labelMedium" style={{ color: theme.custom.onHero }}>
								{currency}
							</Text>
							<MaterialCommunityIcons name="chevron-down" size={16} color={theme.custom.onHero} />
						</Pressable>
					) : null}
				</View>
				<AmountText amount={Math.abs(net)} currency={cur} tone="onHero" variant="displaySmall" style={{ marginTop: spacing.md }} />
				<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.xs }}>
					Net position: what they owe you minus what you still owe them
				</Text>
			</HeroCard>

			<ActionRow
				actions={[
					{ label: "Expense", icon: "arrow-top-right", color: theme.custom.expense, background: theme.custom.expenseContainer, onPress: () => openComposer({ type: "Expense", entityId: entity.id }) },
					{ label: "Income", icon: "arrow-bottom-left", color: theme.custom.income, background: theme.custom.incomeContainer, onPress: () => openComposer({ type: "Income", entityId: entity.id }) },
					{ label: "Receivable", icon: "hand-coin-outline", color: theme.colors.onPrimaryContainer, background: theme.colors.primaryContainer, onPress: () => setReceivableForm({ visible: true, editing: null }) },
				]}
			/>

			{summaryError ? (
				<Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: spacing.md }}>
					{summaryError}
				</Text>
			) : null}
			<StatGrid
				items={[
					{ label: "Received from them", value: formatAmount(summary.income, cur), tone: "income" },
					{ label: "Paid to them", value: formatAmount(summary.expenses, cur) },
					{ label: "They owe you", value: formatAmount(summary.receivable, cur), tone: summary.receivable > 0 ? "income" : "default" },
					{
						label: "You owe them",
						value: formatAmount(owedToThem, cur),
						tone: owedToThem > 0 ? "expense" : "default",
						caption: summary.liabilityTotal > 0 ? `${formatAmount(summary.liabilityPaid, cur)} of ${formatAmount(summary.liabilityTotal, cur)} repaid` : undefined,
					},
				]}
			/>

			{entity.phone_number || entity.id_number || entity.metadata ? (
				<Card padded={false} style={{ marginTop: spacing.lg }}>
					{entity.phone_number ? (
						<ListItem
							title={entity.phone_number}
							subtitle="Phone · tap to call"
							left={<IconBadge icon="phone-outline" size={36} />}
							onPress={() => Linking.openURL(`tel:${entity.phone_number!.replace(/\s/g, "")}`).catch(() => toast.error("Couldn't open the dialler"))}
						/>
					) : null}
					{entity.id_number ? (
						<ListItem
							title={entity.id_number}
							subtitle={entity.is_individual ? "ID number" : "TIN / registration number"}
							left={<IconBadge icon="card-account-details-outline" size={36} />}
							style={entity.phone_number ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant } : undefined}
						/>
					) : null}
					{entity.metadata ? (
						<View
							style={[
								styles.notes,
								(entity.phone_number || entity.id_number) && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant },
							]}
						>
							<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
								Notes
							</Text>
							<Text variant="bodyMedium" selectable style={{ color: theme.colors.onSurface, marginTop: spacing.xs }}>
								{entity.metadata}
							</Text>
						</View>
					) : null}
				</Card>
			) : null}

			<Text variant="titleMedium" style={[styles.section, { color: theme.colors.onSurface }]}>
				Receivables
			</Text>
			{shownReceivables.length === 0 ? (
				<Card style={styles.emptyCard}>
					<Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
						{receivables.length === 0 ? `${entity.name} doesn't owe you anything.` : `No receivables in ${currency}.`}
					</Text>
				</Card>
			) : (
				<Card padded={false}>
					{shownReceivables.map((r, i) => (
						<ReceivableRow
							key={r.id}
							receivable={r}
							divider={i > 0}
							onPress={() => navigation.navigate("ReceivableDetail", { receivableId: r.id })}
							onLongPress={
								r.status === "Settled" || r.status === "Written-Off"
									? undefined
									: () => setReceivableForm({ visible: true, editing: r })
							}
						/>
					))}
				</Card>
			)}

			{shownLiabilities.length > 0 ? (
				<>
					<Text variant="titleMedium" style={[styles.section, { color: theme.colors.onSurface }]}>
						Debts you owe them
					</Text>
					<Card padded={false}>
						{shownLiabilities.map((l, i) => (
							<ListItem
								key={l.id}
								title={l.name}
								subtitle={l.current_balance > 0 ? `${formatAmount(l.total_amount - l.current_balance, l.currency)} of ${formatAmount(l.total_amount, l.currency)} repaid` : "Paid off"}
								left={<IconBadge icon="credit-card-clock-outline" color={theme.custom.expense} background={theme.custom.expenseContainer} />}
								right={<AmountText amount={l.current_balance} currency={l.currency} tone={l.current_balance > 0 ? "expense" : "muted"} />}
								chevron
								onPress={() => navigation.navigate("LiabilityDetail", { liabilityId: l.id })}
								style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }}
							/>
						))}
					</Card>
				</>
			) : null}
			<Text variant="bodySmall" style={[styles.created, { color: theme.colors.onSurfaceVariant }]}>
				{`Added ${formatShortDate(entity.created_at)}`}
			</Text>
		</View>
	);

	return (
		<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
			<TransactionSectionList
				rows={shownRows}
				header={header}
				sectionTitle="Transactions"
				refreshing={refreshing}
				onRefresh={pullToRefresh}
				empty={
					loadingTx ? (
						<SkeletonList rows={3} />
					) : (
						<EmptyState
							compact
							icon="receipt"
							title={transactions.length === 0 ? "No transactions yet" : `No transactions in ${currency}`}
							message={transactions.length === 0 ? `Link an expense or income to ${entity.name} and it'll show up here.` : undefined}
						/>
					)
				}
			/>

			<EntityFormSheet visible={editVisible} onDismiss={() => setEditVisible(false)} entity={entity} onSubmit={handleEdit} />
			<ReceivableFormSheet
				visible={receivableForm.visible}
				onDismiss={() => setReceivableForm((s) => ({ ...s, visible: false }))}
				entities={entities}
				receivable={receivableForm.editing}
				presetEntityId={entity.id}
				onSubmit={handleReceivable}
			/>
			<Dropdown
				visible={currencySheet}
				onDismiss={() => setCurrencySheet(false)}
				anchor={currencyAnchor}
				alignRight
				minWidth={180}
				options={currencies.map((c) => ({ value: c, label: c }))}
				selected={currency}
				onSelect={(c) => {
					if (c) setCurrency(c);
					setCurrencySheet(false);
				}}
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
	currencyPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		backgroundColor: "rgba(255,255,255,0.16)",
		paddingHorizontal: spacing.md,
		paddingVertical: 5,
		borderRadius: radius.pill,
	},
	notes: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
	section: {
		marginTop: spacing.xxl,
		marginBottom: spacing.sm,
	},
	emptyCard: {
		paddingVertical: spacing.lg,
	},
	created: {
		marginTop: spacing.md,
		marginLeft: spacing.xs,
	},
});

export default EntityDetailScreen;
