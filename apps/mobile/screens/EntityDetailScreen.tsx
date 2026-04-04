import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
	ActivityIndicator,
	Text,
	useTheme,
	IconButton,
	Snackbar,
	Divider,
} from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AppCard from "../components/AppCard";
import ReceivableListItem from "../components/ReceivableListItem";
import EntityFormDialog from "../components/EntityFormDialog";
import ReceivableFormDialog from "../components/ReceivableFormDialog";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import { useUpdateEntity } from "../hooks/entity/useUpdateEntity";
import { useGetReceivablesByEntityId } from "../hooks/receivable/useGetReceivablesByEntityId";
import { useUpdateReceivable } from "../hooks/receivable/useUpdateReceivable";
import { useGetLiabilities } from "../hooks/liability/useGetLiabilities";
import { formatAmount } from "../utils/currency";
import { RootStackParamList, Receivable, ReceivableType } from "../types";

type EntityDetailRouteProp = RouteProp<RootStackParamList, "EntityDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EntityDetailScreen = () => {
	const theme = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<EntityDetailRouteProp>();
	const { entityId } = route.params;

	const {
		entities,
		loading: loadingEntities,
		refresh: refreshEntities,
	} = useGetEntities();
	const { updateEntity } = useUpdateEntity();
	const { receivables, loading: loadingReceivables } =
		useGetReceivablesByEntityId(entityId);
	const { updateReceivable } = useUpdateReceivable();
	const { liabilities, loading: loadingLiabilities } = useGetLiabilities();

	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const entity = useMemo(
		() => entities.find((e) => e.id === entityId) ?? null,
		[entities, entityId],
	);

	// Filter liabilities linked to this entity
	const entityLiabilities = useMemo(
		() => liabilities.filter((l) => l.entity_id === entityId),
		[liabilities, entityId],
	);

	// Net position by currency
	const netPosition = useMemo(() => {
		const positions: {
			[currency: string]: { receivable: number; liability: number };
		} = {};
		receivables.forEach((r) => {
			if (r.status === "Active") {
				if (!positions[r.currency])
					positions[r.currency] = { receivable: 0, liability: 0 };
				positions[r.currency].receivable += r.current_balance;
			}
		});
		entityLiabilities.forEach((l) => {
			if (!positions[l.currency])
				positions[l.currency] = { receivable: 0, liability: 0 };
			positions[l.currency].liability += l.current_balance;
		});
		return positions;
	}, [receivables, entityLiabilities]);

	const handleEditSubmit = async (data: {
		name: string;
		phone_number?: string;
		is_individual: boolean;
		id_number?: string;
		metadata?: string;
	}) => {
		try {
			await updateEntity(entityId, {
				...data,
				phone_number: data.phone_number ?? null,
				id_number: data.id_number ?? null,
				metadata: data.metadata ?? null,
			});
			setSnackbar({ visible: true, message: "Entity updated" });
			setEditDialogVisible(false);
			refreshEntities();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating entity",
			});
		}
	};

	const handleReceivableEdit = (receivable: Receivable) => {
		setEditingReceivable(receivable);
	};

	const handleReceivableSubmit = async (data: {
		entity_id: number;
		title: string;
		type: ReceivableType;
		currency: string;
		principal: number;
		interest_rate: number;
		requires_outflow: boolean;
		due_date?: string;
		notes?: string;
	}) => {
		try {
			if (editingReceivable) {
				await updateReceivable(editingReceivable.id, data);
				setSnackbar({ visible: true, message: "Receivable updated" });
				setEditingReceivable(null);
			}
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating receivable",
			});
		}
	};

	const isLoading = loadingEntities || loadingReceivables || loadingLiabilities;

	if (isLoading) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<ActivityIndicator size="large" />
				<Text variant="bodyLarge" style={{ marginTop: 16 }}>
					Loading entity details...
				</Text>
			</View>
		);
	}

	if (!entity) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					Entity not found.
				</Text>
			</View>
		);
	}

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Entity Info Card */}
				<AppCard
					title={entity.name}
					subtitle={entity.is_individual ? "Individual" : "Organization"}
				>
					{entity.phone_number ? (
						<Text variant="bodyMedium" style={{ marginBottom: 8 }}>
							Phone: {entity.phone_number}
						</Text>
					) : null}
					{entity.id_number ? (
						<Text variant="bodyMedium" style={{ marginBottom: 8 }}>
							{entity.is_individual ? "ID" : "TIN/Reg"}: {entity.id_number}
						</Text>
					) : null}
					{entity.metadata ? (
						<Text
							variant="bodySmall"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							{entity.metadata}
						</Text>
					) : null}
					<Divider style={styles.divider} />
					<Text
						variant="bodySmall"
						style={{ color: theme.colors.onSurfaceVariant }}
					>
						Created: {new Date(entity.created_at).toLocaleDateString()}
					</Text>
				</AppCard>

				{/* Net Position Card */}
				{Object.keys(netPosition).length > 0 && (
					<AppCard title="Net Position" style={{ marginTop: 12 }}>
						{Object.entries(netPosition).map(([cur, pos]) => (
							<View key={cur} style={styles.row}>
								<Text variant="bodyMedium">{cur}</Text>
								<Text
									variant="titleSmall"
									style={{
										fontWeight: "bold",
										color:
											pos.receivable - pos.liability >= 0
												? theme.colors.primary
												: theme.colors.error,
									}}
								>
									{formatAmount(pos.receivable - pos.liability, cur)}
								</Text>
							</View>
						))}
					</AppCard>
				)}

				{/* Edit Button */}
				<View style={styles.actionsRow}>
					<IconButton
						icon="pencil"
						mode="contained"
						onPress={() => setEditDialogVisible(true)}
						iconColor={theme.colors.primary}
						containerColor={theme.colors.elevation.level3}
					/>
				</View>

				{/* Receivables Section */}
				<Text
					variant="titleMedium"
					style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
				>
					Receivables
				</Text>
				{receivables.length === 0 ? (
					<View style={styles.emptyState}>
						<Text
							variant="bodyLarge"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							No receivables for this entity.
						</Text>
					</View>
				) : (
					receivables.map((receivable) => (
						<ReceivableListItem
							key={receivable.id}
							receivable={receivable}
							entityName={entity.name}
							onEdit={() => handleReceivableEdit(receivable)}
							onPress={() =>
								navigation.navigate("ReceivableDetail", {
									receivableId: receivable.id,
								})
							}
						/>
					))
				)}

				{/* Liabilities Section */}
				{entityLiabilities.length > 0 && (
					<>
						<Text
							variant="titleMedium"
							style={[
								styles.sectionTitle,
								{ color: theme.colors.onSurface, marginTop: 16 },
							]}
						>
							Liabilities
						</Text>
						{entityLiabilities.map((liability) => (
							<View
								key={liability.id}
								style={[
									styles.liabilityItem,
									{ backgroundColor: theme.colors.surface },
								]}
							>
								<Text variant="titleSmall" style={{ fontWeight: "600" }}>
									{liability.name}
								</Text>
								<Text variant="bodySmall" style={{ color: theme.colors.error }}>
									{formatAmount(liability.current_balance, liability.currency)}
								</Text>
							</View>
						))}
					</>
				)}
			</ScrollView>

			<EntityFormDialog
				visible={editDialogVisible}
				onClose={() => setEditDialogVisible(false)}
				onSubmit={handleEditSubmit}
				initialEntity={entity}
			/>

			<ReceivableFormDialog
				visible={!!editingReceivable}
				onClose={() => setEditingReceivable(null)}
				onSubmit={handleReceivableSubmit}
				entities={entities}
				initialReceivable={editingReceivable}
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
	scrollContent: { padding: 16, paddingBottom: 32 },
	centered: { justifyContent: "center", alignItems: "center" },
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	divider: { marginVertical: 12 },
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginBottom: 8,
	},
	sectionTitle: { fontWeight: "bold", marginBottom: 12 },
	emptyState: { paddingVertical: 32, alignItems: "center" },
	liabilityItem: {
		padding: 16,
		borderRadius: 8,
		marginBottom: 4,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
});

export default EntityDetailScreen;
