import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
	ActivityIndicator,
	Text,
	useTheme,
	IconButton,
	ProgressBar,
	Snackbar,
	Divider,
	Button,
	Dialog,
	Portal,
} from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AppCard from "../components/AppCard";
import TransactionListItem from "../components/TransactionListItem";
import ReceivableFormDialog from "../components/ReceivableFormDialog";
import { useGetReceivables } from "../hooks/receivable/useGetReceivables";
import { useUpdateReceivable } from "../hooks/receivable/useUpdateReceivable";
import { useWriteOffReceivable } from "../hooks/receivable/useWriteOffReceivable";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { formatAmount } from "../utils/currency";
import { RootStackParamList, Transaction } from "../types";

type ReceivableDetailRouteProp = RouteProp<
	RootStackParamList,
	"ReceivableDetail"
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ReceivableDetailScreen = () => {
	const theme = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<ReceivableDetailRouteProp>();
	const { receivableId } = route.params;

	const {
		receivables,
		loading: loadingReceivables,
		refresh: refreshReceivables,
	} = useGetReceivables();
	const { updateReceivable } = useUpdateReceivable();
	const { writeOffReceivable } = useWriteOffReceivable();
	const { entities } = useGetEntities();
	const transactionFilter = useMemo(() => ({ receivableId }), [receivableId]);
	const { transactions, loading: loadingTransactions } =
		useGetTransactions(transactionFilter);
	const { accounts } = useGetAccounts();
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();

	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [writeOffDialogVisible, setWriteOffDialogVisible] = useState(false);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const receivable = useMemo(
		() => receivables.find((r) => r.id === receivableId) ?? null,
		[receivables, receivableId],
	);

	const entityName = useMemo(() => {
		if (!receivable) return "";
		return (
			entities.find((e) => e.id === receivable.entity_id)?.name ?? "Unknown"
		);
	}, [receivable, entities]);

	const getAccountName = (accountId: number | null | undefined) =>
		accounts.find((a) => a.id === accountId)?.name ?? "";

	const getAccountCurrency = (accountId: number | null | undefined) =>
		accounts.find((a) => a.id === accountId)?.currency ?? "USD";

	const getCategoryName = (categoryId: number) =>
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
		].filter(Boolean).length;

	const paymentInfo = useMemo(() => {
		if (!receivable) return { collected: 0, percentage: 0, isPendingOutflow: false };
		// Pending outflow receivables haven't been activated yet — show no progress
		if (receivable.status === "Pending" && receivable.requires_outflow) {
			return { collected: 0, percentage: 0, isPendingOutflow: true };
		}
		const collected = receivable.principal - receivable.current_balance;
		const percentage =
			receivable.principal > 0 ? collected / receivable.principal : 0;
		return { collected, percentage: Math.min(percentage, 1), isPendingOutflow: false };
	}, [receivable]);

	const handleEditSubmit = async (data: any) => {
		try {
			await updateReceivable(receivableId, data);
			setSnackbar({ visible: true, message: "Receivable updated" });
			setEditDialogVisible(false);
			refreshReceivables();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating receivable",
			});
		}
	};

	const handleWriteOff = async () => {
		try {
			await writeOffReceivable(receivableId);
			setSnackbar({ visible: true, message: "Receivable written off" });
			setWriteOffDialogVisible(false);
			refreshReceivables();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error writing off receivable",
			});
		}
	};

	const isLoading = loadingReceivables || loadingTransactions;

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
					Loading receivable details...
				</Text>
			</View>
		);
	}

	if (!receivable) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					Receivable not found.
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
				{/* Summary Card */}
				<AppCard
					title={receivable.title}
					subtitle={`${entityName} · ${receivable.type}`}
				>
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Currency
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{receivable.currency}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Principal
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(receivable.principal, receivable.currency)}
							</Text>
						</View>
					</View>
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Remaining
							</Text>
							<Text
								variant="titleSmall"
								style={{
									fontWeight: "bold",
									color:
										receivable.current_balance > 0
											? theme.colors.secondary
											: theme.colors.primary,
								}}
							>
								{formatAmount(receivable.current_balance, receivable.currency)}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Collected
							</Text>
							<Text
								variant="titleSmall"
								style={{ fontWeight: "bold", color: theme.colors.primary }}
							>
								{formatAmount(paymentInfo.collected, receivable.currency)}
							</Text>
						</View>
					</View>

					{receivable.interest_rate > 0 && (
						<View style={styles.row}>
							<View style={styles.detailItem}>
								<Text
									variant="bodySmall"
									style={{ color: theme.colors.onSurfaceVariant }}
								>
									Interest Rate
								</Text>
								<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
									{receivable.interest_rate}%
								</Text>
							</View>
							{receivable.due_date && (
								<View style={styles.detailItem}>
									<Text
										variant="bodySmall"
										style={{ color: theme.colors.onSurfaceVariant }}
									>
										Due Date
									</Text>
									<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
										{new Date(receivable.due_date).toLocaleDateString()}
									</Text>
								</View>
							)}
						</View>
					)}

					{!receivable.interest_rate && receivable.due_date && (
						<View style={styles.row}>
							<View style={styles.detailItem}>
								<Text
									variant="bodySmall"
									style={{ color: theme.colors.onSurfaceVariant }}
								>
									Due Date
								</Text>
								<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
									{new Date(receivable.due_date).toLocaleDateString()}
								</Text>
							</View>
						</View>
					)}

					{/* Progress Bar — hidden for Pending outflow receivables */}
					{paymentInfo.isPendingOutflow ? (
						<Text
							variant="bodySmall"
							style={{ color: theme.colors.outline, marginBottom: 12 }}
						>
							⚠ Awaiting lending transfer to activate this receivable.
						</Text>
					) : (
						<View style={styles.progressSection}>
							<View style={styles.progressHeader}>
								<Text
									variant="bodySmall"
									style={{ color: theme.colors.onSurfaceVariant }}
								>
									Collection Progress
								</Text>
								<Text
									variant="bodySmall"
									style={{ color: theme.colors.primary, fontWeight: "bold" }}
								>
									{(paymentInfo.percentage * 100).toFixed(1)}%
								</Text>
							</View>
							<ProgressBar
								progress={paymentInfo.percentage}
								color={theme.colors.primary}
								style={styles.progressBar}
							/>
						</View>
					)}

					<View
						style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}
					>
						<Text
							variant="bodySmall"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							Status:{" "}
						</Text>
						<Text
							variant="bodySmall"
							style={{
								fontWeight: "bold",
								color:
									receivable.status === "Pending"
										? theme.colors.outline
										: receivable.status === "Active"
											? theme.colors.secondary
											: receivable.status === "Settled"
												? theme.colors.primary
												: theme.colors.error,
							}}
						>
							{receivable.status}
							{receivable.status === "Pending" &&
								" — awaiting lending transfer"}
						</Text>
					</View>

					{receivable.notes ? (
						<>
							<Divider style={styles.divider} />
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Notes
							</Text>
							<Text variant="bodyMedium" style={{ marginTop: 4 }}>
								{receivable.notes}
							</Text>
						</>
					) : null}
					<Divider style={styles.divider} />
					<Text
						variant="bodySmall"
						style={{ color: theme.colors.onSurfaceVariant }}
					>
						Created: {new Date(receivable.created_at).toLocaleDateString()}
					</Text>
				</AppCard>

				{/* Action Buttons — hidden for finalized receivables */}
				{receivable.status !== "Settled" && receivable.status !== "Written-Off" && (
					<View style={styles.actionsRow}>
						<IconButton
							icon="pencil"
							mode="contained"
							onPress={() => setEditDialogVisible(true)}
							iconColor={theme.colors.primary}
							containerColor={theme.colors.elevation.level3}
						/>
						{(receivable.status === "Active" ||
							receivable.status === "Pending") && (
							<IconButton
								icon="close-circle"
								mode="contained"
								onPress={() => setWriteOffDialogVisible(true)}
								iconColor={theme.colors.error}
								containerColor={theme.colors.elevation.level3}
							/>
						)}
					</View>
				)}

				{/* Payment History */}
				<Text
					variant="titleMedium"
					style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
				>
					Payment History
				</Text>
				{transactions.length === 0 ? (
					<View style={styles.emptyState}>
						<Text
							variant="bodyLarge"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							No transactions recorded yet.
						</Text>
					</View>
				) : (
					transactions.map((transaction, index) => {
						const typeName = getTransactionTypeName(
							transaction.transaction_type_id,
						);
						const isTransfer = typeName === "Transfer";
						const accountName = isTransfer
							? `${getAccountName(transaction.from_account_id)} → ${getAccountName(transaction.to_account_id)}`
							: getAccountName(
									transaction.from_account_id || transaction.to_account_id,
								);

						return (
							<TransactionListItem
								key={transaction.id}
								transaction={transaction}
								accountName={accountName}
								accountCurrency={getAccountCurrency(
									transaction.from_account_id || transaction.to_account_id,
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

			<ReceivableFormDialog
				visible={editDialogVisible}
				onClose={() => setEditDialogVisible(false)}
				onSubmit={handleEditSubmit}
				entities={entities}
				initialReceivable={receivable}
			/>

			{/* Write-off Confirmation Dialog */}
			<Portal>
				<Dialog
					visible={writeOffDialogVisible}
					onDismiss={() => setWriteOffDialogVisible(false)}
				>
					<Dialog.Title>Write Off Receivable</Dialog.Title>
					<Dialog.Content>
						<Text variant="bodyMedium">
							Are you sure you want to write off this receivable? The remaining
							balance of{" "}
							{formatAmount(receivable.current_balance, receivable.currency)}{" "}
							will be lost and your net worth will decrease.
						</Text>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setWriteOffDialogVisible(false)}>
							Cancel
						</Button>
						<Button onPress={handleWriteOff} textColor={theme.colors.error}>
							Write Off
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

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
		marginBottom: 12,
	},
	detailItem: { flex: 1 },
	progressSection: { marginBottom: 12 },
	progressHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	progressBar: { height: 8, borderRadius: 4 },
	divider: { marginVertical: 12 },
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginBottom: 8,
		gap: 8,
	},
	sectionTitle: { fontWeight: "bold", marginBottom: 12 },
	emptyState: { paddingVertical: 32, alignItems: "center" },
});

export default ReceivableDetailScreen;
