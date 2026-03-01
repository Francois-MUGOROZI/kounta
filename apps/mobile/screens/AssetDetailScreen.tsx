import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
	ActivityIndicator,
	Text,
	useTheme,
	IconButton,
	Snackbar,
	Divider,
} from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AppCard from "../components/AppCard";
import TransactionListItem from "../components/TransactionListItem";
import AssetFormDialog from "../components/AssetFormDialog";
import AddToAssetDialog from "../components/AddToAssetDialog";
import { useGetAssets } from "../hooks/asset/useGetAssets";
import { useUpdateAsset } from "../hooks/asset/useUpdateAsset";
import { useUpdateValuation } from "../hooks/asset/useUpdateValuation";
import { useGetAssetTypes } from "../hooks/assetType/useGetAssetTypes";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { formatAmount } from "../utils/currency";
import { calcPercentChange, formatPercent } from "../utils/percent";
import { RootStackParamList, Transaction } from "../types";

type AssetDetailRouteProp = RouteProp<RootStackParamList, "AssetDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AssetDetailScreen = () => {
	const theme = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<AssetDetailRouteProp>();
	const { assetId } = route.params;

	const {
		assets,
		loading: loadingAssets,
		refresh: refreshAssets,
	} = useGetAssets();
	const { updateAsset } = useUpdateAsset();
	const { updateValuation } = useUpdateValuation();
	const { assetTypes, loading: loadingTypes } = useGetAssetTypes();
	const transactionFilter = useMemo(() => ({ assetId }), [assetId]);
	const { transactions, loading: loadingTransactions } =
		useGetTransactions(transactionFilter);
	const { accounts } = useGetAccounts();
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();

	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [valuationVisible, setValuationVisible] = useState(false);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const asset = useMemo(
		() => assets.find((a) => a.id === assetId) ?? null,
		[assets, assetId]
	);

	// Derived metrics
	const totalInvested = asset ? asset.initial_cost + asset.contributions : 0;
	const totalCostBasis = asset
		? asset.initial_cost +
		  asset.contributions +
		  asset.reinvestments -
		  asset.withdrawals
		: 0;
	const marketAppreciation = asset
		? asset.current_valuation - totalCostBasis
		: 0;
	const totalWealthGain = asset ? asset.current_valuation - totalInvested : 0;

	// Percentage calculations
	const appreciationPct = formatPercent(
		calcPercentChange(asset?.current_valuation ?? 0, totalCostBasis)
	);
	const wealthGainPct = formatPercent(
		calcPercentChange(asset?.current_valuation ?? 0, totalInvested)
	);

	const getTypeName = (typeId: number) =>
		assetTypes.find((t) => t.id === typeId)?.name ?? "";

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

	const handleEditSubmit = async (data: {
		name: string;
		asset_type_id: number;
		currency: string;
		notes?: string;
	}) => {
		try {
			await updateAsset(assetId, {
				name: data.name,
				asset_type_id: data.asset_type_id,
				notes: data.notes,
			});
			setSnackbar({ visible: true, message: "Asset updated" });
			setEditDialogVisible(false);
			refreshAssets();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating asset",
			});
		}
	};

	const handleUpdateValuation = async (
		assetId: number,
		newValuation: number
	) => {
		try {
			await updateValuation(assetId, newValuation);
			setSnackbar({ visible: true, message: "Valuation updated" });
			setValuationVisible(false);
			refreshAssets();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating valuation",
			});
		}
	};

	const isLoading = loadingAssets || loadingTypes || loadingTransactions;

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
					Loading asset details...
				</Text>
			</View>
		);
	}

	if (!asset) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					Asset not found.
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
				<AppCard title={asset.name} subtitle={getTypeName(asset.asset_type_id)}>
					{/* Current Valuation - prominent */}
					<View style={styles.valuationRow}>
						<Text
							variant="bodySmall"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							Current Valuation
						</Text>
						<Text
							variant="headlineSmall"
							style={{
								fontWeight: "bold",
								color: theme.colors.primary,
							}}
						>
							{formatAmount(asset.current_valuation, asset.currency)}
						</Text>
					</View>

					<Divider style={styles.divider} />

					{/* Financial Breakdown */}
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Initial Cost
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(asset.initial_cost, asset.currency)}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Contributions
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(asset.contributions, asset.currency)}
							</Text>
						</View>
					</View>
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Reinvestments
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(asset.reinvestments, asset.currency)}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Withdrawals
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(asset.withdrawals, asset.currency)}
							</Text>
						</View>
					</View>

					<Divider style={styles.divider} />

					{/* Derived Metrics */}
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Total Invested
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(totalInvested, asset.currency)}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Cost Basis
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(totalCostBasis, asset.currency)}
							</Text>
						</View>
					</View>
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Market Appreciation
							</Text>
							<View
								style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
							>
								<Text
									variant="titleSmall"
									style={{
										fontWeight: "bold",
										color:
											marketAppreciation >= 0
												? theme.colors.primary
												: theme.colors.error,
									}}
								>
									{marketAppreciation >= 0 ? "+" : ""}
									{formatAmount(marketAppreciation, asset.currency)}
								</Text>
								{appreciationPct && (
									<Text
										variant="labelSmall"
										style={{
											paddingHorizontal: 5,
											paddingVertical: 1,
											borderRadius: 4,
											overflow: "hidden",
											fontWeight: "bold",
											fontSize: 10,
											backgroundColor:
												marketAppreciation >= 0
													? theme.colors.primaryContainer
													: theme.colors.errorContainer,
											color:
												marketAppreciation >= 0
													? theme.colors.onPrimaryContainer
													: theme.colors.onErrorContainer,
										}}
									>
										{appreciationPct}
									</Text>
								)}
							</View>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Total Wealth Gain
							</Text>
							<View
								style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
							>
								<Text
									variant="titleSmall"
									style={{
										fontWeight: "bold",
										color:
											totalWealthGain >= 0
												? theme.colors.primary
												: theme.colors.error,
									}}
								>
									{totalWealthGain >= 0 ? "+" : ""}
									{formatAmount(totalWealthGain, asset.currency)}
								</Text>
								{wealthGainPct && (
									<Text
										variant="labelSmall"
										style={{
											paddingHorizontal: 5,
											paddingVertical: 1,
											borderRadius: 4,
											overflow: "hidden",
											fontWeight: "bold",
											fontSize: 10,
											backgroundColor:
												totalWealthGain >= 0
													? theme.colors.primaryContainer
													: theme.colors.errorContainer,
											color:
												totalWealthGain >= 0
													? theme.colors.onPrimaryContainer
													: theme.colors.onErrorContainer,
										}}
									>
										{wealthGainPct}
									</Text>
								)}
							</View>
						</View>
					</View>

					{asset.notes ? (
						<>
							<Divider style={styles.divider} />
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Notes
							</Text>
							<Text variant="bodyMedium" style={{ marginTop: 4 }}>
								{asset.notes}
							</Text>
						</>
					) : null}
					<Divider style={styles.divider} />
					<Text
						variant="bodySmall"
						style={{ color: theme.colors.onSurfaceVariant }}
					>
						Created: {new Date(asset.created_at).toLocaleDateString()}
					</Text>
				</AppCard>

				{/* Action Buttons */}
				<View style={styles.actionsRow}>
					<IconButton
						icon="chart-line"
						mode="contained"
						onPress={() => setValuationVisible(true)}
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

				{/* Transactions Section */}
				<Text
					variant="titleMedium"
					style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
				>
					Linked Transactions
				</Text>
				{transactions.length === 0 ? (
					<View style={styles.emptyState}>
						<Text
							variant="bodyLarge"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							No transactions linked to this asset.
						</Text>
					</View>
				) : (
					transactions.map((transaction, index) => {
						const typeName = getTransactionTypeName(
							transaction.transaction_type_id
						);
						const isTransfer = typeName === "Transfer";

						// Build label: resolve asset name when account is null
						let accountName: string;
						if (isTransfer) {
							const from = transaction.from_account_id
								? getAccountName(transaction.from_account_id)
								: asset?.name || "";
							const to = transaction.to_account_id
								? getAccountName(transaction.to_account_id)
								: asset?.name || "";
							// Reinvest: both sides are the asset
							accountName =
								from === to && from !== "" ? from : `${from} → ${to}`;
						} else {
							accountName = getAccountName(
								transaction.from_account_id || transaction.to_account_id
							);
						}

						// Currency: prefer account, fall back to asset
						const acctCurrency = getAccountCurrency(
							transaction.from_account_id || transaction.to_account_id
						);
						const displayCurrency = acctCurrency || asset?.currency || "USD";

						return (
							<TransactionListItem
								key={transaction.id}
								transaction={transaction}
								accountName={accountName}
								accountCurrency={displayCurrency}
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

			<AssetFormDialog
				visible={editDialogVisible}
				onClose={() => setEditDialogVisible(false)}
				onSubmit={handleEditSubmit}
				assetTypes={assetTypes}
				initialAsset={asset}
			/>

			{asset && (
				<AddToAssetDialog
					visible={valuationVisible}
					onClose={() => setValuationVisible(false)}
					onSubmit={handleUpdateValuation}
					asset={asset}
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
	valuationRow: {
		marginBottom: 8,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	detailItem: {
		flex: 1,
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

export default AssetDetailScreen;
