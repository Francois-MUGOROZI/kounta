import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Card from "../components/ui/Card";
import HeroCard from "../components/ui/HeroCard";
import AmountText from "../components/ui/AmountText";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import ReceivableFormSheet, { ReceivableFormValues } from "../components/ReceivableFormSheet";
import { ReceivableRow } from "../components/ReceivableRow";
import { useGetReceivables } from "../hooks/receivable/useGetReceivables";
import { useCreateReceivable } from "../hooks/receivable/useCreateReceivable";
import { useUpdateReceivable } from "../hooks/receivable/useUpdateReceivable";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { Receivable, ReceivableStatus, RootStackParamList } from "../types";
import { formatCompactAmount } from "../utils/currency";
import { radius, spacing, useKTheme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = ReceivableStatus | "All";

const FILTERS: { value: Filter; label: string }[] = [
	{ value: "All", label: "All" },
	{ value: "Active", label: "Active" },
	{ value: "Pending", label: "Pending" },
	{ value: "Settled", label: "Settled" },
	{ value: "Written-Off", label: "Written off" },
];

// Open items first, then closed ones.
const STATUS_ORDER: Record<ReceivableStatus, number> = {
	Active: 0,
	Pending: 1,
	Settled: 2,
	"Written-Off": 3,
};

const ReceivablesScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const toast = useToast();
	const { receivables, loading, error, refresh, refreshing, pullToRefresh } = useGetReceivables();
	const { entities } = useGetEntities();
	const { createReceivable } = useCreateReceivable();
	const { updateReceivable } = useUpdateReceivable();
	const [filter, setFilter] = useState<Filter>("All");
	const [formVisible, setFormVisible] = useState(false);
	const [editing, setEditing] = useState<Receivable | null>(null);
	const [fabExtended, setFabExtended] = useState(true);

	const entityName = (id: number) => entities.find((e) => e.id === id)?.name ?? "Unknown";

	const counts = useMemo(() => {
		const map: Record<Filter, number> = { All: receivables.length, Active: 0, Pending: 0, Settled: 0, "Written-Off": 0 };
		receivables.forEach((r) => (map[r.status] += 1));
		return map;
	}, [receivables]);

	const visible = useMemo(
		() =>
			receivables
				.filter((r) => filter === "All" || r.status === filter)
				.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
		[receivables, filter]
	);

	// Outstanding = Active balances only, independent of the selected filter.
	const outstanding = useMemo(() => {
		const map: Record<string, number> = {};
		receivables
			.filter((r) => r.status === "Active")
			.forEach((r) => (map[r.currency] = (map[r.currency] ?? 0) + (r.current_balance || 0)));
		return Object.entries(map).sort((a, b) => b[1] - a[1]);
	}, [receivables]);

	// Every receivable ever tracked, by principal.
	const principalTotals = useMemo(() => {
		const map: Record<string, number> = {};
		receivables.forEach((r) => (map[r.currency] = (map[r.currency] ?? 0) + (r.principal || 0)));
		return Object.entries(map);
	}, [receivables]);

	const openCreate = () => {
		setEditing(null);
		setFormVisible(true);
	};

	const handleSubmit = async (values: ReceivableFormValues) => {
		if (editing) {
			await updateReceivable(editing.id, values);
			toast.success("Receivable updated");
		} else {
			await createReceivable({
				...values,
				// The repository sets the starting balance and status from requires_outflow.
				current_balance: 0,
				status: "Pending",
				created_at: new Date().toISOString(),
			});
			toast.success(
				values.requires_outflow
					? "Receivable added — record the lending transfer to activate it"
					: "Receivable added"
			);
		}
		setFormVisible(false);
	};

	const renderBody = () => {
		if (loading) return <SkeletonList rows={6} />;
		if (error && receivables.length === 0) {
			return <EmptyState icon="cloud-alert" tone="error" title="Couldn't load receivables" message={error} actionLabel="Try again" onAction={refresh} />;
		}
		if (receivables.length === 0) {
			return (
				<EmptyState
					icon="hand-coin-outline"
					title="Nobody owes you anything"
					message="Track money you've lent or are waiting to receive — loans, IOUs, deposits, refunds."
					actionLabel="Add receivable"
					onAction={openCreate}
				/>
			);
		}
		const [main, ...others] = outstanding;
		return (
			<>
				<HeroCard>
					<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
						Owed to you
					</Text>
					{main ? (
						<AmountText amount={main[1]} currency={main[0]} tone="onHero" variant="displaySmall" />
					) : (
						<Text variant="displaySmall" style={{ color: theme.custom.onHero }}>
							Nothing
						</Text>
					)}
					<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.xs }}>
						{[
							`${counts.Active} active`,
							...others.map(([cur, v]) => formatCompactAmount(v, cur)),
						].join("  ·  ")}
					</Text>
					<View style={[styles.heroFoot, { borderTopColor: "rgba(255,255,255,0.16)" }]}>
						<Text variant="labelSmall" style={{ color: theme.custom.onHeroMuted }}>
							Tracked in total
						</Text>
						<Text variant="titleSmall" style={{ color: theme.custom.onHero }}>
							{principalTotals.map(([cur, v]) => formatCompactAmount(v, cur)).join("  ·  ")}
						</Text>
					</View>
				</HeroCard>

				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
					{FILTERS.map((f) => {
						const active = filter === f.value;
						const fg = active ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant;
						return (
							<Pressable
								key={f.value}
								onPress={() => setFilter(f.value)}
								accessibilityRole="button"
								accessibilityState={{ selected: active }}
								style={[
									styles.chip,
									{
										backgroundColor: active ? theme.colors.primaryContainer : theme.colors.surface,
										borderColor: active ? theme.colors.primaryContainer : theme.colors.outlineVariant,
									},
								]}
							>
								<Text variant="labelLarge" style={{ color: fg }}>
									{f.label}
								</Text>
								<Text variant="labelMedium" style={{ color: fg, opacity: 0.7 }}>
									{counts[f.value]}
								</Text>
							</Pressable>
						);
					})}
				</ScrollView>

				{visible.length === 0 ? (
					<EmptyState
						compact
						icon="filter-remove-outline"
						title={`No ${FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} receivables`}
						actionLabel="Show all"
						actionIcon="filter-remove-outline"
						onAction={() => setFilter("All")}
					/>
				) : (
					<Card padded={false}>
						{visible.map((r, i) => (
							<ReceivableRow
								key={r.id}
								receivable={r}
								entityName={entityName(r.entity_id)}
								divider={i > 0}
								onPress={() => navigation.navigate("ReceivableDetail", { receivableId: r.id })}
								onLongPress={
									r.status === "Settled" || r.status === "Written-Off"
										? undefined
										: () => {
												setEditing(r);
												setFormVisible(true);
										  }
								}
							/>
						))}
					</Card>
				)}
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
			{receivables.length > 0 ? (
				<AnimatedFAB
					icon="plus"
					label="Add receivable"
					extended={fabExtended}
					onPress={openCreate}
					style={styles.fab}
					color={theme.colors.onPrimary}
					theme={{ colors: { primaryContainer: theme.colors.primary } }}
					accessibilityLabel="Add receivable"
				/>
			) : null}
			<ReceivableFormSheet
				visible={formVisible}
				onDismiss={() => setFormVisible(false)}
				entities={entities}
				receivable={editing}
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
		paddingBottom: 120,
	},
	heroFoot: {
		marginTop: spacing.lg,
		paddingTop: spacing.md,
		borderTopWidth: 1,
	},
	chipsScroll: {
		marginHorizontal: -spacing.lg,
		marginTop: spacing.lg,
		marginBottom: spacing.md,
	},
	chips: {
		paddingHorizontal: spacing.lg,
		gap: spacing.sm,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		height: 36,
		paddingHorizontal: spacing.md,
		borderRadius: radius.pill,
		borderWidth: 1,
	},
	fab: {
		position: "absolute",
		right: spacing.lg,
		bottom: spacing.lg,
		borderRadius: radius.lg,
	},
});

export default ReceivablesScreen;
