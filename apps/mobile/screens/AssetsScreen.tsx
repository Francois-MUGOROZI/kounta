import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
	Divider,
} from "react-native-paper";
import AppCard from "../components/AppCard";
import { useGetAssets } from "../hooks/asset/useGetAssets";
import { useCreateAsset } from "../hooks/asset/useCreateAsset";
import { useUpdateAsset } from "../hooks/asset/useUpdateAsset";
import { useGetAssetTypes } from "../hooks/assetType/useGetAssetTypes";
import AssetListItem from "../components/AssetListItem";
import AssetFormDialog from "../components/AssetFormDialog";
import { Asset, RootStackParamList } from "../types";
import { formatAmount } from "../utils/currency";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AssetsScreen = () => {
	const navigation = useNavigation<NavigationProp>();
	const theme = useTheme();
	const { assets, loading, error, refresh } = useGetAssets();
	const {
		createAsset,
		loading: creating,
		error: createError,
	} = useCreateAsset();
	const {
		updateAsset,
		loading: updating,
		error: updateError,
	} = useUpdateAsset();
	const {
		assetTypes,
		loading: loadingTypes,
		error: errorTypes,
	} = useGetAssetTypes();
	const [modalVisible, setModalVisible] = useState(false);
	const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const openAddModal = () => {
		setEditingAsset(null);
		setModalVisible(true);
	};

	const openEditModal = (asset: Asset) => {
		setEditingAsset(asset);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setEditingAsset(null);
	};

	const handleSubmit = async (data: {
		name: string;
		asset_type_id: number;
		currency: string;
		notes?: string;
	}) => {
		try {
			if (editingAsset) {
				await updateAsset(editingAsset.id, {
					name: data.name,
					asset_type_id: data.asset_type_id,
					notes: data.notes,
				});
				setSnackbar({ visible: true, message: "Asset updated" });
			} else {
				await createAsset({
					...data,
					initial_value: 0,
					current_value: 0,
					initial_cost: 0,
					contributions: 0,
					reinvestments: 0,
					withdrawals: 0,
					current_valuation: 0,
					created_at: new Date().toISOString(),
				});
				setSnackbar({ visible: true, message: "Asset created" });
			}
			closeModal();
			refresh();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving asset",
			});
		}
	};

	const getTypeName = (typeId: number) => {
		return assetTypes.find((t) => t.id === typeId)?.name || "";
	};

	// Group assets by currency
	const groupedAssets = useMemo(() => {
		const groups: { [key: string]: Asset[] } = {};
		assets.forEach((asset) => {
			if (!groups[asset.currency]) {
				groups[asset.currency] = [];
			}
			groups[asset.currency].push(asset);
		});
		return groups;
	}, [assets]);

	const flatListData = useMemo(() => {
		const data: Array<{ type: "header" | "item"; content: any }> = [];
		Object.entries(groupedAssets).forEach(([currency, assets]) => {
			data.push({ type: "header", content: currency });
			assets.forEach((asset) => {
				data.push({ type: "item", content: asset });
			});
		});
		return data;
	}, [groupedAssets]);

	// Calculate total balances by currency
	const totalByCurrency = useMemo(() => {
		const map: { [currency: string]: number } = {};
		assets.forEach((asset) => {
			if (!map[asset.currency]) map[asset.currency] = 0;
			map[asset.currency] += asset.current_valuation || 0;
		});
		return map;
	}, [assets]);

	const anyLoading = loading || creating || updating || loadingTypes;
	const anyError = error || createError || updateError || errorTypes;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<AppCard
				title="Total Balance"
				subtitle="Combined across all assets"
				style={styles.totalBalanceContainer}
			>
				<Text variant="headlineSmall" style={styles.totalBalanceValue}>
					{Object.entries(totalByCurrency).map(([cur, val], idx) => (
						<Text
							variant="titleMedium"
							key={cur}
							style={{ fontWeight: "bold" }}
						>
							{formatAmount(val, cur)}
							{idx < Object.entries(totalByCurrency).length - 1 ? " | " : ""}
						</Text>
					))}
				</Text>
			</AppCard>
			{anyLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text variant="bodyLarge" style={{ marginTop: 16 }}>
						Loading assets...
					</Text>
				</View>
			) : anyError ? (
				<View style={styles.centered}>
					<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
						{anyError}
					</Text>
				</View>
			) : (
				<FlatList
					data={flatListData}
					keyExtractor={(item, index) =>
						item.type === "header"
							? `header-${item.content}`
							: `item-${item.content.id}-${index}`
					}
					renderItem={({ item }) => {
						if (item.type === "header") {
							return (
								<Text
									variant="titleMedium"
									style={[styles.headerText, { color: theme.colors.primary }]}
								>
									{item.content}
								</Text>
							);
						} else {
							const asset = item.content as Asset;
							return (
								<AssetListItem
									asset={asset}
									typeName={getTypeName(asset.asset_type_id)}
									onEdit={() => openEditModal(asset)}
									onPress={() =>
										navigation.navigate("AssetDetail", { assetId: asset.id })
									}
								/>
							);
						}
					}}
					ListEmptyComponent={
						<View style={styles.centered}>
							<Text
								variant="bodyLarge"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								No assets yet.
							</Text>
						</View>
					}
					contentContainerStyle={[
						flatListData.length === 0 ? styles.centered : undefined,
						{ paddingBottom: 80 },
					]}
					ItemSeparatorComponent={() => <Divider />}
				/>
			)}
			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				color={theme.colors.onPrimary}
				onPress={openAddModal}
				accessibilityLabel="Add Asset"
			/>
			<AssetFormDialog
				visible={modalVisible}
				onClose={closeModal}
				onSubmit={handleSubmit}
				assetTypes={assetTypes}
				initialAsset={editingAsset}
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
	totalBalanceContainer: {
		marginBottom: 16,
	},
	totalBalanceValue: {
		fontWeight: "bold",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	headerText: {
		padding: 16,
		paddingBottom: 8,
		fontWeight: "bold",
	},
});

export default AssetsScreen;
