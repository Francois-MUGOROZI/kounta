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
import LiabilityFormDialog from "../components/LiabilityFormDialog";
import { useGetLiabilities } from "../hooks/liability/useGetLiabilities";
import { useUpdateLiability } from "../hooks/liability/useUpdateLiability";
import { useGetLiabilityTypes } from "../hooks/liabilityType/useGetLiabilityTypes";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { formatAmount } from "../utils/currency";
import { RootStackParamList, Transaction } from "../types";

type LiabilityDetailRouteProp = RouteProp<
	RootStackParamList,
	"LiabilityDetail"
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LiabilityDetailScreen = () => {
	const theme = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<LiabilityDetailRouteProp>();
	const { liabilityId } = route.params;

	const {
		liabilities,
		loading: loadingLiabilities,
		refresh: refreshLiabilities,
	} = useGetLiabilities();
	const { updateLiability } = useUpdateLiability();
	const { liabilityTypes, loading: loadingTypes } = useGetLiabilityTypes();
	const transactionFilter = useMemo(() => ({ liabilityId }), [liabilityId]);
	const { transactions, loading: loadingTransactions } =
		useGetTransactions(transactionFilter);
	const { accounts } = useGetAccounts();
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();

	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const liability = useMemo(
		() => liabilities.find((l) => l.id === liabilityId) ?? null,
		[liabilities, liabilityId],
	);

	const getTypeName = (typeId: number) =>
		liabilityTypes.find((t) => t.id === typeId)?.name ?? "";

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

	const paymentInfo = useMemo(() => {
		if (!liability) return { paid: 0, percentage: 0 };
		const paid = liability.total_amount - liability.current_balance;
		const percentage =
			liability.total_amount > 0 ? paid / liability.total_amount : 0;
		return { paid, percentage: Math.min(percentage, 1) };
	}, [liability]);

	const handleEditSubmit = async (data: {
		name: string;
		liability_type_id: number;
		currency: string;
		total_amount: number;
		current_balance: number;
		notes?: string;
	}) => {
		try {
			await updateLiability(liabilityId, data);
			setSnackbar({ visible: true, message: "Liability updated" });
			setEditDialogVisible(false);
			refreshLiabilities();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating liability",
			});
		}
	};

	const isLoading = loadingLiabilities || loadingTypes || loadingTransactions;

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
					Loading liability details...
				</Text>
			</View>
		);
	}

	if (!liability) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					Liability not found.
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
					title={liability.name}
					subtitle={getTypeName(liability.liability_type_id)}
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
								{liability.currency}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Total Amount
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(liability.total_amount, liability.currency)}
							</Text>
						</View>
					</View>
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Remaining Balance
							</Text>
							<Text
								variant="titleSmall"
								style={{ fontWeight: "bold", color: theme.colors.error }}
							>
								{formatAmount(liability.current_balance, liability.currency)}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Paid
							</Text>
							<Text
								variant="titleSmall"
								style={{
									fontWeight: "bold",
									color: theme.colors.primary,
								}}
							>
								{formatAmount(paymentInfo.paid, liability.currency)}
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
								Payment Progress
							</Text>
							<Text
								variant="bodySmall"
								style={{
									color: theme.colors.primary,
									fontWeight: "bold",
								}}
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

					{liability.notes ? (
						<>
							<Divider style={styles.divider} />
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Notes
							</Text>
							<Text variant="bodyMedium" style={{ marginTop: 4 }}>
								{liability.notes}
							</Text>
						</>
					) : null}
					<Divider style={styles.divider} />
					<Text
						variant="bodySmall"
						style={{ color: theme.colors.onSurfaceVariant }}
					>
						Created: {new Date(liability.created_at).toLocaleDateString()}
					</Text>
				</AppCard>

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

				{/* Transactions Section */}
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
							No payments recorded yet.
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

			<LiabilityFormDialog
				visible={editDialogVisible}
				onClose={() => setEditDialogVisible(false)}
				onSubmit={handleEditSubmit}
				liabilityTypes={liabilityTypes}
				initialLiability={liability}
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

export default LiabilityDetailScreen;
