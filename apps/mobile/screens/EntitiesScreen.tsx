import React, { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { AnimatedFAB, IconButton, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Card from "../components/ui/Card";
import ListItem from "../components/ui/ListItem";
import HeroCard from "../components/ui/HeroCard";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import EntityFormSheet, { EntityFormValues } from "../components/EntityFormSheet";
import { EntityAvatar } from "../components/EntityAvatar";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { useCreateEntity } from "../hooks/entity/useCreateEntity";
import { useUpdateEntity } from "../hooks/entity/useUpdateEntity";
import { Entity, RootStackParamList } from "../types";
import { fontFamily, radius, spacing, useKTheme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EntitiesScreen = () => {
	const theme = useKTheme();
	const navigation = useNavigation<Nav>();
	const toast = useToast();
	const { entities, loading, error, refresh, refreshing, pullToRefresh } = useGetEntities();
	const { createEntity } = useCreateEntity();
	const { updateEntity } = useUpdateEntity();
	const [formVisible, setFormVisible] = useState(false);
	const [editing, setEditing] = useState<Entity | null>(null);
	const [query, setQuery] = useState("");
	const [fabExtended, setFabExtended] = useState(true);

	const people = entities.filter((e) => e.is_individual).length;
	const organisations = entities.length - people;

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return [...entities]
			.filter(
				(e) =>
					!q ||
					e.name.toLowerCase().includes(q) ||
					(e.phone_number ?? "").replace(/\s/g, "").includes(q.replace(/\s/g, ""))
			)
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [entities, query]);

	const openCreate = () => {
		setEditing(null);
		setFormVisible(true);
	};

	const handleSubmit = async (values: EntityFormValues) => {
		if (editing) {
			await updateEntity(editing.id, values);
			toast.success("Details updated");
		} else {
			await createEntity({ ...values, created_at: new Date().toISOString() });
			toast.success(`${values.name} added`);
		}
		setFormVisible(false);
	};

	const renderBody = () => {
		if (loading) return <SkeletonList rows={6} />;
		if (error && entities.length === 0) {
			return <EmptyState icon="cloud-alert" tone="error" title="Couldn't load people & organisations" message={error} actionLabel="Try again" onAction={refresh} />;
		}
		if (entities.length === 0) {
			return (
				<EmptyState
					icon="account-group-outline"
					title="No people or organisations yet"
					message="Add the people and organisations you deal with, then link them to transactions, receivables and debts."
					actionLabel="Add someone"
					onAction={openCreate}
				/>
			);
		}
		return (
			<>
				<HeroCard>
					<Text variant="labelLarge" style={{ color: theme.custom.onHeroMuted }}>
						People & organisations
					</Text>
					<Text variant="displaySmall" style={{ color: theme.custom.onHero }}>
						{entities.length}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.custom.onHeroMuted, marginTop: spacing.xs }}>
						{`${people} ${people === 1 ? "person" : "people"}  ·  ${organisations} organisation${organisations === 1 ? "" : "s"}`}
					</Text>
				</HeroCard>

				<View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
					<MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceVariant} />
					<TextInput
						value={query}
						onChangeText={setQuery}
						placeholder="Search by name or phone"
						placeholderTextColor={theme.colors.onSurfaceVariant}
						style={[styles.searchInput, { color: theme.colors.onSurface }]}
						autoCorrect={false}
						accessibilityLabel="Search people and organisations"
					/>
					{query ? (
						<IconButton icon="close-circle" size={18} onPress={() => setQuery("")} style={{ margin: 0 }} accessibilityLabel="Clear search" />
					) : null}
				</View>

				{filtered.length === 0 ? (
					<EmptyState compact icon="account-search-outline" title="No matches" message={`Nobody matches “${query}”.`} />
				) : (
					<Card padded={false}>
						{filtered.map((e, i) => (
							<ListItem
								key={e.id}
								title={e.name}
								subtitle={[e.is_individual ? "Person" : "Organisation", e.phone_number].filter(Boolean).join("  ·  ")}
								left={<EntityAvatar name={e.name} individual={!!e.is_individual} />}
								chevron
								onPress={() => navigation.navigate("EntityDetail", { entityId: e.id })}
								onLongPress={() => {
									setEditing(e);
									setFormVisible(true);
								}}
								style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }}
							/>
						))}
					</Card>
				)}
				<Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
					Tip: long-press someone to edit their details.
				</Text>
			</>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<ScrollView
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
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
			{entities.length > 0 ? (
				<AnimatedFAB
					icon="account-plus-outline"
					label="Add"
					extended={fabExtended}
					onPress={openCreate}
					style={styles.fab}
					color={theme.colors.onPrimary}
					theme={{ colors: { primaryContainer: theme.colors.primary } }}
					accessibilityLabel="Add person or organisation"
				/>
			) : null}
			<EntityFormSheet visible={formVisible} onDismiss={() => setFormVisible(false)} entity={editing} onSubmit={handleSubmit} />
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
	search: {
		flexDirection: "row",
		alignItems: "center",
		height: 46,
		borderRadius: radius.pill,
		borderWidth: StyleSheet.hairlineWidth,
		paddingLeft: spacing.lg,
		paddingRight: spacing.xs,
		marginTop: spacing.lg,
		marginBottom: spacing.md,
	},
	searchInput: {
		flex: 1,
		marginLeft: spacing.sm,
		fontFamily: fontFamily.regular,
		fontSize: 15,
		paddingVertical: 0,
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

export default EntitiesScreen;
