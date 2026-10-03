import React, { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import IconBadge from "../components/ui/IconBadge";
import AmountText from "../components/ui/AmountText";
import EmptyState from "../components/ui/EmptyState";
import HeroCard from "../components/ui/HeroCard";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import AssetFormSheet, { AssetFormValues } from "../components/AssetFormSheet";
import { useGetAssets } from "../hooks/asset/useGetAssets";
import { useCreateAsset } from "../hooks/asset/useCreateAsset";
import { useUpdateAsset } from "../hooks/asset/useUpdateAsset";
import { useGetAssetTypes } from "../hooks/assetType/useGetAssetTypes";
import { getAssetTypeIcon } from "../constants/typeIcons";
import { Asset, RootStackParamList } from "../types";
import { formatAmount, formatCompactAmount, formatSignedAmount } from "../utils/currency";
import { calcPercentChange, formatPercent } from "../utils/percent";
import { radius, spacing, tabularNums, useKTheme } from "../theme/theme";
import { assetGain } from "../utils/asset";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AssetsScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const toast = useToast();
	const { assets, loading, error, refresh, refreshing, pullToRefresh } = useGetAssets();
	const { assetTypes } = useGetAssetTypes();
	const { createAsset } = useCreateAsset();
	const { updateAsset } = useUpdateAsset();
	const [formVisible, setFormVisible] = useState(false);
	const [editing, setEditing] = useState<Asset | null>(null);
	const [fabExtended, setFabExtended] = useState(true);

	const typeName = (id: number) => assetTypes.find((t) => t.id === id)?.name ?? "Other";

	const totals = useMemo(() => {
		const map: Record<string, { total: number; invested: number; gain: number; count: number }> = {};
		assets.forEach((a) => {
			const t = (map[a.currency] ??= { total: 0, invested: 0, gain: 0, count: 0 });
			const g = assetGain(a);
			t.total += a.current_valuation || 0;
			t.invested += g.invested;
			t.gain += g.gain;
			t.count += 1;
		});
		return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
	}, [assets]);

	const groups = useMemo(() => {
		const map = new Map<number, Asset[]>();
		assets.forEach((a) => {
			const list = map.get(a.asset_type_id) ?? [];
			list.push(a);
			map.set(a.asset_type_id, list);
		});
		return Array.from(map.entries())
			.map(([typeId, list]) => ({
				typeId,
				name: typeName(typeId),
				assets: [...list].sort((a, b) => b.current_valuation - a.current_valuation),
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [assets, assetTypes]);

	const openCreate = () => {
		setEditing(null);
		setFormVisible(true);
	};

	const handleSubmit = async (values: AssetFormValues) => {
		if (editing) {
			await updateAsset(editing.id, {
				name: values.name,
				asset_type_id: values.asset_type_id,
				notes: values.notes,
			});
			toast.success("Asset updated");
		} else {
			await createAsset({
				name: values.name,
				asset_type_id: values.asset_type_id,
				currency: values.currency,
				notes: values.notes,
				initial_cost: 0,
				contributions: 0,
				reinvestments: 0,
				withdrawals: 0,
				current_valuation: 0,
				created_at: new Date().toISOString(),
			});
			toast.success(`${values.name} added`);
		}
		setFormVisible(false);
	};

	const renderBody = () => {
		if (loading) return <SkeletonList rows={5} />;
		if (error && assets.length === 0) {
			return (
				<EmptyState icon="cloud-alert" tone="error" title="Couldn't load assets" message={error} actionLabel="Try again" onAction={refresh} />
			);
		}
		if (assets.length === 0) {
			return (
				<EmptyState
					icon="diamond-stone"
					title="No assets yet"
					message="Track investments, property and valuables to see how your wealth grows over time."
					actionLabel="Add asset"
					onAction={openCreate}
				/>
			);
		}
		const [main, ...others] = totals;
		const mainPct = formatPercent(calcPercentChange(main[1].invested + main[1].gain, main[1].invested));
		return (
			<>
				<HeroCard>
					<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
						Total value
					</Text>
					<AmountText amount={main[1].total} currency={main[0]} tone="onHero" variant="displaySmall" />
					{main[1].invested > 0 ? (
						<Text variant="bodyMedium" style={{ color: theme.custom.onHero, marginTop: spacing.xs }}>
							{`${main[1].gain >= 0 ? "Up" : "Down"} ${formatAmount(Math.abs(main[1].gain), main[0])}${mainPct ? ` (${mainPct})` : ""} on what you put in`}
						</Text>
					) : null}
					<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.xs }}>
						{`${assets.length} asset${assets.length === 1 ? "" : "s"}`}
						{others.map(([cur, t]) => `  ·  ${formatCompactAmount(t.total, cur)}`).join("")}
					</Text>
				</HeroCard>

				{groups.map((group) => {
					const groupTotals = group.assets.reduce<Record<string, number>>((acc, a) => {
						acc[a.currency] = (acc[a.currency] ?? 0) + a.current_valuation;
						return acc;
					}, {});
					return (
						<View key={group.typeId}>
							<View style={styles.groupHeader}>
								<Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
									{group.name}
								</Text>
								<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
									{Object.entries(groupTotals)
										.map(([cur, v]) => formatCompactAmount(v, cur))
										.join("  ·  ")}
								</Text>
							</View>
							<Card padded={false}>
								{group.assets.map((a, i) => {
									const { invested, gain, pct } = assetGain(a);
									const showGain = invested > 0 && gain !== 0;
									return (
										<ListItem
											key={a.id}
											title={a.name}
											subtitle={a.notes ? a.notes : a.currency}
											left={<IconBadge icon={getAssetTypeIcon(group.name)} />}
											right={
												<View style={styles.right}>
													<AmountText amount={a.current_valuation} currency={a.currency} />
													{showGain ? (
														<Text
															variant="labelMedium"
															style={{ color: gain >= 0 ? theme.custom.income : theme.custom.expense, ...tabularNums }}
														>
															{`${formatSignedAmount(gain, a.currency)}${pct ? `  ${pct}` : ""}`}
														</Text>
													) : null}
												</View>
											}
											chevron
											onPress={() => navigation.navigate("AssetDetail", { assetId: a.id })}
											onLongPress={() => {
												setEditing(a);
												setFormVisible(true);
											}}
											accessibilityLabel={`${a.name}, worth ${formatAmount(a.current_valuation, a.currency)}`}
											style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }}
										/>
									);
								})}
							</Card>
						</View>
					);
				})}
				<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
					Tip: long-press an asset to edit it.
				</Text>
			</>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<ScrollView
				contentContainerStyle={styles.content}
				onScroll={(e) => setFabExtended(e.nativeEvent.contentOffset.y <= 8)}
				scrollEventThrottle={64}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={pullToRefresh}
						colors={[theme.colors.primary]}
						progressBackgroundColor={theme.colors.surface}
					/>
				}
			>
				{renderBody()}
			</ScrollView>
			{assets.length > 0 ? (
				<AnimatedFAB
					icon="plus"
					label="Add asset"
					extended={fabExtended}
					onPress={openCreate}
					style={styles.fab}
					color={theme.colors.onPrimary}
					theme={{ colors: { primaryContainer: theme.colors.primary } }}
					accessibilityLabel="Add asset"
				/>
			) : null}
			<AssetFormSheet
				visible={formVisible}
				onDismiss={() => setFormVisible(false)}
				assetTypes={assetTypes}
				asset={editing}
				onSubmit={handleSubmit}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.sm,
		paddingBottom: 120,
	},
	groupHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: spacing.xxl,
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.xs,
	},
	right: {
		alignItems: "flex-end",
	},
	hint: {
		textAlign: "center",
		marginTop: spacing.xl,
	},
	fab: {
		position: "absolute",
		right: spacing.lg,
		bottom: spacing.lg,
		borderRadius: radius.lg,
	},
});

export default AssetsScreen;
