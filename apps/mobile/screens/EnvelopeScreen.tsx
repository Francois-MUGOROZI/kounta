import React, { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, Alert, FlatList } from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
	Surface,
	Divider,
} from "react-native-paper";
import { useGetEnvelopes } from "../hooks/envelope/useGetEnvelope";
import { useCreateEnvelope } from "../hooks/envelope/useCreateEnvelope";
import { useUpdateEnvelope } from "../hooks/envelope/useUpdateEnvelope";
import { useDeleteEnvelope } from "../hooks/envelope/useDeleteEnvelope";
import { Envelope } from "../types";
import EnvelopeFormDialog from "@/components/EnvelopeFormDialog";
import EnvelopeListItem from "@/components/EnvelopeListItem";

const EnvelopeScreen = () => {
	const theme = useTheme();
	const { envelopes, loading, error, refresh } = useGetEnvelopes();
	const {
		createEnvelope,
		loading: creating,
		error: createError,
	} = useCreateEnvelope();
	const {
		updateEnvelope,
		loading: updating,
		error: updateError,
	} = useUpdateEnvelope();
	const {
		deleteEnvelope,
		loading: deleting,
		error: deleteError,
	} = useDeleteEnvelope();

	const [modalVisible, setModalVisible] = useState(false);
	const [editingEnvelope, setEditingEnvelope] = useState<Envelope | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const openAddModal = () => {
		setEditingEnvelope(null);
		setModalVisible(true);
	};

	const openEditModal = (envelope: Envelope) => {
		setEditingEnvelope(envelope);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setEditingEnvelope(null);
	};

	const handleSubmit = async (data: Envelope) => {
		try {
			if (editingEnvelope) {
				await updateEnvelope(editingEnvelope.id, data);
				setSnackbar({ visible: true, message: "Envelope updated" });
			} else {
				await createEnvelope({
					...data,
					created_at: new Date().toISOString(),
				});
				setSnackbar({ visible: true, message: "Envelope created" });
			}
			closeModal();
			refresh();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving envelope",
			});
		}
	};

	const handleDelete = (envelope: Envelope) => {
		Alert.alert(
			"Delete Envelope",
			`Are you sure you want to delete "${envelope.name}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await deleteEnvelope(envelope.id);
							setSnackbar({ visible: true, message: "Envelope deleted" });
							refresh();
						} catch (e: any) {
							setSnackbar({
								visible: true,
								message: e.message || "Error deleting envelope",
							});
						}
					},
				},
			]
		);
	};

	const flatListData = useMemo(() => {
		const data: Array<{ type: "header" | "item"; content: Envelope }> = [];
		envelopes.forEach((env) => {
			data.push({ type: "item", content: env });
		});
		return data;
	}, [envelopes]);

	// Calculate total balances by currency
	const totalByCurrency = useMemo(() => {
		const map: {
			[currency: string]: {
				total: number;
				balance: number;
			};
		} = {};
		envelopes.forEach((env) => {
			if (!map[env.currency]) map[env.currency] = { total: 0, balance: 0 };
			map[env.currency].total += env.total_amount || 0;
			map[env.currency].balance += env.current_balance || 0;
		});
		return map;
	}, [envelopes]);

	const anyLoading = loading || creating || updating || deleting;
	const anyError = error || createError || updateError || deleteError;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<Surface style={styles.totalBalanceContainer}>
				<Text variant="titleMedium" style={styles.totalBalanceLabel}>
					Total Balance
				</Text>
				<Text variant="headlineSmall" style={styles.totalBalanceValue}>
					{Object.entries(totalByCurrency).map(([cur, val], idx) => (
						<Text variant="titleSmall" key={cur}>
							{cur}: {val.total.toLocaleString()} |{" "}
							{val.balance.toLocaleString()}
							{idx < Object.entries(totalByCurrency).length - 1 ? " | " : ""}
						</Text>
					))}
				</Text>
			</Surface>
			{anyLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text variant="bodyLarge" style={{ marginTop: 16 }}>
						Loading envelopes...
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
									{item.content.name}
								</Text>
							);
						} else {
							const envelope = item.content as Envelope;
							return (
								<EnvelopeListItem
									envelope={envelope}
									onEdit={() => openEditModal(envelope)}
									onDelete={() => handleDelete(envelope)}
								/>
							);
						}
					}}
					ListEmptyComponent={
						<View style={styles.centered}>
							<Text
								variant="bodyLarge"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								No envelopes yet.
							</Text>
						</View>
					}
					contentContainerStyle={
						flatListData.length === 0 ? styles.centered : undefined
					}
					ItemSeparatorComponent={() => <Divider />}
				/>
			)}
			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				color={theme.colors.onPrimary}
				onPress={openAddModal}
				accessibilityLabel="Add Envelope"
			/>
			<EnvelopeFormDialog
				visible={modalVisible}
				onClose={closeModal}
				onSubmit={handleSubmit}
				initialEnvelope={editingEnvelope ? editingEnvelope : null}
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
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		textAlign: "center",
		marginTop: 32,
	},
	headerContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginTop: 8,
	},
	headerText: {
		fontWeight: "600",
		marginTop: 8,
	},
	totalBalanceContainer: {
		marginBottom: 16,
		padding: 16,
		borderRadius: 12,
		elevation: 2,
	},
	totalBalanceLabel: {
		color: "#888",
		marginBottom: 4,
	},
	totalBalanceValue: {
		fontWeight: "bold",
		fontSize: 24,
	},
});

export default EnvelopeScreen;
