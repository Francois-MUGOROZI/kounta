import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, FlatList } from "react-native";
import {
	ActivityIndicator,
	Text,
	useTheme,
	IconButton,
	Snackbar,
} from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Transaction } from "../types";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetAccountTypes } from "../hooks/accountType/useGetAccountTypes";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { useUpdateAccount } from "../hooks/account/useUpdateAccount";
import AppCard from "../components/AppCard";
import AccountFormDialog from "../components/AccountFormDialog";
import TransactionListItem from "../components/TransactionListItem";
import { formatAmount } from "../utils/currency";

type AccountDetailRouteProp = RouteProp<RootStackParamList, "AccountDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AccountDetailScreen = () => {
	const theme = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<AccountDetailRouteProp>();
	const { accountId } = route.params;

	const {
		accounts,
		loading: loadingAccounts,
		error: errorAccounts,
		refresh: refreshAccounts,
	} = useGetAccounts();
	const { accountTypes, loading: loadingTypes } = useGetAccountTypes();
	const transactionFilter = useMemo(() => ({ accountId }), [accountId]);
	const { transactions, loading: loadingTransactions } =
		useGetTransactions(transactionFilter);
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();
	const { updateAccount } = useUpdateAccount();

	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const account = useMemo(() => {
		return accounts.find((a) => a.id === accountId) ?? null;
	}, [accounts, accountId]);

	const typeName = useMemo(() => {
		if (!account) return "";
		return (
			accountTypes.find((t) => t.id === account.account_type_id)?.name || ""
		);
	}, [account, accountTypes]);

	const getAccountName = (id: number) =>
		accounts.find((a) => a.id === id)?.name || "";

	const getAccountCurrency = (id: number) =>
		accounts.find((a) => a.id === id)?.currency || "USD";

	const getCategoryName = (id: number) =>
		categories.find((c) => c.id === id)?.name || "";

	const getTransactionTypeName = (id: number) =>
		transactionTypes.find((t) => t.id === id)?.name || "";

	const getAssociationCount = (t: Transaction) =>
		[t.asset_id, t.liability_id, t.envelope_id, t.bill_id].filter(Boolean)
			.length;

	const handleEditSubmit = async (data: {
		name: string;
		account_type_id: number;
		currency: string;
		opening_balance: number;
		account_number?: string;
	}) => {
		try {
			await updateAccount(accountId, data);
			setSnackbar({ visible: true, message: "Account updated" });
			setEditDialogVisible(false);
			refreshAccounts();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating account",
			});
		}
	};

	const isLoading = loadingAccounts || loadingTypes || loadingTransactions;

	if (isLoading) {
		return (
			<View
				style={[styles.centered, { backgroundColor: theme.colors.background }]}
			>
				<ActivityIndicator size="large" />
				<Text variant="bodyLarge" style={{ marginTop: 16 }}>
					Loading account...
				</Text>
			</View>
		);
	}

	if (errorAccounts || !account) {
		return (
			<View
				style={[styles.centered, { backgroundColor: theme.colors.background }]}
			>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					{errorAccounts || "Account not found."}
				</Text>
			</View>
		);
	}

	const balanceColor =
		account.current_balance >= 0 ? theme.colors.primary : theme.colors.error;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Summary Card */}
				<AppCard title={account.name} subtitle={typeName}>
					{account.account_number ? (
						<View style={styles.infoRow}>
							<Text
								variant="bodyMedium"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Account Number
							</Text>
							<Text
								variant="bodyMedium"
								style={{ color: theme.colors.onSurface }}
							>
								{account.account_number}
							</Text>
						</View>
					) : null}

					<View style={styles.infoRow}>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							Currency
						</Text>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurface }}
						>
							{account.currency}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							Opening Balance
						</Text>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurface }}
						>
							{formatAmount(account.opening_balance, account.currency)}
						</Text>
					</View>

					<View style={[styles.infoRow, styles.balanceRow]}>
						<Text
							variant="bodyMedium"
							style={{
								color: theme.colors.onSurfaceVariant,
								fontWeight: "600",
							}}
						>
							Current Balance
						</Text>
						<Text
							variant="titleMedium"
							style={{ color: balanceColor, fontWeight: "bold" }}
						>
							{formatAmount(account.current_balance, account.currency)}
						</Text>
					</View>
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
					style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
				>
					Transactions
				</Text>

				{transactions.length === 0 ? (
					<View style={styles.emptyState}>
						<Text
							variant="bodyLarge"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							No transactions for this account.
						</Text>
					</View>
				) : (
					<FlatList
						data={transactions}
						keyExtractor={(item) => item.id.toString()}
						scrollEnabled={false}
						renderItem={({ item, index }) => {
							const txTypeName = getTransactionTypeName(
								item.transaction_type_id,
							);
							const isTransfer = txTypeName === "Transfer";
							const accountName = isTransfer
								? `${getAccountName(item.from_account_id as number)} → ${getAccountName(item.to_account_id as number)}`
								: getAccountName(
										(item.from_account_id || item.to_account_id) as number,
									);
							return (
								<TransactionListItem
									transaction={item}
									accountName={accountName}
									accountCurrency={getAccountCurrency(
										(item.from_account_id || item.to_account_id) as number,
									)}
									categoryName={getCategoryName(item.category_id)}
									transactionTypeName={txTypeName}
									associationCount={getAssociationCount(item)}
									onPress={() =>
										navigation.navigate("TransactionDetail", {
											transactionId: item.id,
										})
									}
									index={index}
								/>
							);
						}}
					/>
				)}
			</ScrollView>

			<AccountFormDialog
				visible={editDialogVisible}
				onClose={() => setEditDialogVisible(false)}
				onSubmit={handleEditSubmit}
				accountTypes={accountTypes}
				initialAccount={{
					id: account.id,
					name: account.name,
					account_number: account.account_number || undefined,
					account_type_id: account.account_type_id,
					currency: account.currency,
					opening_balance: account.opening_balance,
				}}
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
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginBottom: 8,
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 6,
	},
	balanceRow: {
		marginTop: 8,
		paddingTop: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "rgba(0,0,0,0.1)",
	},
	sectionHeader: {
		fontWeight: "600",
		marginTop: 8,
		marginBottom: 12,
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 32,
	},
});

export default AccountDetailScreen;
