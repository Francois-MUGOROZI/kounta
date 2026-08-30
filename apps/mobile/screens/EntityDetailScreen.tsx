import React, { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
	ActivityIndicator,
	Text,
	useTheme,
	IconButton,
	Snackbar,
	Divider,
	Menu,
	Button,
} from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AppCard from "../components/AppCard";
import ReceivableListItem from "../components/ReceivableListItem";
import TransactionListItem from "../components/TransactionListItem";
import EntityFormDialog from "../components/EntityFormDialog";
import ReceivableFormDialog from "../components/ReceivableFormDialog";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { useUpdateEntity } from "../hooks/entity/useUpdateEntity";
import { useEntityFinancialSummary } from "../hooks/entity/useEntityFinancialSummary";
import { useGetReceivablesByEntityId } from "../hooks/receivable/useGetReceivablesByEntityId";
import { useUpdateReceivable } from "../hooks/receivable/useUpdateReceivable";
import { useGetLiabilities } from "../hooks/liability/useGetLiabilities";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetAssets } from "../hooks/asset/useGetAssets";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { formatAmount } from "../utils/currency";
import {
	RootStackParamList,
	Receivable,
	ReceivableType,
	Transaction,
} from "../types";

type EntityDetailRouteProp = RouteProp<RootStackParamList, "EntityDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** Reusable label/value row for the Net Position card */
const SummaryRow: React.FC<{
	label: string;
	value: React.ReactNode;
	theme: { colors: { onSurfaceVariant: string } };
}> = ({ label, value, theme }) => (
	<View style={styles.summaryRow}>
		<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
			{label}
		</Text>
		<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
			{value}
		</Text>
	</View>
);

const EntityDetailScreen = () => {
	const theme = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<EntityDetailRouteProp>();
	const { entityId } = route.params;

	const {
		entities,
		loading: loadingEntities,
		refresh: refreshEntities,
	} = useGetEntities();
	const { updateEntity } = useUpdateEntity();
	const { receivables, loading: loadingReceivables } =
		useGetReceivablesByEntityId(entityId);
	const { updateReceivable } = useUpdateReceivable();
	const { liabilities, loading: loadingLiabilities } = useGetLiabilities();
	const transactionFilter = useMemo(() => ({ entityId }), [entityId]);
	const { transactions, loading: loadingTransactions } =
		useGetTransactions(transactionFilter);
	const { accounts } = useGetAccounts();
	const { assets } = useGetAssets();
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();
	const {
		summaries,
		loading: loadingSummary,
		error: summaryError,
	} = useEntityFinancialSummary(entityId);

	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });
	const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
	const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);

	const entity = useMemo(
		() => entities.find((e) => e.id === entityId) ?? null,
		[entities, entityId],
	);

	// Filter liabilities linked to this entity
	const entityLiabilities = useMemo(
		() => liabilities.filter((l) => l.entity_id === entityId),
		[liabilities, entityId],
	);

	const handleEditSubmit = async (data: {
		name: string;
		phone_number?: string;
		is_individual: boolean;
		id_number?: string;
		metadata?: string;
	}) => {
		try {
			await updateEntity(entityId, {
				...data,
				phone_number: data.phone_number ?? null,
				id_number: data.id_number ?? null,
				metadata: data.metadata ?? null,
			});
			setSnackbar({ visible: true, message: "Entity updated" });
			setEditDialogVisible(false);
			refreshEntities();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating entity",
			});
		}
	};

	const getAccountName = (accountId: number | null | undefined) =>
		accounts.find((a) => a.id === accountId)?.name ?? "";

	const getAccountCurrency = (accountId: number | null | undefined) =>
		accounts.find((a) => a.id === accountId)?.currency ?? "USD";

	/** Resolve a transaction's currency: prefer its account, fall back to its asset */
	const resolveTransactionCurrency = (t: Transaction) => {
		const accountId = t.from_account_id || t.to_account_id;
		const acctCurrency = accounts.find((a) => a.id === accountId)?.currency;
		if (acctCurrency) return acctCurrency;
		const assetCurrency = assets.find((a) => a.id === t.asset_id)?.currency;
		if (assetCurrency) return assetCurrency;
		return "RWF";
	};

	const getCategoryName = (categoryId: number | null) =>
		categories.find((c) => c.id === categoryId)?.name ?? "";

	const getTransactionTypeName = (typeId: number) =>
		transactionTypes.find((t) => t.id === typeId)?.name ?? "";

	const getAssociationCount = (t: Transaction) =>
		[
			t.asset_id,
			t.liability_id,
			t.envelope_id,
			t.bill_id,
			t.receivable_id,
			t.entity_id,
		].filter(Boolean).length;

	// Every currency this entity has any data in — drives the currency switcher.
	// Cheap: derived from the (already-fetched, already-rendered) lists, not a new query.
	const currencies = useMemo(() => {
		const set = new Set<string>();
		receivables.forEach((r) => set.add(r.currency));
		entityLiabilities.forEach((l) => set.add(l.currency));
		transactions.forEach((t) => set.add(resolveTransactionCurrency(t)));
		return Array.from(set);
	}, [receivables, entityLiabilities, transactions, accounts, assets]);

	useEffect(() => {
		setSelectedCurrency((prev) => {
			if (prev && currencies.includes(prev)) return prev;
			return currencies.length > 0 ? currencies[0] : null;
		});
	}, [currencies]);

	const filteredReceivables = useMemo(
		() =>
			selectedCurrency
				? receivables.filter((r) => r.currency === selectedCurrency)
				: receivables,
		[receivables, selectedCurrency],
	);

	const filteredLiabilities = useMemo(
		() =>
			selectedCurrency
				? entityLiabilities.filter((l) => l.currency === selectedCurrency)
				: entityLiabilities,
		[entityLiabilities, selectedCurrency],
	);

	const filteredTransactions = useMemo(
		() =>
			selectedCurrency
				? transactions.filter(
						(t) => resolveTransactionCurrency(t) === selectedCurrency
				  )
				: transactions,
		[transactions, selectedCurrency, accounts, assets],
	);

	const selectedSummary = selectedCurrency
		? summaries[selectedCurrency] ?? {
				income: 0,
				expenses: 0,
				receivable: 0,
				liabilityPaid: 0,
				liabilityTotal: 0,
		  }
		: null;
	const netPosition = selectedSummary
		? selectedSummary.receivable -
		  (selectedSummary.liabilityTotal - selectedSummary.liabilityPaid)
		: 0;

	const handleReceivableEdit = (receivable: Receivable) => {
		setEditingReceivable(receivable);
	};

	const handleReceivableSubmit = async (data: {
		entity_id: number;
		title: string;
		type: ReceivableType;
		currency: string;
		principal: number;
		interest_rate: number;
		requires_outflow: boolean;
		due_date?: string;
		notes?: string;
	}) => {
		try {
			if (editingReceivable) {
				await updateReceivable(editingReceivable.id, data);
				setSnackbar({ visible: true, message: "Receivable updated" });
				setEditingReceivable(null);
			}
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating receivable",
			});
		}
	};

	const isLoading =
		loadingEntities ||
		loadingReceivables ||
		loadingLiabilities ||
		loadingTransactions ||
		loadingSummary;

	if (isLoading) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<ActivityIndicator size="large" />
				<Text variant="bodyLarge" style={{ marginTop: 16 }}>
					Loading entity details...
				</Text>
			</View>
		);
	}

	if (!entity) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					Entity not found.
				</Text>
			</View>
		);
	}

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Entity Info Card */}
				<AppCard
					title={entity.name}
					subtitle={entity.is_individual ? "Individual" : "Organization"}
				>
					{entity.phone_number ? (
						<Text variant="bodyMedium" style={{ marginBottom: 8 }}>
							Phone: {entity.phone_number}
						</Text>
					) : null}
					{entity.id_number ? (
						<Text variant="bodyMedium" style={{ marginBottom: 8 }}>
							{entity.is_individual ? "ID" : "TIN/Reg"}: {entity.id_number}
						</Text>
					) : null}
					{entity.metadata ? (
						<Text
							variant="bodySmall"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							{entity.metadata}
						</Text>
					) : null}
					<Divider style={styles.divider} />
					<Text
						variant="bodySmall"
						style={{ color: theme.colors.onSurfaceVariant }}
					>
						Created: {new Date(entity.created_at).toLocaleDateString()}
					</Text>
				</AppCard>

				{/* Currency Switcher — filters the summary and every section below */}
				{currencies.length > 1 && selectedCurrency && (
					<View style={styles.currencyPickerRow}>
						<Menu
							visible={currencyMenuVisible}
							onDismiss={() => setCurrencyMenuVisible(false)}
							anchor={
								<Button
									mode="outlined"
									compact
									icon="chevron-down"
									contentStyle={{ flexDirection: "row-reverse", height: 32 }}
									style={{ height: 32, justifyContent: "center" }}
									labelStyle={{ marginVertical: 0, fontSize: 13 }}
									onPress={() => setCurrencyMenuVisible(true)}
								>
									{selectedCurrency}
								</Button>
							}
						>
							{currencies.map((c) => (
								<Menu.Item
									key={c}
									onPress={() => {
										setSelectedCurrency(c);
										setCurrencyMenuVisible(false);
									}}
									title={c}
									trailingIcon={selectedCurrency === c ? "check" : undefined}
								/>
							))}
						</Menu>
					</View>
				)}

				{/* Net Position Card */}
				{summaryError && (
					<Text
						variant="bodySmall"
						style={{ color: theme.colors.error, marginTop: 12 }}
					>
						{summaryError}
					</Text>
				)}
				{selectedCurrency && selectedSummary && (
					<AppCard title="Net Position" style={{ marginTop: 12 }}>
						<SummaryRow
							theme={theme}
							label="Income / Expenses"
							value={
								<Text>
									<Text style={{ color: theme.colors.primary }}>
										+{formatAmount(selectedSummary.income, selectedCurrency)}
									</Text>
									{"  /  "}
									<Text style={{ color: theme.colors.error }}>
										-{formatAmount(selectedSummary.expenses, selectedCurrency)}
									</Text>
								</Text>
							}
						/>
						<SummaryRow
							theme={theme}
							label="Liability Paid / Total"
							value={`${formatAmount(
								selectedSummary.liabilityPaid,
								selectedCurrency
							)} / ${formatAmount(
								selectedSummary.liabilityTotal,
								selectedCurrency
							)}`}
						/>
						<SummaryRow
							theme={theme}
							label="Receivable"
							value={
								<Text style={{ color: theme.colors.primary }}>
									{formatAmount(selectedSummary.receivable, selectedCurrency)}
								</Text>
							}
						/>
						<SummaryRow
							theme={theme}
							label="Net Position"
							value={
								<Text
									style={{
										color:
											netPosition >= 0
												? theme.colors.primary
												: theme.colors.error,
									}}
								>
									{formatAmount(netPosition, selectedCurrency)}
								</Text>
							}
						/>
					</AppCard>
				)}

				{/* Edit Button */}
				<View style={styles.actionsRow}>
					<IconButton
						icon="pencil"
						mode="contained"
						onPress={() => setEditDialogVisible(true)}
						iconColor={theme.colors.primary}
						containerColor={theme.colors.elevation.level3}
					/>
				</View>

				{/* Receivables Section */}
				<Text
					variant="titleMedium"
					style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
				>
					Receivables
				</Text>
				{filteredReceivables.length === 0 ? (
					<View style={styles.emptyState}>
						<Text
							variant="bodyLarge"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							{receivables.length === 0
								? "No receivables for this entity."
								: `No receivables in ${selectedCurrency}.`}
						</Text>
					</View>
				) : (
					filteredReceivables.map((receivable) => (
						<ReceivableListItem
							key={receivable.id}
							receivable={receivable}
							entityName={entity.name}
							onEdit={() => handleReceivableEdit(receivable)}
							onPress={() =>
								navigation.navigate("ReceivableDetail", {
									receivableId: receivable.id,
								})
							}
						/>
					))
				)}

				{/* Liabilities Section */}
				{filteredLiabilities.length > 0 && (
					<>
						<Text
							variant="titleMedium"
							style={[
								styles.sectionTitle,
								{ color: theme.colors.onSurface, marginTop: 16 },
							]}
						>
							Liabilities
						</Text>
						{filteredLiabilities.map((liability) => (
							<View
								key={liability.id}
								style={[
									styles.liabilityItem,
									{ backgroundColor: theme.colors.surface },
								]}
							>
								<Text variant="titleSmall" style={{ fontWeight: "600" }}>
									{liability.name}
								</Text>
								<Text variant="bodySmall" style={{ color: theme.colors.error }}>
									{formatAmount(liability.current_balance, liability.currency)}
								</Text>
							</View>
						))}
					</>
				)}

				{/* Transactions Section */}
				<Text
					variant="titleMedium"
					style={[
						styles.sectionTitle,
						{ color: theme.colors.onSurface, marginTop: 16 },
					]}
				>
					Transactions
				</Text>
				{filteredTransactions.length === 0 ? (
					<View style={styles.emptyState}>
						<Text
							variant="bodyLarge"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							{transactions.length === 0
								? "No transactions for this entity."
								: `No transactions in ${selectedCurrency}.`}
						</Text>
					</View>
				) : (
					filteredTransactions.map((transaction, index) => {
						const typeName = getTransactionTypeName(
							transaction.transaction_type_id
						);
						const isTransfer = typeName === "Transfer";
						const accountName = isTransfer
							? `${getAccountName(transaction.from_account_id)} → ${getAccountName(transaction.to_account_id)}`
							: getAccountName(
									transaction.from_account_id || transaction.to_account_id
							  );

						return (
							<TransactionListItem
								key={transaction.id}
								transaction={transaction}
								accountName={accountName}
								accountCurrency={getAccountCurrency(
									transaction.from_account_id || transaction.to_account_id
								)}
								categoryName={getCategoryName(transaction.category_id)}
								transactionTypeName={typeName}
								associationCount={getAssociationCount(transaction)}
								onPress={() =>
									navigation.navigate("TransactionDetail", {
										transactionId: transaction.id,
									})
								}
								index={index}
							/>
						);
					})
				)}
			</ScrollView>

			<EntityFormDialog
				visible={editDialogVisible}
				onClose={() => setEditDialogVisible(false)}
				onSubmit={handleEditSubmit}
				initialEntity={entity}
			/>

			<ReceivableFormDialog
				visible={!!editingReceivable}
				onClose={() => setEditingReceivable(null)}
				onSubmit={handleReceivableSubmit}
				entities={entities}
				initialReceivable={editingReceivable}
			/>

			<Snackbar
				visible={snackbar.visible}
				onDismiss={() => setSnackbar({ visible: false, message: "" })}
				duration={2000}
			>
				{snackbar.message}
			</Snackbar>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	scrollContent: { padding: 16, paddingBottom: 32 },
	centered: { justifyContent: "center", alignItems: "center" },
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	currencyPickerRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginTop: 12,
	},
	divider: { marginVertical: 12 },
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginBottom: 8,
	},
	sectionTitle: { fontWeight: "bold", marginBottom: 12 },
	emptyState: { paddingVertical: 32, alignItems: "center" },
	liabilityItem: {
		padding: 16,
		borderRadius: 8,
		marginBottom: 4,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
});

export default EntityDetailScreen;
