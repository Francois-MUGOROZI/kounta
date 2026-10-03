import React, { useLayoutEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeroCard from "../components/ui/HeroCard";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import IconBadge from "../components/ui/IconBadge";
import AmountText from "../components/ui/AmountText";
import EmptyState from "../components/ui/EmptyState";
import ActionRow from "../components/ui/ActionRow";
import StatGrid from "../components/ui/StatGrid";
import ProgressBar from "../components/ui/ProgressBar";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import TransactionSectionList, { useDescribedTransactions } from "../components/TransactionSectionList";
import LiabilityFormSheet, { LiabilityFormValues } from "../components/LiabilityFormSheet";
import { useQuery } from "../hooks/useQuery";
import { useGetLiabilityTypes } from "../hooks/liabilityType/useGetLiabilityTypes";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useUpdateLiability } from "../hooks/liability/useUpdateLiability";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import { LiabilityRepository } from "../repositories/LiabilityRepository";
import { Liability, RootStackParamList } from "../types";
import { formatAmount } from "../utils/currency";
import { formatShortDate } from "../utils/date";
import { getLiabilityTypeIcon } from "../constants/typeIcons";
import { spacing, useKTheme } from "../theme/theme";
import { repaidRatio } from "../utils/liability";

type Route = RouteProp<RootStackParamList, "LiabilityDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const LiabilityDetailScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { liabilityId } = useRoute<Route>().params;
	const toast = useToast();
	const { openComposer } = useTransactionComposer();
	const { liabilityTypes } = useGetLiabilityTypes();
	const { entities } = useGetEntities();
	const { updateLiability } = useUpdateLiability();
	const [editVisible, setEditVisible] = useState(false);

	const {
		data: liability,
		loading,
		error,
		refresh,
	} = useQuery<Liability | null>(
		(db) => LiabilityRepository.getById(db, liabilityId),
		[liabilityId],
		null,
		"Failed to load liability"
	);
	const filter = useMemo(() => ({ liabilityId }), [liabilityId]);
	const { transactions, loading: loadingTx, refreshing, pullToRefresh } = useGetTransactions(filter);
	const rows = useDescribedTransactions(transactions);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: liability?.name ?? "Liability",
			headerRight: () =>
				liability ? (
					<IconButton icon="pencil-outline" onPress={() => setEditVisible(true)} accessibilityLabel="Edit liability" />
				) : null,
		});
	}, [navigation, liability]);

	if (loading) {
		return (
			<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
				<SkeletonList rows={6} />
			</View>
		);
	}

	if (!liability) {
		return (
			<View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon={error ? "cloud-alert" : "credit-card-clock-outline"}
					tone={error ? "error" : "default"}
					title={error ? "Couldn't load this liability" : "Liability not found"}
					message={error ?? "It may have been removed."}
					actionLabel={error ? "Try again" : undefined}
					onAction={error ? refresh : undefined}
				/>
			</View>
		);
	}

	const typeName = liabilityTypes.find((t) => t.id === liability.liability_type_id)?.name ?? "";
	const entity = liability.entity_id ? entities.find((e) => e.id === liability.entity_id) : undefined;
	const paid = liability.total_amount - liability.current_balance;
	const ratio = repaidRatio(liability);
	const paidOff = liability.current_balance <= 0;

	const handleEdit = async (values: LiabilityFormValues) => {
		await updateLiability(liability.id, values);
		setEditVisible(false);
		toast.success("Liability updated");
	};

	const header = (
		<View>
			<HeroCard>
				<View style={styles.heroTop}>
					<IconBadge
						icon={paidOff ? "check-circle-outline" : getLiabilityTypeIcon(typeName)}
						color={theme.custom.onHero}
						background="rgba(255,255,255,0.16)"
					/>
					<View style={{ flex: 1, marginLeft: spacing.md }}>
						<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
							{typeName || "Liability"}
						</Text>
						<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted }}>
							{paidOff ? "Fully repaid" : "Still owed"}
						</Text>
					</View>
				</View>
				<AmountText
					amount={liability.current_balance}
					currency={liability.currency}
					tone="onHero"
					variant="displaySmall"
					style={{ marginTop: spacing.md }}
				/>
				<ProgressBar
					progress={ratio}
					color={theme.custom.onHero}
					trackColor="rgba(255,255,255,0.18)"
					height={6}
					style={{ marginTop: spacing.md }}
				/>
				<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.sm }}>
					{`${(ratio * 100).toFixed(1)}% repaid · ${formatAmount(paid, liability.currency)} of ${formatAmount(liability.total_amount, liability.currency)}`}
				</Text>
			</HeroCard>

			<ActionRow
				actions={[
					{
						label: "Make payment",
						icon: "cash-check",
						color: theme.custom.income,
						background: theme.custom.incomeContainer,
						disabled: paidOff,
						onPress: () => openComposer({ type: "Expense", liabilityId }),
					},
					{
						label: "Edit",
						icon: "pencil-outline",
						onPress: () => setEditVisible(true),
					},
				]}
			/>

			<StatGrid
				items={[
					{ label: "Borrowed", value: formatAmount(liability.total_amount, liability.currency) },
					{ label: "Repaid", value: formatAmount(paid, liability.currency), tone: "income" },
					{ label: "Remaining", value: formatAmount(liability.current_balance, liability.currency), tone: paidOff ? "muted" : "expense" },
					{ label: "Currency", value: liability.currency },
				]}
			/>

			{entity ? (
				<Card padded={false} style={styles.block}>
					<ListItem
						title={entity.name}
						subtitle="Owed to"
						left={<IconBadge icon={entity.is_individual ? "account-outline" : "domain"} />}
						chevron
						onPress={() => navigation.navigate("EntityDetail", { entityId: entity.id })}
					/>
				</Card>
			) : null}

			{liability.notes ? (
				<Card style={styles.block}>
					<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
						Notes
					</Text>
					<Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: spacing.xs }}>
						{liability.notes}
					</Text>
				</Card>
			) : null}
			<Text variant="bodySmall" style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
				{`Added ${formatShortDate(liability.created_at)}`}
			</Text>
		</View>
	);

	return (
		<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
			<TransactionSectionList
				rows={rows}
				header={header}
				sectionTitle="Payment history"
				refreshing={refreshing}
				onRefresh={pullToRefresh}
				empty={
					loadingTx ? (
						<SkeletonList rows={4} />
					) : (
						<EmptyState
							compact
							icon="cash-check"
							title="No payments yet"
							message="Record a payment and it will reduce what you owe here."
							actionLabel={paidOff ? undefined : "Make a payment"}
							onAction={paidOff ? undefined : () => openComposer({ type: "Expense", liabilityId })}
						/>
					)
				}
			/>
			<LiabilityFormSheet
				visible={editVisible}
				onDismiss={() => setEditVisible(false)}
				liabilityTypes={liabilityTypes}
				entities={entities}
				liability={liability}
				onSubmit={handleEdit}
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
	block: {
		marginTop: spacing.lg,
	},
	meta: {
		marginTop: spacing.md,
		marginLeft: spacing.xs,
	},
});

export default LiabilityDetailScreen;
