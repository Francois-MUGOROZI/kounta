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
} from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AppCard from "../components/AppCard";
import TransactionListItem from "../components/TransactionListItem";
import EnvelopeFormDialog from "../components/EnvelopeFormDialog";
import AddToEnvelopeDialog from "../components/AddToEnvelopeDialog";
import { useGetEnvelopes } from "../hooks/envelope/useGetEnvelope";
import { useUpdateEnvelope } from "../hooks/envelope/useUpdateEnvelope";
import { useAddToEnvelope } from "../hooks/envelope/useAddToEnvelope";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { formatAmount } from "../utils/currency";
import { RootStackParamList, Envelope, Transaction } from "../types";

type EnvelopeDetailRouteProp = RouteProp<RootStackParamList, "EnvelopeDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EnvelopeDetailScreen = () => {
	const theme = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<EnvelopeDetailRouteProp>();
	const { envelopeId } = route.params;

	const {
		envelopes,
		loading: loadingEnvelopes,
		refresh: refreshEnvelopes,
	} = useGetEnvelopes();
	const { updateEnvelope } = useUpdateEnvelope();
	const { addToEnvelope } = useAddToEnvelope();
	const transactionFilter = useMemo(() => ({ envelopeId }), [envelopeId]);
	const { transactions, loading: loadingTransactions } =
		useGetTransactions(transactionFilter);
	const { accounts } = useGetAccounts();
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();

	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [addFundsVisible, setAddFundsVisible] = useState(false);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const envelope = useMemo(
		() => envelopes.find((e) => e.id === envelopeId) ?? null,
		[envelopes, envelopeId],
	);

	const getAccountName = (accountId: number | null | undefined) =>
		accounts.find((a) => a.id === accountId)?.name ?? "";

	const getAccountCurrency = (accountId: number | null | undefined) =>
		accounts.find((a) => a.id === accountId)?.currency ?? "USD";

	const getCategoryName = (categoryId: number) =>
		categories.find((c) => c.id === categoryId)?.name ?? "";

	const getTransactionTypeName = (typeId: number) =>
		transactionTypes.find((t) => t.id === typeId)?.name ?? "";

	const getAssociationCount = (t: Transaction) =>
		[t.asset_id, t.liability_id, t.envelope_id, t.bill_id].filter(Boolean)
			.length;

	const usageInfo = useMemo(() => {
		if (!envelope) return { spent: 0, percentage: 0, isOverspent: false };
		const spent = envelope.total_amount - envelope.current_balance;
		const percentage =
			envelope.total_amount > 0 ? spent / envelope.total_amount : 0;
		return {
			spent,
			percentage,
			isOverspent: percentage > 1,
		};
	}, [envelope]);

	const handleEditSubmit = async (data: Envelope) => {
		try {
			await updateEnvelope(envelopeId, data);
			setSnackbar({ visible: true, message: "Envelope updated" });
			setEditDialogVisible(false);
			refreshEnvelopes();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating envelope",
			});
		}
	};

	const handleAddFunds = async (envId: number, amount: number) => {
		try {
			await addToEnvelope(envId, amount);
			setSnackbar({ visible: true, message: "Funds added to envelope" });
			setAddFundsVisible(false);
			refreshEnvelopes();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error adding funds",
			});
		}
	};

	const isLoading = loadingEnvelopes || loadingTransactions;

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
					Loading envelope details...
				</Text>
			</View>
		);
	}

	if (!envelope) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					Envelope not found.
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
				<AppCard title={envelope.name} subtitle={envelope.purpose || ""}>
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Currency
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{envelope.currency}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Total Budget
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(envelope.total_amount, envelope.currency)}
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
										envelope.current_balance > 0
											? theme.colors.primary
											: theme.colors.error,
								}}
							>
								{formatAmount(envelope.current_balance, envelope.currency)}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Spent
							</Text>
							<Text
								variant="titleSmall"
								style={{
									fontWeight: "bold",
									color: theme.colors.error,
								}}
							>
								{formatAmount(usageInfo.spent, envelope.currency)}
							</Text>
						</View>
					</View>

					{/* Progress Bar */}
					<View style={styles.progressSection}>
						<View style={styles.progressHeader}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								{usageInfo.isOverspent ? "Overspent" : "Budget Usage"}
							</Text>
							<Text
								variant="bodySmall"
								style={{
									color: usageInfo.isOverspent
										? theme.colors.error
										: theme.colors.primary,
									fontWeight: "bold",
								}}
							>
								{(usageInfo.percentage * 100).toFixed(1)}%
							</Text>
						</View>
						<ProgressBar
							progress={Math.min(usageInfo.percentage, 1)}
							color={
								usageInfo.percentage > 0.9
									? theme.colors.error
									: theme.colors.primary
							}
							style={styles.progressBar}
						/>
					</View>

				</AppCard>

				{/* Action Buttons */}
				<View style={styles.actionsRow}>
					<IconButton
						icon="plus-circle"
						mode="contained"
						onPress={() => setAddFundsVisible(true)}
						iconColor={theme.colors.primary}
						containerColor={theme.colors.elevation.level3}
					/>
					<IconButton
						icon="pencil"
						mode="contained"
						onPress={() => setEditDialogVisible(true)}
						iconColor={theme.colors.primary}
						containerColor={theme.colors.elevation.level3}
					/>
				</View>

				{/* Spending Transactions Section */}
				<Text
					variant="titleMedium"
					style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
				>
					Spending Transactions
				</Text>
				{transactions.length === 0 ? (
					<View style={styles.emptyState}>
						<Text
							variant="bodyLarge"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							No spending transactions yet.
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

			<EnvelopeFormDialog
				visible={editDialogVisible}
				onClose={() => setEditDialogVisible(false)}
				onSubmit={handleEditSubmit}
				initialEnvelope={envelope}
			/>

			{envelope && (
				<AddToEnvelopeDialog
					visible={addFundsVisible}
					onClose={() => setAddFundsVisible(false)}
					onSubmit={handleAddFunds}
					envelope={envelope}
				/>
			)}

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
	container: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 32,
	},
	centered: {
		justifyContent: "center",
		alignItems: "center",
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	detailItem: {
		flex: 1,
	},
	progressSection: {
		marginBottom: 12,
	},
	progressHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	progressBar: {
		height: 8,
		borderRadius: 4,
	},
	divider: {
		marginVertical: 12,
	},
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 8,
		marginBottom: 8,
	},
	sectionTitle: {
		fontWeight: "bold",
		marginBottom: 12,
	},
	emptyState: {
		paddingVertical: 32,
		alignItems: "center",
	},
});

export default EnvelopeDetailScreen;
