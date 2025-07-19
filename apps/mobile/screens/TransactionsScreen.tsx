import React, { useState, useMemo } from "react";
import { View, StyleSheet, Alert, FlatList } from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
	Surface,
	Divider,
} from "react-native-paper";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useCreateTransaction } from "../hooks/transaction/useCreateTransaction";
import { useUpdateTransaction } from "../hooks/transaction/useUpdateTransaction";
import { useDeleteTransaction } from "../hooks/transaction/useDeleteTransaction";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetAssets } from "../hooks/asset/useGetAssets";
import { useGetLiabilities } from "../hooks/liability/useGetLiabilities";
import TransactionListItem from "../components/TransactionListItem";
import TransactionFormDialog from "../components/TransactionFormDialog";
import { Transaction } from "../types";
import { formatAmount } from "../utils/currency";

const TransactionsScreen = () => {
	const theme = useTheme();
	const { transactions, loading, error, refresh } = useGetTransactions();
	const {
		createTransaction,
		loading: creating,
		error: createError,
	} = useCreateTransaction();
	const {
		updateTransaction,
		loading: updating,
		error: updateError,
	} = useUpdateTransaction();
	const {
		deleteTransaction,
		loading: deleting,
		error: deleteError,
	} = useDeleteTransaction();
	const {
		transactionTypes,
		loading: loadingTypes,
		error: errorTypes,
	} = useGetTransactionTypes();
	const {
		accounts,
		loading: loadingAccounts,
		error: errorAccounts,
	} = useGetAccounts();
	const {
		categories,
		loading: loadingCategories,
		error: errorCategories,
	} = useGetCategories();
	const { assets, loading: loadingAssets, error: errorAssets } = useGetAssets();
	const {
		liabilities,
		loading: loadingLiabilities,
		error: errorLiabilities,
	} = useGetLiabilities();
	const [modalVisible, setModalVisible] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const openAddModal = () => {
		setEditingTransaction(null);
		setModalVisible(true);
	};

	const openEditModal = (transaction: Transaction) => {
		setEditingTransaction(transaction);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setEditingTransaction(null);
	};

	const handleSubmit = async (data: {
		description: string;
		amount: number;
		transaction_type_id: number;
		account_id: number;
		category_id: number;
		date: string;
		asset_id?: number | null;
		liability_id?: number | null;
	}) => {
		try {
			if (editingTransaction) {
				await updateTransaction(editingTransaction.id, data);
				setSnackbar({ visible: true, message: "Transaction updated" });
			} else {
				await createTransaction(data);
				setSnackbar({ visible: true, message: "Transaction created" });
			}
			closeModal();
			refresh();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving transaction",
			});
		}
	};

	const handleDelete = (transaction: Transaction) => {
		Alert.alert(
			"Delete Transaction",
			`Are you sure you want to delete "${transaction.description}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await deleteTransaction(transaction.id);
							setSnackbar({ visible: true, message: "Transaction deleted" });
							refresh();
						} catch (e: any) {
							setSnackbar({
								visible: true,
								message: e.message || "Error deleting transaction",
							});
						}
					},
				},
			]
		);
	};

	const getAccountName = (accountId: number) => {
		return accounts.find((a) => a.id === accountId)?.name || "";
	};

	const getAccountCurrency = (accountId: number) => {
		return accounts.find((a) => a.id === accountId)?.currency || "USD";
	};

	const getCategoryName = (categoryId: number) => {
		return categories.find((c) => c.id === categoryId)?.name || "";
	};

	const getTransactionTypeName = (typeId: number) => {
		return transactionTypes.find((t) => t.id === typeId)?.name || "";
	};

	// Group transactions by currency and calculate totals
	const currencyGroups = useMemo(() => {
		const groups: {
			[currency: string]: {
				transactions: Transaction[];
				totals: { income: number; expenses: number; net: number };
			};
		} = {};

		transactions.forEach((transaction) => {
			const account = accounts.find((a) => a.id === transaction.account_id);
			const currency = account?.currency || "USD";
			const typeName = getTransactionTypeName(transaction.transaction_type_id);
			const isIncome = typeName === "Income";

			if (!groups[currency]) {
				groups[currency] = {
					transactions: [],
					totals: { income: 0, expenses: 0, net: 0 },
				};
			}

			groups[currency].transactions.push(transaction);

			if (isIncome) {
				groups[currency].totals.income += transaction.amount;
			} else {
				groups[currency].totals.expenses += transaction.amount;
			}
		});

		// Calculate net for each currency
		Object.keys(groups).forEach((currency) => {
			groups[currency].totals.net =
				groups[currency].totals.income - groups[currency].totals.expenses;
		});

		return groups;
	}, [transactions, accounts, transactionTypes]);

	const renderCurrencySummary = (
		currency: string,
		totals: { income: number; expenses: number; net: number }
	) => (
		<Surface key={currency} style={styles.currencySummary}>
			<Text variant="titleMedium" style={styles.currencyLabel}>
				{currency} Summary
			</Text>
			<View style={styles.totalsRow}>
				<View style={styles.totalItem}>
					<Text variant="bodySmall" style={{ color: theme.colors.primary }}>
						Income
					</Text>
					<Text variant="titleMedium" style={{ color: theme.colors.primary }}>
						+{formatAmount(totals.income, currency)}
					</Text>
				</View>
				<View style={styles.totalItem}>
					<Text variant="bodySmall" style={{ color: theme.colors.error }}>
						Expenses
					</Text>
					<Text variant="titleMedium" style={{ color: theme.colors.error }}>
						-{formatAmount(totals.expenses, currency)}
					</Text>
				</View>
				<View style={styles.totalItem}>
					<Text
						variant="bodySmall"
						style={{ color: theme.colors.onSurfaceVariant }}
					>
						Net
					</Text>
					<Text
						variant="titleMedium"
						style={{
							color:
								totals.net >= 0 ? theme.colors.primary : theme.colors.error,
						}}
					>
						{totals.net >= 0 ? "+" : ""}
						{formatAmount(totals.net, currency)}
					</Text>
				</View>
			</View>
		</Surface>
	);

	const renderTransactionSection = (
		currency: string,
		data: {
			transactions: Transaction[];
			totals: { income: number; expenses: number; net: number };
		}
	) => (
		<View key={currency}>
			{renderCurrencySummary(currency, data.totals)}
			<FlatList
				data={data.transactions}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<TransactionListItem
						transaction={item}
						accountName={getAccountName(item.account_id)}
						accountCurrency={getAccountCurrency(item.account_id)}
						categoryName={getCategoryName(item.category_id)}
						transactionTypeName={getTransactionTypeName(
							item.transaction_type_id
						)}
						onEdit={() => openEditModal(item)}
						onDelete={() => handleDelete(item)}
					/>
				)}
				ItemSeparatorComponent={() => <Divider />}
				scrollEnabled={false}
			/>
		</View>
	);

	const anyLoading =
		loading ||
		creating ||
		updating ||
		deleting ||
		loadingTypes ||
		loadingAccounts ||
		loadingCategories ||
		loadingAssets ||
		loadingLiabilities;
	const anyError =
		error ||
		createError ||
		updateError ||
		deleteError ||
		errorTypes ||
		errorAccounts ||
		errorCategories ||
		errorAssets ||
		errorLiabilities;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			{anyLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text variant="bodyLarge" style={{ marginTop: 16 }}>
						Loading transactions...
					</Text>
				</View>
			) : anyError ? (
				<View style={styles.centered}>
					<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
						{anyError}
					</Text>
				</View>
			) : Object.keys(currencyGroups).length === 0 ? (
				<View style={styles.centered}>
					<Text
						variant="bodyLarge"
						style={{ color: theme.colors.onSurfaceVariant }}
					>
						No transactions yet.
					</Text>
				</View>
			) : (
				<FlatList
					data={Object.entries(currencyGroups)}
					keyExtractor={([currency]) => currency}
					renderItem={({ item: [currency, data] }) =>
						renderTransactionSection(currency, data)
					}
					ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
				/>
			)}
			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				color={theme.colors.onPrimary}
				onPress={openAddModal}
				accessibilityLabel="Add Transaction"
			/>
			<TransactionFormDialog
				visible={modalVisible}
				onClose={closeModal}
				onSubmit={handleSubmit}
				transactionTypes={transactionTypes}
				accounts={accounts}
				categories={categories}
				assets={assets}
				liabilities={liabilities}
				initialTransaction={editingTransaction}
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
		padding: 16,
	},
	fab: {
		position: "absolute",
		right: 16,
		bottom: 24,
	},
	currencySummary: {
		padding: 16,
		marginBottom: 16,
		borderRadius: 8,
		elevation: 2,
	},
	currencyLabel: {
		marginBottom: 12,
		textAlign: "center",
		fontWeight: "bold",
	},
	totalsRow: {
		flexDirection: "row",
		justifyContent: "space-around",
	},
	totalItem: {
		alignItems: "center",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});

export default TransactionsScreen;
