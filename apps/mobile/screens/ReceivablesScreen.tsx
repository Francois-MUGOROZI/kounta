import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
	Chip,
} from "react-native-paper";
import AppCard from "../components/AppCard";
import { useGetReceivables } from "../hooks/receivable/useGetReceivables";
import { useCreateReceivable } from "../hooks/receivable/useCreateReceivable";
import { useUpdateReceivable } from "../hooks/receivable/useUpdateReceivable";
import { useGetEntities } from "../hooks/entity/useGetEntities";
import ReceivableListItem from "../components/ReceivableListItem";
import ReceivableFormDialog from "../components/ReceivableFormDialog";
import {
	Receivable,
	ReceivableStatus,
	ReceivableType,
	RootStackParamList,
} from "../types";
import { formatAmount } from "../utils/currency";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_FILTERS: { label: string; value: ReceivableStatus | "All" }[] = [
	{ label: "All", value: "All" },
	{ label: "Pending", value: "Pending" },
	{ label: "Active", value: "Active" },
	{ label: "Settled", value: "Settled" },
	{ label: "Written Off", value: "Written-Off" },
];

const ReceivablesScreen = () => {
	const navigation = useNavigation<NavigationProp>();
	const theme = useTheme();
	const { receivables, loading, error, refresh } = useGetReceivables();
	const {
		createReceivable,
		loading: creating,
		error: createError,
	} = useCreateReceivable();
	const {
		updateReceivable,
		loading: updating,
		error: updateError,
	} = useUpdateReceivable();
	const { entities } = useGetEntities();
	const [modalVisible, setModalVisible] = useState(false);
	const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(
		null,
	);
	const [statusFilter, setStatusFilter] = useState<ReceivableStatus | "All">(
		"All",
	);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const filteredReceivables = useMemo(() => {
		if (statusFilter === "All") return receivables;
		return receivables.filter((r) => r.status === statusFilter);
	}, [receivables, statusFilter]);

	const getEntityName = (entityId: number) =>
		entities.find((e) => e.id === entityId)?.name ?? "Unknown";

	// Outstanding balance — Active receivables only (stable regardless of filter tab)
	const activeTotalByCurrency = useMemo(() => {
		const map: { [currency: string]: number } = {};
		receivables
			.filter((r) => r.status === "Active")
			.forEach((r) => {
				map[r.currency] = (map[r.currency] ?? 0) + (r.current_balance || 0);
			});
		return map;
	}, [receivables]);

	// All-time principal — every receivable ever created, regardless of status
	const principalTotalByCurrency = useMemo(() => {
		const map: { [currency: string]: number } = {};
		receivables.forEach((r) => {
			map[r.currency] = (map[r.currency] ?? 0) + (r.principal || 0);
		});
		return map;
	}, [receivables]);

	const openAddModal = () => {
		setEditingReceivable(null);
		setModalVisible(true);
	};

	const openEditModal = (receivable: Receivable) => {
		setEditingReceivable(receivable);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setEditingReceivable(null);
	};

	const handleSubmit = async (data: {
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
			} else {
				await createReceivable({
					...data,
					// Repository handles current_balance and status based on requires_outflow
					current_balance: 0,
					status: "Pending",
					due_date: data.due_date ?? null,
					notes: data.notes ?? null,
					created_at: new Date().toISOString(),
				});
				setSnackbar({ visible: true, message: "Receivable created" });
			}
			closeModal();
			refresh();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving receivable",
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
				title="Receivables"
				subtitle="Money owed to you"
				style={styles.headerCard}
			>
				<View style={{ gap: 4 }}>
					<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
						Outstanding (Active)
					</Text>
					<Text variant="titleMedium" style={{ fontWeight: "bold" }}>
						{Object.keys(activeTotalByCurrency).length > 0
							? Object.entries(activeTotalByCurrency).map(([cur, val], idx, arr) => (
								<Text key={cur} variant="titleMedium" style={{ fontWeight: "bold" }}>
									{formatAmount(val, cur)}{idx < arr.length - 1 ? "  |  " : ""}
								</Text>
							))
							: "—"
						}
					</Text>
					<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
						Total Ever Tracked (Principal)
					</Text>
					<Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
						{Object.entries(principalTotalByCurrency).map(([cur, val], idx, arr) => (
							<Text key={cur} variant="bodyMedium">
								{formatAmount(val, cur)}{idx < arr.length - 1 ? "  |  " : ""}
							</Text>
						))}
					</Text>
				</View>
			</AppCard>

			{/* Status Filter Chips */}
			<View style={styles.chipRow}>
				{STATUS_FILTERS.map((sf) => (
					<Chip
						key={sf.value}
						selected={statusFilter === sf.value}
						onPress={() => setStatusFilter(sf.value)}
						style={styles.chip}
					>
						{sf.label}
					</Chip>
				))}
			</View>

			{anyLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text variant="bodyLarge" style={{ marginTop: 16 }}>
						Loading receivables...
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
					data={filteredReceivables}
					keyExtractor={(item) => item.id.toString()}
					renderItem={({ item }) => (
						<ReceivableListItem
							receivable={item}
							entityName={getEntityName(item.entity_id)}
							onEdit={() => openEditModal(item)}
							onPress={() =>
								navigation.navigate("ReceivableDetail", {
									receivableId: item.id,
								})
							}
						/>
					)}
					ListEmptyComponent={
						<View style={styles.centered}>
							<Text
								variant="bodyLarge"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								No receivables found.
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
			<ReceivableFormDialog
				visible={modalVisible}
				onClose={closeModal}
				onSubmit={handleSubmit}
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
	headerCard: { margin: 16, marginBottom: 8 },
	chipRow: {
		flexDirection: "row",
		paddingHorizontal: 16,
		marginBottom: 8,
		gap: 8,
	},
	chip: { marginRight: 4 },
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 32,
	},
	fab: { position: "absolute", margin: 16, right: 0, bottom: 0 },
});

export default ReceivablesScreen;
