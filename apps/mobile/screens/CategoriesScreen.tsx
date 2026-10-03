import React, { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, Text } from "react-native-paper";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import IconBadge from "../components/ui/IconBadge";
import EmptyState from "../components/ui/EmptyState";
import { SegmentedControl } from "../components/ui/fields";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import CategoryFormSheet, { CategoryFormValues } from "../components/CategoryFormSheet";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useCreateCategory } from "../hooks/category/useCreateCategory";
import { useUpdateCategory } from "../hooks/category/useUpdateCategory";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import { getCategoryIcon } from "../constants/categoryIcons";
import { Category, RootStackParamList } from "../types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { radius, spacing, useKTheme } from "../theme/theme";

type Kind = "Expense" | "Income" | "Transfer";

const CategoriesScreen = () => {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const theme = useKTheme();
	const toast = useToast();
	const { categories, loading, error, refresh, refreshing, pullToRefresh } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();
	const { createCategory } = useCreateCategory();
	const { updateCategory } = useUpdateCategory();
	const [kind, setKind] = useState<Kind>("Expense");
	const [formVisible, setFormVisible] = useState(false);
	const [editing, setEditing] = useState<Category | null>(null);
	const [fabExtended, setFabExtended] = useState(true);

	const typeIdOf = (name: Kind) => transactionTypes.find((t) => t.name === name)?.id;

	const byKind = useMemo(() => {
		const map: Record<Kind, Category[]> = { Expense: [], Income: [], Transfer: [] };
		categories.forEach((c) => {
			const name = transactionTypes.find((t) => t.id === c.transaction_type_id)?.name as Kind | undefined;
			if (name && map[name]) map[name].push(c);
		});
		(Object.keys(map) as Kind[]).forEach((k) => map[k].sort((a, b) => a.name.localeCompare(b.name)));
		return map;
	}, [categories, transactionTypes]);

	// Transfers rarely have categories — only offer the tab when some exist.
	const kinds: Kind[] = byKind.Transfer.length > 0 ? ["Expense", "Income", "Transfer"] : ["Expense", "Income"];
	const list = byKind[kind];

	const openCreate = () => {
		setEditing(null);
		setFormVisible(true);
	};

	const handleSubmit = async (values: CategoryFormValues) => {
		if (editing) {
			await updateCategory(editing.id, values);
			toast.success("Category updated");
		} else {
			await createCategory({ ...values, created_at: new Date().toISOString() });
			toast.success(`${values.name} added`);
		}
		setFormVisible(false);
	};

	const renderBody = () => {
		if (loading) return <SkeletonList rows={8} />;
		if (error && categories.length === 0) {
			return (
				<EmptyState icon="cloud-alert" tone="error" title="Couldn't load categories" message={error} actionLabel="Try again" onAction={refresh} />
			);
		}
		if (list.length === 0) {
			return (
				<EmptyState
					icon="shape-outline"
					title={`No ${kind.toLowerCase()} categories`}
					message="Categories help you see where money comes from and where it goes."
					actionLabel="Add category"
					onAction={openCreate}
				/>
			);
		}
		const tint =
			kind === "Income"
				? { fg: theme.custom.income, bg: theme.custom.incomeContainer }
				: kind === "Transfer"
				? { fg: theme.custom.transfer, bg: theme.custom.transferContainer }
				: { fg: theme.custom.expense, bg: theme.custom.expenseContainer };
		return (
			<>
				<Card padded={false}>
					{list.map((c, i) => (
						<ListItem
							key={c.id}
							title={c.name}
							left={
								<IconBadge
									icon={getCategoryIcon(c.name, kind === "Income" ? "income" : "expense")}
									color={tint.fg}
									background={tint.bg}
								/>
							}
							chevron
							onPress={() => navigation.navigate("CategoryDetail", { categoryId: c.id })}
							onLongPress={() => {
								setEditing(c);
								setFormVisible(true);
							}}
							accessibilityLabel={`${c.name}. Long-press to rename`}
							style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }}
						/>
					))}
				</Card>
				<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
					Tap a category to see its spending; long-press to rename it.
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
				<SegmentedControl<Kind>
					value={kind}
					onChange={setKind}
					segments={kinds.map((k) => ({
						value: k,
						label: `${k} · ${byKind[k].length}`,
						color: k === "Income" ? theme.custom.income : k === "Transfer" ? theme.custom.transfer : theme.custom.expense,
					}))}
				/>
				{renderBody()}
			</ScrollView>
			<AnimatedFAB
				icon="plus"
				label="Add category"
				extended={fabExtended}
				onPress={openCreate}
				style={styles.fab}
				color={theme.colors.onPrimary}
				theme={{ colors: { primaryContainer: theme.colors.primary } }}
				accessibilityLabel="Add category"
			/>
			<CategoryFormSheet
				visible={formVisible}
				onDismiss={() => setFormVisible(false)}
				transactionTypes={transactionTypes}
				defaultTypeId={typeIdOf(kind)}
				category={editing}
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

export default CategoriesScreen;
