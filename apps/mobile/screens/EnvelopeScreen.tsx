import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeroCard from "../components/ui/HeroCard";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import EmptyState from "../components/ui/EmptyState";
import AmountText from "../components/ui/AmountText";
import { SegmentedControl } from "../components/ui/fields";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import EnvelopeFormSheet, { EnvelopeFormValues } from "../components/EnvelopeFormSheet";
import EnvelopeTopUpSheet from "../components/EnvelopeTopUpSheet";
import { useGetEnvelopes } from "../hooks/envelope/useGetEnvelope";
import { useCreateEnvelope } from "../hooks/envelope/useCreateEnvelope";
import { useUpdateEnvelope } from "../hooks/envelope/useUpdateEnvelope";
import { useAddToEnvelope } from "../hooks/envelope/useAddToEnvelope";
import { useAccountTotalsByCurrency } from "../hooks/account/useAccountTotalsByCurrency";
import { Envelope, RootStackParamList } from "../types";
import { formatAmount, formatCompactAmount } from "../utils/currency";
import { radius, spacing, useKTheme } from "../theme/theme";
import { envelopeTone } from "../utils/envelope";
import { useActiveCurrency } from "../contexts/PreferencesContext";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EnvelopeScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const toast = useToast();
	const { envelopes, loading, error, refresh, refreshing, pullToRefresh } = useGetEnvelopes();
	const { totals: accountTotals } = useAccountTotalsByCurrency();
	const { createEnvelope } = useCreateEnvelope();
	const { updateEnvelope } = useUpdateEnvelope();
	const { addToEnvelope } = useAddToEnvelope();

	const [formVisible, setFormVisible] = useState(false);
	const [editing, setEditing] = useState<Envelope | null>(null);
	const [topUp, setTopUp] = useState<Envelope | null>(null);
	const [fabExtended, setFabExtended] = useState(true);

	const currencies = useMemo(() => {
		const counts: Record<string, number> = {};
		envelopes.forEach((e) => (counts[e.currency] = (counts[e.currency] ?? 0) + 1));
		return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
	}, [envelopes]);
	const [currency, setCurrency] = useActiveCurrency(currencies);

	const visible = envelopes.filter((e) => e.currency === currency);

	// Same formulas as before the redesign: deficits are added, not netted —
	// an overspent envelope still needs refilling from account balance.
	const summary = useMemo(() => {
		let budgeted = 0;
		let positive = 0;
		let overused = 0;
		visible.forEach((env) => {
			budgeted += env.total_amount || 0;
			if (env.current_balance >= 0) positive += env.current_balance;
			else overused += Math.abs(env.current_balance);
		});
		const grossCommitment = positive + overused;
		const unallocated = (currency ? accountTotals[currency] ?? 0 : 0) - grossCommitment;
		const spentRatio = budgeted > 0 ? (budgeted - (positive - overused)) / budgeted : 0;
		const overuseRate = budgeted > 0 ? (overused / budgeted) * 100 : 0;
		return { budgeted, positive, overused, grossCommitment, unallocated, spentRatio, overuseRate };
	}, [visible, accountTotals, currency]);

	const openCreate = () => {
		setEditing(null);
		setFormVisible(true);
	};

	const handleSubmit = async (values: EnvelopeFormValues) => {
		if (editing) {
			await updateEnvelope(editing.id, values);
			toast.success("Envelope updated");
		} else {
			await createEnvelope({ ...(values as Omit<Envelope, "id">), created_at: new Date().toISOString() });
			toast.success(`${values.name} created`);
		}
		setFormVisible(false);
	};

	const handleTopUp = async (env: Envelope, amount: number) => {
		await addToEnvelope(env.id, amount);
		setTopUp(null);
		toast.success(`Added ${formatAmount(amount, env.currency)} to ${env.name}`);
	};

	const renderBody = () => {
		if (loading) return <SkeletonList rows={5} />;
		if (error && envelopes.length === 0) {
			return <EmptyState icon="cloud-alert" tone="error" title="Couldn't load envelopes" message={error} actionLabel="Try again" onAction={refresh} />;
		}
		if (envelopes.length === 0 || !currency) {
			return (
				<EmptyState
					icon="email-plus-outline"
					title="Give every franc a job"
					message="Envelopes set money aside for a purpose — bills, food, savings. Spend from them when you record an expense."
					actionLabel="Create an envelope"
					onAction={openCreate}
				/>
			);
		}
		const surplus = summary.unallocated >= 0;
		return (
			<>
				{currencies.length > 1 ? (
					<SegmentedControl
						segments={currencies.map((c) => ({ value: c, label: c }))}
						value={currency}
						onChange={setCurrency}
					/>
				) : null}

				<HeroCard>
					<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
						Left to spend
					</Text>
					<AmountText amount={summary.positive} currency={currency} tone="onHero" variant="displaySmall" />
					<ProgressBar
						progress={summary.spentRatio}
						color={theme.custom.onHero}
						trackColor="rgba(255,255,255,0.2)"
						height={6}
						style={{ marginTop: spacing.md }}
					/>
					<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.sm }}>
						{`${Math.round(Math.max(0, summary.spentRatio) * 100)}% of ${formatAmount(summary.budgeted, currency)} used`}
					</Text>
					<View style={[styles.heroStats, { borderTopColor: "rgba(255,255,255,0.16)" }]}>
						<View style={styles.heroStat}>
							<Text variant="labelSmall" style={{ color: theme.custom.onHeroMuted }}>Committed</Text>
							<Text variant="titleSmall" style={{ color: theme.custom.onHero }}>
								{formatCompactAmount(summary.grossCommitment, currency)}
							</Text>
						</View>
						<View style={styles.heroStat}>
							<Text variant="labelSmall" style={{ color: theme.custom.onHeroMuted }}>Overused</Text>
							<Text variant="titleSmall" style={{ color: theme.custom.onHero }}>
								{formatCompactAmount(summary.overused, currency)}
								{summary.overused > 0 ? ` · ${summary.overuseRate.toFixed(1)}%` : ""}
							</Text>
						</View>
					</View>
				</HeroCard>

				{/* Allocation surplus / deficit — label swaps with the sign */}
				<Card style={styles.allocation}>
					<View style={styles.allocationRow}>
						<MaterialCommunityIcons
							name={surplus ? "check-decagram-outline" : "alert-outline"}
							size={22}
							color={surplus ? theme.custom.income : theme.custom.expense}
						/>
						<View style={{ flex: 1, marginLeft: spacing.md }}>
							<View style={styles.rowBetween}>
								<Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
									{surplus ? "Allocation surplus" : "Allocation deficit"}
								</Text>
								<AmountText
									amount={Math.abs(summary.unallocated)}
									currency={currency}
									tone={surplus ? "income" : "expense"}
								/>
							</View>
							<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
								{surplus
									? "Money in your accounts that isn't assigned to an envelope yet."
									: "Your envelopes promise more than your accounts hold."}
							</Text>
						</View>
					</View>
				</Card>

				<Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
					Your envelopes
				</Text>
				{visible.map((env) => {
					const tone = envelopeTone(env);
					const color =
						tone === "expense" ? theme.custom.expense : tone === "warning" ? theme.custom.warning : theme.colors.primary;
					const ratio = env.total_amount > 0 ? env.current_balance / env.total_amount : 0;
					return (
						<Card
							key={env.id}
							style={styles.envelope}
							onPress={() => navigation.navigate("EnvelopeDetail", { envelopeId: env.id })}
							onLongPress={() => {
								setEditing(env);
								setFormVisible(true);
							}}
							accessibilityLabel={`${env.name}, ${formatAmount(env.current_balance, env.currency)} left`}
						>
							<View style={styles.rowBetween}>
								<View style={{ flex: 1 }}>
									<Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
										{env.name}
									</Text>
									{env.purpose ? (
										<Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
											{env.purpose}
										</Text>
									) : null}
								</View>
								<Pressable
									onPress={() => setTopUp(env)}
									hitSlop={8}
									accessibilityRole="button"
									accessibilityLabel={`Top up ${env.name}`}
									style={[styles.topUp, { backgroundColor: theme.colors.primaryContainer }]}
								>
									<MaterialCommunityIcons name="plus" size={18} color={theme.colors.onPrimaryContainer} />
								</Pressable>
							</View>
							<ProgressBar progress={ratio} color={color} style={{ marginTop: spacing.md }} />
							<View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
								<Text variant="labelLarge" style={{ color }}>
									{env.current_balance < 0
										? `${formatAmount(Math.abs(env.current_balance), env.currency)} over`
										: `${formatAmount(env.current_balance, env.currency)} left`}
								</Text>
								<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
									{`of ${formatAmount(env.total_amount, env.currency)}`}
								</Text>
							</View>
						</Card>
					);
				})}
				<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
					Tip: long-press an envelope to rename it.
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
					<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} colors={[theme.colors.primary]} progressBackgroundColor={theme.colors.surface} />
				}
			>
				{renderBody()}
			</ScrollView>
			{envelopes.length > 0 ? (
				<AnimatedFAB
					icon="plus"
					label="New envelope"
					extended={fabExtended}
					onPress={openCreate}
					style={styles.fab}
					color={theme.colors.onPrimary}
					theme={{ colors: { primaryContainer: theme.colors.primary } }}
					accessibilityLabel="New envelope"
				/>
			) : null}
			<EnvelopeFormSheet
				visible={formVisible}
				onDismiss={() => setFormVisible(false)}
				envelope={editing}
				defaultCurrency={currency ?? undefined}
				onSubmit={handleSubmit}
			/>
			<EnvelopeTopUpSheet visible={!!topUp} envelope={topUp} onDismiss={() => setTopUp(null)} onSubmit={handleTopUp} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.lg,
		paddingBottom: 120,
	},
	heroStats: {
		flexDirection: "row",
		marginTop: spacing.lg,
		paddingTop: spacing.md,
		borderTopWidth: 1,
	},
	heroStat: {
		flex: 1,
	},
	allocation: {
		marginTop: spacing.lg,
	},
	allocationRow: {
		flexDirection: "row",
		alignItems: "flex-start",
	},
	rowBetween: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.sm,
	},
	sectionTitle: {
		marginTop: spacing.xxl,
		marginBottom: spacing.sm,
	},
	envelope: {
		marginBottom: spacing.md,
	},
	topUp: {
		width: 32,
		height: 32,
		borderRadius: radius.pill,
		alignItems: "center",
		justifyContent: "center",
	},
	hint: {
		textAlign: "center",
		marginTop: spacing.md,
	},
	fab: {
		position: "absolute",
		right: spacing.lg,
		bottom: spacing.lg,
	},
});

export default EnvelopeScreen;
