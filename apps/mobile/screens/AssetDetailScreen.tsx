import React, { useLayoutEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeroCard from "../components/ui/HeroCard";
import Card from "../components/ui/Card";
import IconBadge from "../components/ui/IconBadge";
import AmountText from "../components/ui/AmountText";
import EmptyState from "../components/ui/EmptyState";
import ActionRow from "../components/ui/ActionRow";
import StatGrid from "../components/ui/StatGrid";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import TransactionSectionList, { useDescribedTransactions } from "../components/TransactionSectionList";
import AssetFormSheet, { AssetFormValues } from "../components/AssetFormSheet";
import AssetValuationSheet from "../components/AssetValuationSheet";
import { useQuery } from "../hooks/useQuery";
import { useGetAssetTypes } from "../hooks/assetType/useGetAssetTypes";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useUpdateAsset } from "../hooks/asset/useUpdateAsset";
import { useUpdateValuation } from "../hooks/asset/useUpdateValuation";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import { AssetRepository } from "../repositories/AssetRepository";
import { Asset, RootStackParamList } from "../types";
import { formatAmount, formatSignedAmount } from "../utils/currency";
import { formatShortDate } from "../utils/date";
import { getAssetTypeIcon } from "../constants/typeIcons";
import { spacing, useKTheme } from "../theme/theme";
import { assetGain } from "../utils/asset";

type Route = RouteProp<RootStackParamList, "AssetDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const AssetDetailScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { assetId } = useRoute<Route>().params;
	const toast = useToast();
	const { openComposer } = useTransactionComposer();
	const { assetTypes } = useGetAssetTypes();
	const { updateAsset } = useUpdateAsset();
	const { updateValuation } = useUpdateValuation();
	const [editVisible, setEditVisible] = useState(false);
	const [valuationVisible, setValuationVisible] = useState(false);

	const {
		data: asset,
		loading,
		error,
		refresh,
	} = useQuery<Asset | null>((db) => AssetRepository.getById(db, assetId), [assetId], null, "Failed to load asset");
	const filter = useMemo(() => ({ assetId }), [assetId]);
	const { transactions, loading: loadingTx, refreshing, pullToRefresh } = useGetTransactions(filter);
	const rows = useDescribedTransactions(transactions);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: asset?.name ?? "Asset",
			headerRight: () =>
				asset ? (
					<IconButton icon="pencil-outline" onPress={() => setEditVisible(true)} accessibilityLabel="Edit asset" />
				) : null,
		});
	}, [navigation, asset]);

	if (loading) {
		return (
			<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
				<SkeletonList rows={6} />
			</View>
		);
	}

	if (!asset) {
		return (
			<View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon={error ? "cloud-alert" : "diamond-stone"}
					tone={error ? "error" : "default"}
					title={error ? "Couldn't load this asset" : "Asset not found"}
					message={error ?? "It may have been removed."}
					actionLabel={error ? "Try again" : undefined}
					onAction={error ? refresh : undefined}
				/>
			</View>
		);
	}

	const typeName = assetTypes.find((t) => t.id === asset.asset_type_id)?.name ?? "";
	const { invested, gain, pct } = assetGain(asset);
	// Cost basis counts reinvested earnings as money in the asset; appreciation is the market move on top.
	const costBasis = invested + asset.reinvestments - asset.withdrawals;
	const appreciation = asset.current_valuation - costBasis;

	const handleEdit = async (values: AssetFormValues) => {
		await updateAsset(asset.id, {
			name: values.name,
			asset_type_id: values.asset_type_id,
			notes: values.notes,
		});
		setEditVisible(false);
		toast.success("Asset updated");
	};

	const handleRevalue = async (value: number) => {
		await updateValuation(asset.id, value);
		setValuationVisible(false);
		toast.success("Value updated");
	};

	const header = (
		<View>
			<HeroCard>
				<View style={styles.heroTop}>
					<IconBadge icon={getAssetTypeIcon(typeName)} color={theme.custom.onHero} background="rgba(255,255,255,0.16)" />
					<View style={{ flex: 1, marginLeft: spacing.md }}>
						<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
							{typeName || "Asset"}
						</Text>
						<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted }}>
							Current value
						</Text>
					</View>
				</View>
				<AmountText
					amount={asset.current_valuation}
					currency={asset.currency}
					tone="onHero"
					variant="displaySmall"
					style={{ marginTop: spacing.md }}
				/>
				{invested > 0 ? (
					<Text variant="bodyMedium" style={{ color: theme.custom.onHero, marginTop: spacing.xs }}>
						{`${formatSignedAmount(gain, asset.currency)}${pct ? ` (${pct})` : ""} overall gain`}
					</Text>
				) : (
					<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.xs }}>
						Nothing invested yet — use Invest to record your first contribution.
					</Text>
				)}
			</HeroCard>

			<ActionRow
				actions={[
					{
						label: "Invest",
						icon: "arrow-down-bold-circle-outline",
						color: theme.custom.income,
						background: theme.custom.incomeContainer,
						onPress: () => openComposer({ type: "Transfer", transferDirection: "account-to-asset", assetId }),
					},
					{
						label: "Withdraw",
						icon: "cash-fast",
						color: theme.custom.transfer,
						background: theme.custom.transferContainer,
						onPress: () => openComposer({ type: "Transfer", transferDirection: "asset-to-account", assetId }),
					},
					{
						label: "Revalue",
						icon: "chart-line",
						color: theme.custom.warning,
						background: theme.custom.warningContainer,
						onPress: () => setValuationVisible(true),
					},
				]}
			/>

			<StatGrid
				items={[
					{ label: "Initial cost", value: formatAmount(asset.initial_cost, asset.currency) },
					{ label: "Contributions", value: formatAmount(asset.contributions, asset.currency) },
					{ label: "Reinvested", value: formatAmount(asset.reinvestments, asset.currency) },
					{ label: "Withdrawn", value: formatAmount(asset.withdrawals, asset.currency) },
					{ label: "Total invested", value: formatAmount(invested, asset.currency) },
					{ label: "Cost basis", value: formatAmount(costBasis, asset.currency) },
					{
						label: "Market change",
						value: formatSignedAmount(appreciation, asset.currency),
						tone: appreciation > 0 ? "income" : appreciation < 0 ? "expense" : "default",
					},
					{
						label: "Total gain",
						value: formatSignedAmount(gain, asset.currency),
						tone: gain > 0 ? "income" : gain < 0 ? "expense" : "default",
						caption: pct ?? undefined,
					},
				]}
			/>

			{asset.notes ? (
				<Card style={styles.notes}>
					<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
						Notes
					</Text>
					<Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: spacing.xs }}>
						{asset.notes}
					</Text>
				</Card>
			) : null}
			<Text variant="bodySmall" style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
				{`Added ${formatShortDate(asset.created_at)} · ${asset.currency}`}
			</Text>
		</View>
	);

	return (
		<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
			<TransactionSectionList
				rows={rows}
				header={header}
				sectionTitle="Linked transactions"
				refreshing={refreshing}
				onRefresh={pullToRefresh}
				empty={
					loadingTx ? (
						<SkeletonList rows={4} />
					) : (
						<EmptyState
							compact
							icon="swap-horizontal"
							title="No linked transactions"
							message="Money you invest in or withdraw from this asset will show up here."
						/>
					)
				}
			/>
			<AssetFormSheet
				visible={editVisible}
				onDismiss={() => setEditVisible(false)}
				assetTypes={assetTypes}
				asset={asset}
				onSubmit={handleEdit}
			/>
			<AssetValuationSheet
				visible={valuationVisible}
				onDismiss={() => setValuationVisible(false)}
				asset={asset}
				onSubmit={handleRevalue}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	center: {
		justifyContent: "center",
	},
	heroTop: {
		flexDirection: "row",
		alignItems: "center",
	},
	notes: {
		marginTop: spacing.lg,
	},
	meta: {
		marginTop: spacing.md,
		marginLeft: spacing.xs,
	},
});

export default AssetDetailScreen;
