import React, { useLayoutEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeroCard from "../components/ui/HeroCard";
import AmountText from "../components/ui/AmountText";
import ProgressBar from "../components/ui/ProgressBar";
import EmptyState from "../components/ui/EmptyState";
import ActionRow from "../components/ui/ActionRow";
import StatGrid from "../components/ui/StatGrid";
import Card from "../components/ui/Card";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import TransactionSectionList, { useDescribedTransactions } from "../components/TransactionSectionList";
import EnvelopeFormSheet, { EnvelopeFormValues } from "../components/EnvelopeFormSheet";
import EnvelopeTopUpSheet from "../components/EnvelopeTopUpSheet";
import { useQuery } from "../hooks/useQuery";
import { useGetTransactions } from "../hooks/transaction/useGetTransactions";
import { useUpdateEnvelope } from "../hooks/envelope/useUpdateEnvelope";
import { useAddToEnvelope } from "../hooks/envelope/useAddToEnvelope";
import { useTransactionComposer } from "../contexts/TransactionComposer";
import { EnvelopeRepository } from "../repositories/EnvelopeRepository";
import { Envelope, RootStackParamList } from "../types";
import { formatAmount } from "../utils/currency";
import { spacing, useKTheme } from "../theme/theme";
import { envelopeTone } from "../utils/envelope";

type Route = RouteProp<RootStackParamList, "EnvelopeDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const EnvelopeDetailScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const { envelopeId } = useRoute<Route>().params;
	const toast = useToast();
	const { openComposer } = useTransactionComposer();
	const { updateEnvelope } = useUpdateEnvelope();
	const { addToEnvelope } = useAddToEnvelope();
	const [editVisible, setEditVisible] = useState(false);
	const [topUpVisible, setTopUpVisible] = useState(false);

	const { data: envelope, loading, error, refresh } = useQuery<Envelope | null>(
		(db) => EnvelopeRepository.getById(db, envelopeId),
		[envelopeId],
		null,
		"Failed to load envelope"
	);
	const filter = useMemo(() => ({ envelopeId }), [envelopeId]);
	const { transactions, loading: loadingTx, refreshing, pullToRefresh } = useGetTransactions(filter);
	const rows = useDescribedTransactions(transactions);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: envelope?.name ?? "Envelope",
			headerRight: () =>
				envelope ? (
					<IconButton icon="pencil-outline" onPress={() => setEditVisible(true)} accessibilityLabel="Edit envelope" />
				) : null,
		});
	}, [navigation, envelope]);

	if (loading) {
		return (
			<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
				<SkeletonList rows={6} />
			</View>
		);
	}

	if (!envelope) {
		return (
			<View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon={error ? "cloud-alert" : "email-outline"}
					tone={error ? "error" : "default"}
					title={error ? "Couldn't load this envelope" : "Envelope not found"}
					message={error ?? "It may have been removed."}
					actionLabel={error ? "Try again" : undefined}
					onAction={error ? refresh : undefined}
				/>
			</View>
		);
	}

	const spent = envelope.total_amount - envelope.current_balance;
	const usage = envelope.total_amount > 0 ? spent / envelope.total_amount : 0;
	const overspent = envelope.current_balance < 0;
	const tone = envelopeTone(envelope);

	const header = (
		<View>
			<HeroCard>
				<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
					{overspent ? "Overspent by" : "Left to spend"}
				</Text>
				<AmountText
					amount={Math.abs(envelope.current_balance)}
					currency={envelope.currency}
					tone="onHero"
					variant="displaySmall"
				/>
				<ProgressBar
					progress={usage}
					color={overspent ? "#FFB4AB" : theme.custom.onHero}
					trackColor="rgba(255,255,255,0.2)"
					height={6}
					style={{ marginTop: spacing.md }}
				/>
				<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.sm }}>
					{`${(usage * 100).toFixed(1)}% of ${formatAmount(envelope.total_amount, envelope.currency)} used`}
				</Text>
			</HeroCard>

			<ActionRow
				actions={[
					{
						label: "Spend",
						icon: "arrow-top-right",
						color: theme.custom.expense,
						background: theme.custom.expenseContainer,
						onPress: () => openComposer({ type: "Expense", envelopeId }),
					},
					{
						label: "Top up",
						icon: "plus",
						color: theme.colors.onPrimaryContainer,
						background: theme.colors.primaryContainer,
						onPress: () => setTopUpVisible(true),
					},
					{
						label: "Edit",
						icon: "pencil-outline",
						color: theme.colors.onSurfaceVariant,
						background: theme.colors.surfaceVariant,
						onPress: () => setEditVisible(true),
					},
				]}
			/>

			<StatGrid
				items={[
					{ label: "Budget", value: formatAmount(envelope.total_amount, envelope.currency) },
					{ label: "Spent", value: formatAmount(spent, envelope.currency), tone: spent > 0 ? "expense" : "muted" },
					{
						label: "Remaining",
						value: formatAmount(envelope.current_balance, envelope.currency),
						tone: tone === "expense" ? "expense" : tone === "warning" ? "warning" : "income",
					},
					{ label: "Currency", value: envelope.currency },
				]}
			/>

			{envelope.purpose ? (
				<Card style={{ marginTop: spacing.lg }}>
					<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
						Purpose
					</Text>
					<Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
						{envelope.purpose}
					</Text>
				</Card>
			) : null}
		</View>
	);

	const handleEdit = async (values: EnvelopeFormValues) => {
		await updateEnvelope(envelope.id, values);
		setEditVisible(false);
		toast.success("Envelope updated");
	};

	const handleTopUp = async (env: Envelope, amount: number) => {
		await addToEnvelope(env.id, amount);
		setTopUpVisible(false);
		toast.success(`Added ${formatAmount(amount, env.currency)}`);
	};

	return (
		<View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
			<TransactionSectionList
				rows={rows}
				header={header}
				sectionTitle="Spending"
				refreshing={refreshing}
				onRefresh={pullToRefresh}
				empty={
					loadingTx ? (
						<SkeletonList rows={4} />
					) : (
						<EmptyState
							compact
							icon="receipt"
							title="Nothing spent yet"
							message="Expenses you assign to this envelope will appear here."
							actionLabel="Record an expense"
							onAction={() => openComposer({ type: "Expense", envelopeId })}
						/>
					)
				}
			/>
			<EnvelopeFormSheet visible={editVisible} onDismiss={() => setEditVisible(false)} envelope={envelope} onSubmit={handleEdit} />
			<EnvelopeTopUpSheet visible={topUpVisible} envelope={envelope} onDismiss={() => setTopUpVisible(false)} onSubmit={handleTopUp} />
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
});

export default EnvelopeDetailScreen;
