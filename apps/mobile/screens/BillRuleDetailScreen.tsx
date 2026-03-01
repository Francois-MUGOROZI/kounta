import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, FlatList } from "react-native";
import {
	ActivityIndicator,
	Text,
	useTheme,
	IconButton,
	Snackbar,
	Chip,
	Button,
} from "react-native-paper";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { useGetBillRules } from "../hooks/bill/useGetBillRules";
import { useGetBillsByRuleId } from "../hooks/bill/useGetBillsByRuleId";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useUpdateBillRule } from "../hooks/bill/useUpdateBillRule";
import { useUpdateBill } from "../hooks/bill/useUpdateBill";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import AppCard from "../components/AppCard";
import BillRuleForm from "../components/BillRuleForm";
import BillListItem from "../components/BillListItem";
import AppDialog from "../components/AppDialog";
import { formatAmount } from "../utils/currency";
import { format } from "date-fns";

type BillRuleDetailRouteProp = RouteProp<RootStackParamList, "BillRuleDetail">;

const BillRuleDetailScreen = () => {
	const theme = useTheme();
	const route = useRoute<BillRuleDetailRouteProp>();
	const { billRuleId } = route.params;

	const {
		billRules,
		loading: loadingRules,
		error: errorRules,
		refresh: refreshRules,
	} = useGetBillRules();
	const { bills, loading: loadingBills } = useGetBillsByRuleId(billRuleId);
	const { categories } = useGetCategories();
	const { transactionTypes } = useGetTransactionTypes();
	const { updateBillRule } = useUpdateBillRule();
	const { markAsPaid } = useUpdateBill();

	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [confirmPaidVisible, setConfirmPaidVisible] = useState(false);
	const [billToPay, setBillToPay] = useState<number | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const rule = useMemo(() => {
		return billRules.find((r) => r.id === billRuleId) ?? null;
	}, [billRules, billRuleId]);

	const categoryName = useMemo(() => {
		if (!rule) return "";
		return categories.find((c) => c.id === rule.category_id)?.name || "Unknown";
	}, [rule, categories]);

	const getCategoryName = (categoryId: number) => {
		return categories.find((c) => c.id === categoryId)?.name || "Unknown";
	};

	const handleEditSubmit = async (data: any) => {
		try {
			await updateBillRule(billRuleId, data);
			setSnackbar({ visible: true, message: "Bill rule updated" });
			setEditDialogVisible(false);
			refreshRules();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating bill rule",
			});
		}
	};

	const openConfirmPaid = (billId: number) => {
		setBillToPay(billId);
		setConfirmPaidVisible(true);
	};

	const closeConfirmPaid = () => {
		setBillToPay(null);
		setConfirmPaidVisible(false);
	};

	const handleConfirmMarkAsPaid = async () => {
		if (billToPay) {
			try {
				await markAsPaid(billToPay);
				setSnackbar({ visible: true, message: "Bill marked as paid" });
			} catch (e: any) {
				setSnackbar({
					visible: true,
					message: e.message || "Error marking bill as paid",
				});
			} finally {
				closeConfirmPaid();
			}
		}
	};

	const isLoading = loadingRules || loadingBills;

	if (isLoading) {
		return (
			<View
				style={[styles.centered, { backgroundColor: theme.colors.background }]}
			>
				<ActivityIndicator size="large" />
				<Text variant="bodyLarge" style={{ marginTop: 16 }}>
					Loading bill rule...
				</Text>
			</View>
		);
	}

	if (errorRules || !rule) {
		return (
			<View
				style={[styles.centered, { backgroundColor: theme.colors.background }]}
			>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					{errorRules || "Bill rule not found."}
				</Text>
			</View>
		);
	}

	const paidBills = bills.filter((b) => b.status === "Paid");
	const unpaidBills = bills.filter((b) => b.status !== "Paid");
	const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0);

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Summary Card */}
				<AppCard
					title={rule.name}
					subtitle={`${rule.frequency} • ${
						rule.is_active ? "Active" : "Inactive"
					}`}
				>
					<View style={styles.infoRow}>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							Amount
						</Text>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurface, fontWeight: "600" }}
						>
							{formatAmount(rule.amount, rule.currency)}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							Category
						</Text>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurface }}
						>
							{categoryName}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							Currency
						</Text>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurface }}
						>
							{rule.currency}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							Start Date
						</Text>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurface }}
						>
							{format(new Date(rule.start_date), "MMM dd, yyyy")}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Text
							variant="bodyMedium"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							Auto Generate Next
						</Text>
						<Chip
							compact
							style={{
								backgroundColor: rule.auto_next
									? theme.colors.primaryContainer
									: theme.colors.surfaceVariant,
							}}
							textStyle={{ fontSize: 12 }}
						>
							{rule.auto_next ? "Yes" : "No"}
						</Chip>
					</View>

					<View style={[styles.infoRow, styles.summaryRow]}>
						<Text
							variant="bodyMedium"
							style={{
								color: theme.colors.onSurfaceVariant,
								fontWeight: "600",
							}}
						>
							Total Paid
						</Text>
						<Text
							variant="titleMedium"
							style={{ color: theme.colors.primary, fontWeight: "bold" }}
						>
							{formatAmount(totalPaid, rule.currency)}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Text
							variant="bodyMedium"
							style={{
								color: theme.colors.onSurfaceVariant,
								fontWeight: "600",
							}}
						>
							Bills Generated
						</Text>
						<Text
							variant="titleMedium"
							style={{ color: theme.colors.onSurface, fontWeight: "bold" }}
						>
							{bills.length}
						</Text>
					</View>
				</AppCard>

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

				{/* Unpaid Bills Section */}
				{unpaidBills.length > 0 && (
					<>
						<Text
							variant="titleMedium"
							style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
						>
							Unpaid Bills ({unpaidBills.length})
						</Text>
						<FlatList
							data={unpaidBills}
							keyExtractor={(item) => item.id.toString()}
							scrollEnabled={false}
							renderItem={({ item }) => (
								<BillListItem
									bill={item}
									categoryName={getCategoryName(
										item.category_id || rule.category_id
									)}
									onEdit={() => {}}
									onMarkAsPaid={() => openConfirmPaid(item.id)}
								/>
							)}
						/>
					</>
				)}

				{/* Paid Bills Section */}
				<Text
					variant="titleMedium"
					style={[styles.sectionHeader, { color: theme.colors.onSurface }]}
				>
					Payment History ({paidBills.length})
				</Text>

				{paidBills.length === 0 ? (
					<View style={styles.emptyState}>
						<Text
							variant="bodyLarge"
							style={{ color: theme.colors.onSurfaceVariant }}
						>
							No payments recorded yet.
						</Text>
					</View>
				) : (
					<FlatList
						data={paidBills}
						keyExtractor={(item) => item.id.toString()}
						scrollEnabled={false}
						renderItem={({ item }) => (
							<BillListItem
								bill={item}
								categoryName={getCategoryName(
									item.category_id || rule.category_id
								)}
								onEdit={() => {}}
							/>
						)}
					/>
				)}
			</ScrollView>

			<BillRuleForm
				visible={editDialogVisible}
				onClose={() => setEditDialogVisible(false)}
				onSubmit={handleEditSubmit}
				categories={categories}
				transactionTypes={transactionTypes}
				initialBillRule={rule}
			/>

			<AppDialog
				visible={confirmPaidVisible}
				onDismiss={closeConfirmPaid}
				title="Mark as Paid?"
				actions={
					<>
						<Button onPress={closeConfirmPaid}>Cancel</Button>
						<Button mode="contained" onPress={handleConfirmMarkAsPaid}>
							Confirm
						</Button>
					</>
				}
			>
				<Text variant="bodyMedium">
					Are you sure you want to mark this bill as paid? This will record the
					full payment and update your account balance.
				</Text>
			</AppDialog>

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
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 32,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginBottom: 8,
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 6,
	},
	summaryRow: {
		marginTop: 8,
		paddingTop: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "rgba(0,0,0,0.1)",
	},
	sectionHeader: {
		fontWeight: "600",
		marginTop: 8,
		marginBottom: 12,
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 32,
	},
});

export default BillRuleDetailScreen;
