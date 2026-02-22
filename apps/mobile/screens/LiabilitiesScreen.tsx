import React, { useState, useMemo } from "react";
import { View, StyleSheet, Alert, FlatList } from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
	Divider,
} from "react-native-paper";
import AppCard from "../components/AppCard";
import { useGetLiabilities } from "../hooks/liability/useGetLiabilities";
import { useCreateLiability } from "../hooks/liability/useCreateLiability";
import { useUpdateLiability } from "../hooks/liability/useUpdateLiability";
import { useDeleteLiability } from "../hooks/liability/useDeleteLiability";
import { useGetLiabilityTypes } from "../hooks/liabilityType/useGetLiabilityTypes";
import LiabilityListItem from "../components/LiabilityListItem";
import LiabilityFormDialog from "../components/LiabilityFormDialog";
import { Liability, RootStackParamList } from "../types";
import { formatAmount } from "../utils/currency";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LiabilitiesScreen = () => {
	const navigation = useNavigation<NavigationProp>();
	const theme = useTheme();
	const { liabilities, loading, error, refresh } = useGetLiabilities();
	const {
		createLiability,
		loading: creating,
		error: createError,
	} = useCreateLiability();
	const {
		updateLiability,
		loading: updating,
		error: updateError,
	} = useUpdateLiability();
	const {
		deleteLiability,
		loading: deleting,
		error: deleteError,
	} = useDeleteLiability();
	const {
		liabilityTypes,
		loading: loadingTypes,
		error: errorTypes,
	} = useGetLiabilityTypes();
	const [modalVisible, setModalVisible] = useState(false);
	const [editingLiability, setEditingLiability] = useState<Liability | null>(
		null
	);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const openAddModal = () => {
		setEditingLiability(null);
		setModalVisible(true);
	};

	const openEditModal = (liability: Liability) => {
		setEditingLiability(liability);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setEditingLiability(null);
	};

	const handleSubmit = async (data: {
		name: string;
		liability_type_id: number;
		currency: string;
		total_amount: number;
		current_balance: number;
		notes?: string;
	}) => {
		try {
			if (editingLiability) {
				await updateLiability(editingLiability.id, data);
				setSnackbar({ visible: true, message: "Liability updated" });
			} else {
				await createLiability({
					...data,
					created_at: new Date().toISOString(),
				});
				setSnackbar({ visible: true, message: "Liability created" });
			}
			closeModal();
			refresh();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving liability",
			});
		}
	};

	const handleDelete = (liability: Liability) => {
		Alert.alert(
			"Delete Liability",
			`Are you sure you want to delete "${liability.name}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await deleteLiability(liability.id);
							setSnackbar({ visible: true, message: "Liability deleted" });
							refresh();
						} catch (e: any) {
							setSnackbar({
								visible: true,
								message: e.message || "Error deleting liability",
							});
						}
					},
				},
			]
		);
	};

	const getTypeName = (typeId: number) => {
		return liabilityTypes.find((t) => t.id === typeId)?.name || "";
	};

	// Group liabilities by currency
	const groupedLiabilities = useMemo(() => {
		const groups: { [key: string]: Liability[] } = {};
		liabilities.forEach((liability) => {
			if (!groups[liability.currency]) {
				groups[liability.currency] = [];
			}
			groups[liability.currency].push(liability);
		});
		return groups;
	}, [liabilities]);

	const flatListData = useMemo(() => {
		const data: Array<{ type: "header" | "item"; content: any }> = [];
		Object.entries(groupedLiabilities).forEach(([currency, liabilities]) => {
			data.push({ type: "header", content: currency });
			liabilities.forEach((liability) => {
				data.push({ type: "item", content: liability });
			});
		});
		return data;
	}, [groupedLiabilities]);

	// Calculate total balances by currency
	const totalByCurrency = useMemo(() => {
		const map: { [currency: string]: number } = {};
		liabilities.forEach((liability) => {
			if (!map[liability.currency]) map[liability.currency] = 0;
			map[liability.currency] += liability.current_balance || 0;
		});
		return map;
	}, [liabilities]);

	const anyLoading =
		loading || creating || updating || deleting || loadingTypes;
	const anyError =
		error || createError || updateError || deleteError || errorTypes;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<AppCard
				title="Total Debt"
				subtitle="Combined across all liabilities"
				style={styles.totalBalanceContainer}
			>
				<Text variant="headlineSmall" style={styles.totalBalanceValue}>
					{Object.entries(totalByCurrency).map(([cur, val], idx) => (
						<Text variant="titleMedium" key={cur} style={{ fontWeight: "bold" }}>
							{formatAmount(val, cur)}
							{idx < Object.entries(totalByCurrency).length - 1 ? " | " : ""}
						</Text>
					))}
				</Text>
			</AppCard>
			{anyLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text variant="bodyLarge" style={{ marginTop: 16 }}>
						Loading liabilities...
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
					data={flatListData}
					keyExtractor={(item, index) =>
						item.type === "header"
							? `header-${item.content}`
							: `item-${item.content.id}-${index}`
					}
					renderItem={({ item }) => {
						if (item.type === "header") {
							return (
								<Text
									variant="titleMedium"
									style={[styles.headerText, { color: theme.colors.primary }]}
								>
									{item.content}
								</Text>
							);
						} else {
							const liability = item.content as Liability;
							return (
								<LiabilityListItem
									liability={liability}
									typeName={getTypeName(liability.liability_type_id)}
									onEdit={() => openEditModal(liability)}
									onDelete={() => handleDelete(liability)}								onPress={() => navigation.navigate("LiabilityDetail", { liabilityId: liability.id })}								/>
							);
						}
					}}
					ListEmptyComponent={
						<View style={styles.centered}>
							<Text
								variant="bodyLarge"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								No liabilities yet.
							</Text>
						</View>
					}
					contentContainerStyle={[
						flatListData.length === 0 ? styles.centered : undefined,
						{ paddingBottom: 80 },
					]}
					ItemSeparatorComponent={() => <Divider />}
				/>
			)}
			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				color={theme.colors.onPrimary}
				onPress={openAddModal}
				accessibilityLabel="Add Liability"
			/>
			<LiabilityFormDialog
				visible={modalVisible}
				onClose={closeModal}
				onSubmit={handleSubmit}
				liabilityTypes={liabilityTypes}
				initialLiability={editingLiability}
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
	container: {
		flex: 1,
		padding: 16,
	},
	fab: {
		position: "absolute",
		right: 16,
		bottom: 24,
	},
	totalBalanceContainer: {
		marginBottom: 16,
	},
	totalBalanceValue: {
		fontWeight: "bold",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	headerText: {
		padding: 16,
		paddingBottom: 8,
		fontWeight: "bold",
	},
});

export default LiabilitiesScreen;
