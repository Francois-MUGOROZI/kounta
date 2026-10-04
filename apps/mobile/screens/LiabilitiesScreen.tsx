import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Card from "../components/ui/Card";
import IconBadge from "../components/ui/IconBadge";
import AmountText from "../components/ui/AmountText";
import EmptyState from "../components/ui/EmptyState";
import HeroCard from "../components/ui/HeroCard";
import ProgressBar from "../components/ui/ProgressBar";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import LiabilityFormSheet, { LiabilityFormValues } from "../components/LiabilityFormSheet";
import { useGetLiabilities } from "../hooks/liability/useGetLiabilities";
import { useCreateLiability } from "../hooks/liability/useCreateLiability";
import { useUpdateLiability } from "../hooks/liability/useUpdateLiability";
import { useGetLiabilityTypes } from "../hooks/liabilityType/useGetLiabilityTypes";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { getLiabilityTypeIcon } from "../constants/typeIcons";
import { Liability, RootStackParamList } from "../types";
import { formatAmount, formatCompactAmount } from "../utils/currency";
import { radius, spacing, useKTheme } from "../theme/theme";
import { repaidRatio } from "../utils/liability";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LiabilityRow: React.FC<{
	liability: Liability;
	subtitle: string;
	typeName: string;
	paidOff: boolean;
	divider: boolean;
	onPress: () => void;
	onLongPress: () => void;
}> = ({ liability, subtitle, typeName, paidOff, divider, onPress, onLongPress }) => {
	const theme = useKTheme();
	const ratio = repaidRatio(liability);
	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			android_ripple={{ color: theme.colors.surfaceDisabled }}
			accessibilityRole="button"
			accessibilityLabel={
				paidOff
					? `${liability.name}, paid off`
					: `${liability.name}, ${formatAmount(liability.current_balance, liability.currency)} still owed`
			}
			style={({ pressed }) => [
				styles.row,
				divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant },
				pressed && { backgroundColor: theme.colors.surfaceVariant },
			]}
		>
			<View style={styles.rowTop}>
				<IconBadge
					icon={paidOff ? "check-circle-outline" : getLiabilityTypeIcon(typeName)}
					color={paidOff ? theme.custom.income : theme.custom.expense}
					background={paidOff ? theme.custom.incomeContainer : theme.custom.expenseContainer}
				/>
				<View style={styles.rowBody}>
					<Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
						{liability.name}
					</Text>
					<Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
						{subtitle}
					</Text>
				</View>
				<View style={styles.rowRight}>
					{paidOff ? (
						<Text variant="labelLarge" style={{ color: theme.custom.income }}>
							Paid off
						</Text>
					) : (
						<AmountText amount={liability.current_balance} currency={liability.currency} />
					)}
					<Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
						{`of ${formatCompactAmount(liability.total_amount, liability.currency)}`}
					</Text>
				</View>
				<MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.outline} style={styles.chevron} />
			</View>
			{!paidOff ? (
				<View style={styles.progressRow}>
					<ProgressBar progress={ratio} color={theme.custom.income} height={6} style={{ flex: 1 }} />
					<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: spacing.sm }}>
						{`${Math.round(ratio * 100)}% repaid`}
					</Text>
				</View>
			) : null}
		</Pressable>
	);
};

const LiabilitiesScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const toast = useToast();
	const { liabilities, loading, error, refresh, refreshing, pullToRefresh } = useGetLiabilities();
	const { liabilityTypes } = useGetLiabilityTypes();
	const { entities } = useGetEntities();
	const { accounts } = useGetAccounts();
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();
	const expenseTypeId = transactionTypes.find((t) => t.name === "Expense")?.id;
	const expenseCategories = useMemo(
		() => categories.filter((c) => c.transaction_type_id === expenseTypeId),
		[categories, expenseTypeId]
	);
	const { createLiability } = useCreateLiability();
	const { updateLiability } = useUpdateLiability();
	const [formVisible, setFormVisible] = useState(false);
	const [editing, setEditing] = useState<Liability | null>(null);
	const [fabExtended, setFabExtended] = useState(true);

	const typeNameFor = (l: Liability) =>
		liabilityTypes.find((t) => t.id === l.liability_type_id)?.name ?? "";
	const subtitleFor = (l: Liability) => {
		const type = typeNameFor(l);
		const entity = l.entity_id ? entities.find((e) => e.id === l.entity_id)?.name : undefined;
		return [type, entity].filter(Boolean).join(" · ");
	};

	const { active, paidOff } = useMemo(() => {
		const sorted = [...liabilities].sort((a, b) => b.current_balance - a.current_balance);
		return {
			active: sorted.filter((l) => l.current_balance > 0),
			paidOff: sorted.filter((l) => l.current_balance <= 0),
		};
	}, [liabilities]);

	const totals = useMemo(() => {
		const map: Record<string, { owed: number; borrowed: number; count: number }> = {};
		active.forEach((l) => {
			const t = (map[l.currency] ??= { owed: 0, borrowed: 0, count: 0 });
			t.owed += l.current_balance || 0;
			t.borrowed += l.total_amount || 0;
			t.count += 1;
		});
		return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
	}, [active]);

	const openCreate = () => {
		setEditing(null);
		setFormVisible(true);
	};
	const openEdit = (l: Liability) => {
		setEditing(l);
		setFormVisible(true);
	};

	const handleSubmit = async (values: LiabilityFormValues) => {
		if (editing) {
			await updateLiability(editing.id, values);
			toast.success("Liability updated");
		} else {
			const { account_id, cash_received, charge_category_id, ...liability } = values;
			await createLiability(
				{ ...liability, created_at: new Date().toISOString() },
				account_id && cash_received
					? { accountId: account_id, cashReceived: cash_received, chargeCategoryId: charge_category_id }
					: undefined
			);
			toast.success(`${values.name} added`);
		}
		setFormVisible(false);
	};

	const renderBody = () => {
		if (loading) return <SkeletonList rows={5} />;
		if (error && liabilities.length === 0) {
			return (
				<EmptyState icon="cloud-alert" tone="error" title="Couldn't load liabilities" message={error} actionLabel="Try again" onAction={refresh} />
			);
		}
		if (liabilities.length === 0) {
			return (
				<EmptyState
					icon="credit-card-clock-outline"
					title="No liabilities"
					message="Add loans or debts you owe to track what's left and how fast you're paying it down."
					actionLabel="Add liability"
					onAction={openCreate}
				/>
			);
		}
		const [main, ...others] = totals;
		return (
			<>
				<HeroCard>
					<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
						Total still owed
					</Text>
					{main ? (
						<>
							<AmountText amount={main[1].owed} currency={main[0]} tone="onHero" variant="displaySmall" />
							<ProgressBar
								progress={main[1].borrowed > 0 ? 1 - main[1].owed / main[1].borrowed : 0}
								color={theme.custom.onHero}
								trackColor="rgba(255,255,255,0.18)"
								height={6}
								style={{ marginTop: spacing.md }}
							/>
							<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.sm }}>
								{`${formatCompactAmount(main[1].borrowed - main[1].owed, main[0])} of ${formatCompactAmount(main[1].borrowed, main[0])} repaid`}
								{others.map(([cur, t]) => `  ·  ${formatCompactAmount(t.owed, cur)} owed`).join("")}
							</Text>
						</>
					) : (
						<Text variant="headlineSmall" style={{ color: theme.custom.onHero, marginTop: spacing.xs }}>
							All paid off 🎉
						</Text>
					)}
				</HeroCard>

				{active.length > 0 ? (
					<>
						<Text variant="titleSmall" style={[styles.groupHeader, { color: theme.colors.onSurface }]}>
							{`Active · ${active.length}`}
						</Text>
						<Card padded={false}>
							{active.map((l, i) => (
								<LiabilityRow
									key={l.id}
									liability={l}
									subtitle={subtitleFor(l)}
									typeName={typeNameFor(l)}
									paidOff={false}
									divider={i > 0}
									onPress={() => navigation.navigate("LiabilityDetail", { liabilityId: l.id })}
									onLongPress={() => openEdit(l)}
								/>
							))}
						</Card>
					</>
				) : null}

				{paidOff.length > 0 ? (
					<>
						<Text variant="titleSmall" style={[styles.groupHeader, { color: theme.colors.onSurfaceVariant }]}>
							{`Paid off · ${paidOff.length}`}
						</Text>
						<Card padded={false} style={styles.muted}>
							{paidOff.map((l, i) => (
								<LiabilityRow
									key={l.id}
									liability={l}
									subtitle={subtitleFor(l)}
									typeName={typeNameFor(l)}
									paidOff
									divider={i > 0}
									onPress={() => navigation.navigate("LiabilityDetail", { liabilityId: l.id })}
									onLongPress={() => openEdit(l)}
								/>
							))}
						</Card>
					</>
				) : null}
				<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
					Tip: long-press a liability to edit it.
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
			{liabilities.length > 0 ? (
				<AnimatedFAB
					icon="plus"
					label="Add liability"
					extended={fabExtended}
					onPress={openCreate}
					style={styles.fab}
					color={theme.colors.onPrimary}
					theme={{ colors: { primaryContainer: theme.colors.primary } }}
					accessibilityLabel="Add liability"
				/>
			) : null}
			<LiabilityFormSheet
				visible={formVisible}
				onDismiss={() => setFormVisible(false)}
				liabilityTypes={liabilityTypes}
				entities={entities}
				accounts={accounts}
				expenseCategories={expenseCategories}
				liability={editing}
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
		marginTop: spacing.xxl,
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.xs,
	},
	muted: {
		opacity: 0.75,
	},
	row: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
	rowTop: {
		flexDirection: "row",
		alignItems: "center",
	},
	rowBody: {
		flex: 1,
		marginLeft: spacing.md,
	},
	rowRight: {
		alignItems: "flex-end",
		marginLeft: spacing.md,
		flexShrink: 0,
	},
	chevron: {
		marginLeft: spacing.xs,
		marginRight: -spacing.xs,
	},
	progressRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.sm,
		marginLeft: 52,
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

export default LiabilitiesScreen;
