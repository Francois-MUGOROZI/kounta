import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import {
	ActivityIndicator,
	Text,
	useTheme,
	Avatar,
	Divider,
	Surface,
} from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useGetTransactionById } from "../hooks/transaction/useGetTransactionById";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { useGetAssets } from "../hooks/asset/useGetAssets";
import { useGetLiabilities } from "../hooks/liability/useGetLiabilities";
import { useGetEnvelopes } from "../hooks/envelope/useGetEnvelope";
import { useGetBills } from "../hooks/bill/useGetBills";
import { formatTransactionAmount } from "../utils/currency";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AppCard from "../components/AppCard";

type TransactionDetailRouteProp = RouteProp<
	RootStackParamList,
	"TransactionDetail"
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TransactionDetailScreen = () => {
	const theme = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<TransactionDetailRouteProp>();
	const { transactionId } = route.params;

	const { transaction, loading, error } = useGetTransactionById(transactionId);
	const { accounts } = useGetAccounts();
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();
	const { assets } = useGetAssets();
	const { liabilities } = useGetLiabilities();
	const { envelopes } = useGetEnvelopes();
	const { bills } = useGetBills();

	const transactionTypeName = useMemo(() => {
		if (!transaction) return "";
		return (
			transactionTypes.find((t) => t.id === transaction.transaction_type_id)
				?.name || ""
		);
	}, [transaction, transactionTypes]);

	const isIncome = transactionTypeName === "Income";
	const isTransfer = transactionTypeName === "Transfer";

	const getIcon = () => {
		if (isTransfer) return "bank-transfer";
		if (isIncome) return "arrow-down-circle";
		return "arrow-up-circle";
	};

	const getIconColor = () => {
		if (isTransfer) return theme.colors.secondary;
		if (isIncome) return theme.colors.primary;
		return theme.colors.error;
	};

	const getAmountColor = () => {
		if (isTransfer) return theme.colors.secondary;
		if (isIncome) return theme.colors.primary;
		return theme.colors.error;
	};

	const categoryName = useMemo(() => {
		if (!transaction) return "";
		return (
			categories.find((c) => c.id === transaction.category_id)?.name || "—"
		);
	}, [transaction, categories]);

	const accountCurrency = useMemo(() => {
		if (!transaction) return "USD";
		const accountId = transaction.from_account_id || transaction.to_account_id;
		if (accountId) {
			const acctCurrency = accounts.find((a) => a.id === accountId)?.currency;
			if (acctCurrency) return acctCurrency;
		}
		// Fall back to asset currency for asset-only transfers
		if (transaction.asset_id) {
			const assetCurrency = assets.find(
				(a) => a.id === transaction.asset_id
			)?.currency;
			if (assetCurrency) return assetCurrency;
		}
		return "USD";
	}, [transaction, accounts, assets]);

	const accountDisplay = useMemo(() => {
		if (!transaction) return "";
		if (isTransfer) {
			const from = transaction.from_account_id
				? accounts.find((a) => a.id === transaction.from_account_id)?.name ||
				  "—"
				: transaction.asset_id
				? assets.find((a) => a.id === transaction.asset_id)?.name || "—"
				: "—";
			const to = transaction.to_account_id
				? accounts.find((a) => a.id === transaction.to_account_id)?.name || "—"
				: transaction.asset_id
				? assets.find((a) => a.id === transaction.asset_id)?.name || "—"
				: "—";
			// Reinvest: both sides are the same asset
			if (from === to && from !== "—") return from;
			return `${from} → ${to}`;
		}
		const accountId = transaction.from_account_id || transaction.to_account_id;
		if (!accountId) return "—";
		return accounts.find((a) => a.id === accountId)?.name || "—";
	}, [transaction, accounts, assets, isTransfer]);

	const formattedDate = useMemo(() => {
		if (!transaction) return "";
		return new Date(transaction.date).toLocaleDateString(undefined, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}, [transaction]);

	// Build associations list
	const associations = useMemo(() => {
		if (!transaction) return [];
		const items: {
			icon: string;
			label: string;
			value: string;
			navigable: boolean;
			onPress?: () => void;
		}[] = [];

		if (transaction.asset_id) {
			const asset = assets.find((a) => a.id === transaction.asset_id);
			items.push({
				icon: "diamond-stone",
				label: "Asset",
				value: asset?.name || `#${transaction.asset_id}`,
				navigable: true,
				onPress: () =>
					navigation.navigate("AssetDetail", {
						assetId: transaction.asset_id!,
					}),
			});
		}

		if (transaction.liability_id) {
			const liability = liabilities.find(
				(l) => l.id === transaction.liability_id
			);
			items.push({
				icon: "credit-card-outline",
				label: "Liability",
				value: liability?.name || `#${transaction.liability_id}`,
				navigable: true,
				onPress: () =>
					navigation.navigate("LiabilityDetail", {
						liabilityId: transaction.liability_id!,
					}),
			});
		}

		if (transaction.envelope_id) {
			const envelope = envelopes.find((e) => e.id === transaction.envelope_id);
			items.push({
				icon: "email-outline",
				label: "Envelope",
				value: envelope?.name || `#${transaction.envelope_id}`,
				navigable: true,
				onPress: () =>
					navigation.navigate("EnvelopeDetail", {
						envelopeId: transaction.envelope_id!,
					}),
			});
		}

		if (transaction.bill_id) {
			const bill = (bills as any[])?.find(
				(b: any) => b.id === transaction.bill_id
			);
			items.push({
				icon: "receipt",
				label: "Bill",
				value: bill?.name || `#${transaction.bill_id}`,
				navigable: false,
			});
		}

		return items;
	}, [transaction, assets, liabilities, envelopes, bills, navigation]);

	if (loading) {
		return (
			<View
				style={[styles.centered, { backgroundColor: theme.colors.background }]}
			>
				<ActivityIndicator size="large" />
				<Text variant="bodyLarge" style={{ marginTop: 16 }}>
					Loading transaction...
				</Text>
			</View>
		);
	}

	if (error || !transaction) {
		return (
			<View
				style={[styles.centered, { backgroundColor: theme.colors.background }]}
			>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					{error || "Transaction not found."}
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
		>
			{/* Header Card */}
			<Surface
				style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}
				elevation={2}
			>
				<View style={styles.headerRow}>
					<Avatar.Icon
						size={40}
						icon={getIcon()}
						style={{ backgroundColor: theme.colors.elevation.level3 }}
						color={getIconColor()}
					/>
					<View style={styles.headerInfo}>
						<Text variant="titleMedium" style={styles.description}>
							{transaction.description}
						</Text>
						<Text
							variant="bodySmall"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							{formattedDate}
						</Text>
					</View>
				</View>
				<Text
					variant="titleLarge"
					style={[styles.amount, { color: getAmountColor() }]}
				>
					{formatTransactionAmount(
						transaction.amount,
						accountCurrency,
						isIncome,
						isTransfer
					)}
				</Text>
			</Surface>

			{/* Details Section */}
			<AppCard title="Details" style={styles.section}>
				<DetailRow
					icon="tag-outline"
					label="Category"
					value={categoryName}
					theme={theme}
				/>
				<Divider style={styles.divider} />
				<DetailRow
					icon="bank"
					label={isTransfer ? "Accounts" : "Account"}
					value={accountDisplay}
					theme={theme}
				/>
				<Divider style={styles.divider} />
				<DetailRow
					icon="swap-horizontal"
					label="Type"
					value={transactionTypeName}
					theme={theme}
				/>
			</AppCard>

			{/* Associations Section */}
			{associations.length > 0 && (
				<AppCard title="Associations" style={styles.section}>
					{associations.map((assoc, index) => (
						<React.Fragment key={assoc.label}>
							{index > 0 && <Divider style={styles.divider} />}
							<TouchableOpacity
								style={styles.associationRow}
								disabled={!assoc.navigable}
								onPress={assoc.onPress}
								activeOpacity={0.6}
							>
								<MaterialCommunityIcons
									name={assoc.icon}
									size={20}
									color={theme.colors.onSurfaceVariant}
									style={styles.rowIcon}
								/>
								<Text
									variant="bodyMedium"
									style={[
										styles.rowLabel,
										{ color: theme.colors.onSurfaceVariant },
									]}
								>
									{assoc.label}
								</Text>
								<Text
									variant="bodyMedium"
									style={[
										styles.rowValue,
										{
											color: assoc.navigable
												? theme.colors.primary
												: theme.colors.onSurface,
										},
									]}
								>
									{assoc.value}
								</Text>
								{assoc.navigable && (
									<MaterialCommunityIcons
										name="chevron-right"
										size={20}
										color={theme.colors.onSurfaceVariant}
									/>
								)}
							</TouchableOpacity>
						</React.Fragment>
					))}
				</AppCard>
			)}
		</ScrollView>
	);
};

/** Reusable row for the Details card */
const DetailRow: React.FC<{
	icon: string;
	label: string;
	value: string;
	theme: {
		colors: {
			onSurfaceVariant: string;
			onSurface: string;
		};
	};
}> = ({ icon, label, value, theme }) => (
	<View style={styles.detailRow}>
		<MaterialCommunityIcons
			name={icon}
			size={20}
			color={theme.colors.onSurfaceVariant}
			style={styles.rowIcon}
		/>
		<Text
			variant="bodyMedium"
			style={[styles.rowLabel, { color: theme.colors.onSurfaceVariant }]}
		>
			{label}
		</Text>
		<Text
			variant="bodyMedium"
			style={[styles.rowValue, { color: theme.colors.onSurface }]}
		>
			{value}
		</Text>
	</View>
);

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
	headerCard: {
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	headerInfo: {
		flex: 1,
		marginLeft: 16,
	},
	description: {
		fontWeight: "600",
	},
	amount: {
		fontWeight: "bold",
		textAlign: "center",
	},
	section: {
		marginBottom: 12,
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
	},
	associationRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
	},
	rowIcon: {
		marginRight: 12,
	},
	rowLabel: {
		width: 90,
	},
	rowValue: {
		flex: 1,
		textAlign: "right",
		fontWeight: "500",
	},
	divider: {
		marginVertical: 2,
	},
});

export default TransactionDetailScreen;
