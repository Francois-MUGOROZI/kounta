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
import { useAddToAsset } from "../hooks/asset/useAddToAsset";
import { useGetAssetTypes } from "../hooks/assetType/useGetAssetTypes";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { formatAmount } from "../utils/currency";
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
	const { addToAsset } = useAddToAsset();
	const { assetTypes, loading: loadingTypes } = useGetAssetTypes();
	const transactionFilter = useMemo(() => ({ assetId }), [assetId]);
	const { transactions, loading: loadingTransactions } =
		useGetTransactions(transactionFilter);
	const { accounts } = useGetAccounts();
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();

	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [addValueVisible, setAddValueVisible] = useState(false);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const asset = useMemo(
		() => assets.find((a) => a.id === assetId) ?? null,
		[assets, assetId],
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
		initial_value: number;
		current_value: number;
		notes?: string;
	}) => {
		try {
			await updateAsset(assetId, data);
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

	const handleAddValue = async (assetId: number, amount: number) => {
		try {
			await addToAsset(assetId, amount);
			setSnackbar({ visible: true, message: "Value added to asset" });
			setAddValueVisible(false);
			refreshAssets();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error adding value",
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
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Currency
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{asset.currency}
							</Text>
						</View>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Initial Value
							</Text>
							<Text variant="titleSmall" style={{ fontWeight: "bold" }}>
								{formatAmount(asset.initial_value, asset.currency)}
							</Text>
						</View>
					</View>
					<View style={styles.row}>
						<View style={styles.detailItem}>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Current Value
							</Text>
							<Text variant="titleMedium" style={{ fontWeight: "bold" }}>
								{formatAmount(asset.current_value, asset.currency)}
							</Text>
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

				{/* Edit Button */}
				<View style={styles.actionsRow}>
					<IconButton
						icon="plus-circle"
						mode="contained"
						onPress={() => setAddValueVisible(true)}
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

			<AssetFormDialog
				visible={editDialogVisible}
				onClose={() => setEditDialogVisible(false)}
				onSubmit={handleEditSubmit}
				assetTypes={assetTypes}
				initialAsset={asset}
			/>

			{asset && (
				<AddToAssetDialog
					visible={addValueVisible}
					onClose={() => setAddValueVisible(false)}
					onSubmit={handleAddValue}
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
