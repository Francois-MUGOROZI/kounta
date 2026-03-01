import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
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
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetAssets } from "../hooks/asset/useGetAssets";
import { useGetLiabilities } from "../hooks/liability/useGetLiabilities";
import TransactionListItem from "../components/TransactionListItem";
import TransactionFormDialog from "../components/TransactionFormDialog";
import { TransactionFilter } from "../components/TransactionFilter";
import type {
	Transaction,
	TransactionFilter as FilterTransaction,
	RootStackParamList,
} from "../types";
import { formatAmount } from "../utils/currency";
import { useGetEnvelopes } from "@/hooks/envelope/useGetEnvelope";
import { useGetBills } from "../hooks/bill/useGetBills";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TransactionsScreen = () => {
	const navigation = useNavigation<NavigationProp>();
	const theme = useTheme();
	const getInitialMonthFilter = () => {
		const now = new Date();
		const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
			.toISOString()
			.split("T")[0];
		const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
			.toISOString()
			.split("T")[0];
		return {
			period: "month",
			startDate,
			endDate,
		};
	};
	const [filters, setFilters] = useState<FilterTransaction>(
		getInitialMonthFilter()
	);
	const { transactions, loading, error, refresh } = useGetTransactions(filters);
	const {
		createTransaction,
		loading: creating,
		error: createError,
	} = useCreateTransaction();
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

	const {
		envelopes,
		loading: loadingEnvelopes,
		error: errorEnvelopes,
	} = useGetEnvelopes();

	const {
		bills,
		loading: loadingBills,
		error: errorBills,
	} = useGetBills(undefined, true);

	const [modalVisible, setModalVisible] = useState(false);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const openAddModal = () => {
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
	};

	const handleSubmit = async (data: Transaction) => {
		try {
			await createTransaction(data);
			setSnackbar({ visible: true, message: "Transaction created" });
			closeModal();
			refresh();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving transaction",
			});
		}
	};

	const getAccountName = (accountId: number | null | undefined) => {
		if (!accountId) return "";
		return accounts.find((a) => a.id === accountId)?.name || "";
	};

	const getAccountCurrency = (accountId: number | null | undefined) => {
		if (!accountId) return "";
		return accounts.find((a) => a.id === accountId)?.currency || "";
	};

	const getAssetName = (assetId: number | null | undefined) => {
		if (!assetId) return "";
		return assets.find((a) => a.id === assetId)?.name || "";
	};

	const getAssetCurrency = (assetId: number | null | undefined) => {
		if (!assetId) return "";
		return assets.find((a) => a.id === assetId)?.currency || "";
	};

	const getCategoryName = (categoryId: number) => {
		return categories.find((c) => c.id === categoryId)?.name || "";
	};

	const getTransactionTypeName = (typeId: number) => {
		return transactionTypes.find((t) => t.id === typeId)?.name || "";
	};

	/** Build a display name for the source/destination of a transaction */
	const getTransactionLabel = (item: Transaction) => {
		const typeName = getTransactionTypeName(item.transaction_type_id);
		if (typeName === "Transfer") {
			const from = item.from_account_id
				? getAccountName(item.from_account_id)
				: item.asset_id
				? getAssetName(item.asset_id)
				: "";
			const to = item.to_account_id
				? getAccountName(item.to_account_id)
				: item.asset_id
				? getAssetName(item.asset_id)
				: "";
			// Reinvest: both sides are the asset
			if (from === to && from !== "") return from;
			return `${from} → ${to}`;
		}
		return getAccountName(item.from_account_id || item.to_account_id);
	};

	/** Resolve currency: prefer account, fall back to asset */
	const getTransactionCurrency = (item: Transaction) => {
		const acctCurrency = getAccountCurrency(
			item.from_account_id || item.to_account_id
		);
		if (acctCurrency) return acctCurrency;
		return getAssetCurrency(item.asset_id) || "RWF";
	};

	const getAssociationCount = (t: Transaction) =>
		[t.asset_id, t.liability_id, t.envelope_id, t.bill_id].filter(Boolean)
			.length;

	// Group transactions by currency and calculate totals
	const currencyGroups = useMemo(() => {
		const groups: {
			[currency: string]: {
				transactions: Transaction[];
				totals: {
					income: number;
					expenses: number;
					net: number;
				};
			};
		} = {};

		transactions.forEach((transaction) => {
			const currency = getTransactionCurrency(transaction);
			const typeName = getTransactionTypeName(transaction.transaction_type_id);
			const isExpense = typeName === "Expense";
			const isIncome = typeName === "Income";

			if (!groups[currency]) {
				groups[currency] = {
					transactions: [],
					totals: { income: 0, expenses: 0, net: 0 },
				};
			}

			groups[currency].transactions.push(transaction);

			if (isExpense) {
				groups[currency].totals.expenses += transaction.amount;
			} else if (isIncome) {
				groups[currency].totals.income += transaction.amount;
			} else {
				// Transfer ignored
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
		<Surface key={currency} style={styles.currencySummary} elevation={1}>
			<Text variant="titleMedium" style={styles.currencyLabel}>
				{currency} Summary
			</Text>
			<View style={styles.totalsRow}>
				<View style={styles.totalItem}>
					<Text variant="bodySmall" style={{ color: theme.colors.primary }}>
						Income
					</Text>
					<Text variant="titleSmall" style={{ color: theme.colors.primary }}>
						+{formatAmount(totals.income, currency)}
					</Text>
				</View>
				<View style={styles.totalItem}>
					<Text variant="bodySmall" style={{ color: theme.colors.error }}>
						Expenses
					</Text>
					<Text variant="titleSmall" style={{ color: theme.colors.error }}>
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
						variant="titleSmall"
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
	) => {
		return (
			<View key={currency}>
				{renderCurrencySummary(currency, data.totals)}
				<FlatList
					data={data.transactions}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item, index }) => {
						return (
							<TransactionListItem
								transaction={item}
								accountName={getTransactionLabel(item)}
								accountCurrency={getTransactionCurrency(item)}
								categoryName={getCategoryName(item.category_id)}
								transactionTypeName={getTransactionTypeName(
									item.transaction_type_id
								)}
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
					scrollEnabled={false}
				/>
			</View>
		);
	};
	const anyLoading =
		loading ||
		creating ||
		loadingTypes ||
		loadingAccounts ||
		loadingCategories ||
		loadingAssets ||
		loadingLiabilities ||
		loadingEnvelopes ||
		loadingBills;
	const anyError =
		error ||
		createError ||
		errorTypes ||
		errorAccounts ||
		errorCategories ||
		errorAssets ||
		errorLiabilities ||
		errorEnvelopes ||
		errorBills;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<TransactionFilter
				transactionTypes={transactionTypes.map((t) => ({
					label: t.name,
					value: t.id,
				}))}
				categories={categories.map((c) => ({
					label: c.name,
					value: c.id,
					transaction_type_id: c.transaction_type_id,
				}))}
				onApply={setFilters}
				initialFilters={filters}
			/>
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
					contentContainerStyle={{ paddingBottom: 100 }}
					showsVerticalScrollIndicator={false}
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
				envelopes={envelopes}
				bills={bills as any}
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
		borderRadius: 16,
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
