import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
} from "react-native-paper";
import AppCard from "../components/AppCard";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { useCreateEntity } from "../hooks/entity/useCreateEntity";
import { useUpdateEntity } from "../hooks/entity/useUpdateEntity";
import EntityListItem from "../components/EntityListItem";
import EntityFormDialog from "../components/EntityFormDialog";
import { Entity, RootStackParamList } from "../types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EntitiesScreen = () => {
	const navigation = useNavigation<NavigationProp>();
	const theme = useTheme();
	const { entities, loading, error, refresh } = useGetEntities();
	const {
		createEntity,
		loading: creating,
		error: createError,
	} = useCreateEntity();
	const {
		updateEntity,
		loading: updating,
		error: updateError,
	} = useUpdateEntity();
	const [modalVisible, setModalVisible] = useState(false);
	const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const openAddModal = () => {
		setEditingEntity(null);
		setModalVisible(true);
	};

	const openEditModal = (entity: Entity) => {
		setEditingEntity(entity);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setEditingEntity(null);
	};

	const handleSubmit = async (data: {
		name: string;
		phone_number?: string;
		is_individual: boolean;
		metadata?: string;
	}) => {
		try {
			if (editingEntity) {
				await updateEntity(editingEntity.id, data);
				setSnackbar({ visible: true, message: "Entity updated" });
			} else {
				await createEntity({
					...data,
					phone_number: data.phone_number ?? null,
					metadata: data.metadata ?? null,
					created_at: new Date().toISOString(),
				});
				setSnackbar({ visible: true, message: "Entity created" });
			}
			closeModal();
			refresh();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving entity",
			});
		}
	};

	const anyLoading = loading || creating || updating;
	const anyError = error || createError || updateError;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<AppCard
				title="Entities"
				subtitle="People and organizations"
				style={styles.headerCard}
			>
				<Text variant="titleMedium" style={{ fontWeight: "bold" }}>
					{entities.length} {entities.length === 1 ? "entity" : "entities"}
				</Text>
			</AppCard>
			{anyLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text variant="bodyLarge" style={{ marginTop: 16 }}>
						Loading entities...
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
					data={entities}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<EntityListItem
							entity={item}
							onEdit={() => openEditModal(item)}
							onPress={() =>
								navigation.navigate("EntityDetail", { entityId: item.id })
							}
						/>
					)}
					ListEmptyComponent={
						<View style={styles.centered}>
							<Text
								variant="bodyLarge"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								No entities yet. Add one to get started.
							</Text>
						</View>
					}
					contentContainerStyle={{ paddingHorizontal: 16 }}
				/>
			)}
			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				onPress={openAddModal}
				color={theme.colors.onPrimary}
			/>
			<EntityFormDialog
				visible={modalVisible}
				onClose={closeModal}
				onSubmit={handleSubmit}
				initialEntity={editingEntity}
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
	container: { flex: 1 },
	headerCard: { margin: 16, marginBottom: 8 },
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 32,
	},
	fab: { position: "absolute", margin: 16, right: 0, bottom: 0 },
});

export default EntitiesScreen;
