import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
	Divider,
} from "react-native-paper";
import AppCard from "../components/AppCard";
import { useGetEnvelopes } from "../hooks/envelope/useGetEnvelope";
import { useCreateEnvelope } from "../hooks/envelope/useCreateEnvelope";
import { useUpdateEnvelope } from "../hooks/envelope/useUpdateEnvelope";
import { useAccountTotalsByCurrency } from "../hooks/account/useAccountTotalsByCurrency";
import { Envelope, RootStackParamList } from "../types";
import EnvelopeFormDialog from "@/components/EnvelopeFormDialog";
import EnvelopeListItem from "@/components/EnvelopeListItem";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { formatAmount } from "../utils/currency";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EnvelopeScreen = () => {
	const navigation = useNavigation<NavigationProp>();
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
	const { totals: accountTotals } = useAccountTotalsByCurrency();

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

	// Calculate envelope summary by currency
	const summaryByCurrency = useMemo(() => {
		const map: {
			[currency: string]: {
				totalBudgeted: number; // sum of all total_amount (overall allocation)
				netBalance: number; // sum of all current_balance
				allocated: number; // sum of positive current_balance
				overused: number; // sum of abs(negative current_balance)
			};
		} = {};
		envelopes.forEach((env) => {
			if (!map[env.currency])
				map[env.currency] = {
					totalBudgeted: 0,
					netBalance: 0,
					allocated: 0,
					overused: 0,
				};
			map[env.currency].totalBudgeted += env.total_amount || 0;
			map[env.currency].netBalance += env.current_balance || 0;
			if (env.current_balance >= 0) {
				map[env.currency].allocated += env.current_balance;
			} else {
				map[env.currency].overused += Math.abs(env.current_balance);
			}
		});
		return map;
	}, [envelopes]);

	const anyLoading = loading || creating || updating;
	const anyError = error || createError || updateError;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			{/* Envelope Summary Card */}
			<AppCard title="Envelope Summary" style={styles.summaryCard}>
				{Object.entries(summaryByCurrency).map(([cur, val]) => {
					const accountBalance = accountTotals[cur] || 0;
					const unallocated = accountBalance - val.netBalance;
					const overuseRate =
						val.totalBudgeted > 0
							? ((val.overused / val.totalBudgeted) * 100).toFixed(1)
							: "0";

					return (
						<View key={cur} style={styles.currencySummary}>
							{Object.keys(summaryByCurrency).length > 1 && (
								<Text
									variant="labelLarge"
									style={{
										fontWeight: "bold",
										marginBottom: 4,
										color: theme.colors.onSurface,
									}}
								>
									{cur}
								</Text>
							)}
							<View style={styles.summaryRow}>
								<Text
									variant="bodyMedium"
									style={{ color: theme.colors.onSurfaceVariant }}
								>
									Overall Allocation
								</Text>
								<Text
									variant="bodyMedium"
									style={{ fontWeight: "bold", color: theme.colors.onSurface }}
								>
									{formatAmount(val.totalBudgeted, cur)}
								</Text>
							</View>
							<View style={styles.summaryRow}>
								<Text
									variant="bodyMedium"
									style={{ color: theme.colors.onSurfaceVariant }}
								>
									Current Balance (+)
								</Text>
								<Text
									variant="bodyMedium"
									style={{
										fontWeight: "600",
										color:
											val.netBalance < 0
												? theme.colors.error
												: theme.colors.primary,
									}}
								>
									{formatAmount(val.netBalance, cur)}
								</Text>
							</View>
							<Divider style={{ marginVertical: 6 }} />
							<View style={styles.summaryRow}>
								<Text
									variant="bodyMedium"
									style={{ color: theme.colors.onSurfaceVariant }}
								>
									Allocated
								</Text>
								<Text
									variant="bodyMedium"
									style={{
										fontWeight: "600",
										color: theme.colors.primary,
									}}
								>
									{formatAmount(val.allocated, cur)}
								</Text>
							</View>
							{val.overused > 0 && (
								<View style={styles.summaryRow}>
									<Text
										variant="bodyMedium"
										style={{ color: theme.colors.onSurfaceVariant }}
									>
										Overused
									</Text>
									<Text
										variant="bodyMedium"
										style={{
											fontWeight: "600",
											color: theme.colors.error,
										}}
									>
										{formatAmount(val.overused, cur)}
									</Text>
								</View>
							)}
							<Divider style={{ marginVertical: 6 }} />
							<View style={styles.summaryRow}>
								<Text
									variant="bodyMedium"
									style={{
										color: theme.colors.onSurfaceVariant,
										fontWeight: "600",
									}}
								>
									Unallocated
								</Text>
								<Text
									variant="bodyMedium"
									style={{
										fontWeight: "bold",
										color:
											unallocated < 0
												? theme.colors.error
												: theme.colors.primary,
									}}
								>
									{formatAmount(unallocated, cur)}
								</Text>
							</View>
							{val.overused > 0 && (
								<View style={styles.summaryRow}>
									<Text
										variant="bodySmall"
										style={{ color: theme.colors.onSurfaceVariant }}
									>
										Overuse Rate
									</Text>
									<Text
										variant="bodySmall"
										style={{
											fontWeight: "600",
											color: theme.colors.error,
										}}
									>
										{overuseRate}%
									</Text>
								</View>
							)}
						</View>
					);
				})}
				{Object.keys(summaryByCurrency).length === 0 && (
					<Text
						variant="bodyMedium"
						style={{ color: theme.colors.onSurfaceVariant }}
					>
						No envelopes yet
					</Text>
				)}
			</AppCard>

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
					data={envelopes}
					keyExtractor={(item) => `item-${item.id}`}
					renderItem={({ item }) => (
						<EnvelopeListItem
							envelope={item}
							onEdit={() => openEditModal(item)}
							onPress={() =>
								navigation.navigate("EnvelopeDetail", {
									envelopeId: item.id,
								})
							}
							onEnvelopeUpdated={refresh}
						/>
					)}
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
					contentContainerStyle={[
						envelopes.length === 0 ? styles.centered : undefined,
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
	summaryCard: {
		marginBottom: 16,
	},
	currencySummary: {
		marginBottom: 8,
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 3,
	},
});

export default EnvelopeScreen;
