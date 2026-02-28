import React, { useState } from "react";
import {
	View,
	StyleSheet,
	FlatList,
	ScrollView,
	TouchableOpacity,
} from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
	Chip,
	Surface,
	Divider,
	Button,
} from "react-native-paper";
import { useGetBillRules } from "../hooks/bill/useGetBillRules";
import { useUpdateBillRule } from "../hooks/bill/useUpdateBillRule";
import { useGetBills } from "../hooks/bill/useGetBills";
import { useCreateBill } from "../hooks/bill/useCreateBill";
import { useUpdateBill } from "../hooks/bill/useUpdateBill";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import BillRuleForm from "../components/BillRuleForm";
import BillRuleListItem from "../components/BillRuleListItem";
import BillForm from "../components/BillForm";
import BillListItem from "../components/BillListItem";
import AppDialog from "../components/AppDialog";
import type { Bill, BillRule, BillStatus } from "../types";
import { useCreateBillRule } from "@/hooks/bill/useCreateBillRule";

const BillsScreen = () => {
	const theme = useTheme();
	const [activeTab, setActiveTab] = useState<number>(0);
	const [billStatusFilter, setBillStatusFilter] = useState<
		BillStatus | undefined
	>("Pending");

	const {
		billRules,
		loading: loadingRules,
		error: errorRules,
		refresh: refreshRules,
	} = useGetBillRules();
	const {
		createBillRule,
		loading: creatingRule,
		error: createRuleError,
	} = useCreateBillRule();
	const {
		updateBillRule,
		loading: updatingRule,
		error: updateRuleError,
	} = useUpdateBillRule();

	const {
		bills,
		loading: loadingBills,
		error: errorBills,
		refresh: refreshBills,
	} = useGetBills(billStatusFilter);
	const {
		createBill,
		loading: creatingBill,
		error: createBillError,
	} = useCreateBill();
	const {
		updateBill,
		markAsPaid,
		loading: updatingBill,
		error: updateBillError,
	} = useUpdateBill();

	const {
		categories,
		loading: loadingCategories,
		error: errorCategories,
	} = useGetCategories();

	const { transactionTypes, loading: loadingTransactionTypes } =
		useGetTransactionTypes();

	const [ruleModalVisible, setRuleModalVisible] = useState(false);
	const [billModalVisible, setBillModalVisible] = useState(false);
	const [editingRule, setEditingRule] = useState<BillRule | null>(null);
	const [editingBill, setEditingBill] = useState<Bill | null>(null);
	const [confirmPaidVisible, setConfirmPaidVisible] = useState(false);
	const [billToPay, setBillToPay] = useState<number | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	// Bill Rule handlers
	const openAddRuleModal = () => {
		setEditingRule(null);
		setRuleModalVisible(true);
	};

	const openEditRuleModal = (rule: BillRule) => {
		setEditingRule(rule);
		setRuleModalVisible(true);
	};

	const closeRuleModal = () => {
		setRuleModalVisible(false);
		setEditingRule(null);
	};

	const handleRuleSubmit = async (data: BillRule) => {
		try {
			if (editingRule) {
				await updateBillRule(editingRule.id, data);
				setSnackbar({ visible: true, message: "Bill rule updated" });
			} else {
				await createBillRule(data);
				setSnackbar({ visible: true, message: "Bill rule created" });
			}
			closeRuleModal();
			refreshRules();
			refreshBills();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving bill rule",
			});
		}
	};

	const handleToggleRuleActive = async (id: number, isActive: boolean) => {
		try {
			await updateBillRule(id, { is_active: isActive });
			refreshRules();
			refreshBills();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error updating bill rule",
			});
		}
	};

	// Bill handlers
	const openAddBillModal = () => {
		setEditingBill(null);
		setBillModalVisible(true);
	};

	const openEditBillModal = (bill: Bill) => {
		setEditingBill(bill);
		setBillModalVisible(true);
	};

	const closeBillModal = () => {
		setBillModalVisible(false);
		setEditingBill(null);
	};

	const handleBillSubmit = async (data: Bill) => {
		try {
			if (editingBill) {
				await updateBill(editingBill.id, data);
				setSnackbar({ visible: true, message: "Bill updated" });
			} else {
				await createBill(data);
				setSnackbar({ visible: true, message: "Bill created" });
			}
			closeBillModal();
			refreshBills();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving bill",
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
				refreshBills();
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

	const getCategoryName = (categoryId: number) => {
		return categories.find((c) => c.id === categoryId)?.name || "Unknown";
	};

	const getCategoryIdFromBill = (bill: Bill) => {
		// For one-time bills, use bill.category_id directly
		if (bill.bill_rule_id === null) {
			return bill.category_id;
		}
		// For recurring bills, get category from rule
		return (
			billRules.find((r) => r.id === bill.bill_rule_id)?.category_id ||
			bill.category_id ||
			0
		);
	};

	const anyLoading =
		loadingRules ||
		creatingRule ||
		updatingRule ||
		updatingRule ||
		loadingBills ||
		creatingBill ||
		updatingBill ||
		loadingCategories ||
		loadingTransactionTypes;

	const anyError =
		errorRules ||
		createRuleError ||
		updateRuleError ||
		updateRuleError ||
		errorBills ||
		createBillError ||
		updateBillError ||
		errorCategories;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<Surface style={styles.tabBar} elevation={0}>
				<TouchableOpacity
					style={[
						styles.tab,
						activeTab === 0 && {
							borderBottomColor: theme.colors.primary,
							borderBottomWidth: 2,
						},
					]}
					onPress={() => setActiveTab(0)}
				>
					<Text
						variant="titleMedium"
						style={{
							color:
								activeTab === 0
									? theme.colors.primary
									: theme.colors.onSurfaceVariant,
							fontWeight: activeTab === 0 ? "600" : "normal",
						}}
					>
						Bills
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.tab,
						activeTab === 1 && {
							borderBottomColor: theme.colors.primary,
							borderBottomWidth: 2,
						},
					]}
					onPress={() => setActiveTab(1)}
				>
					<Text
						variant="titleMedium"
						style={{
							color:
								activeTab === 1
									? theme.colors.primary
									: theme.colors.onSurfaceVariant,
							fontWeight: activeTab === 1 ? "600" : "normal",
						}}
					>
						Rules
					</Text>
				</TouchableOpacity>
			</Surface>

			{anyLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text variant="bodyLarge" style={{ marginTop: 16 }}>
						Loading...
					</Text>
				</View>
			) : anyError ? (
				<View style={styles.centered}>
					<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
						{anyError}
					</Text>
				</View>
			) : activeTab === 1 ? (
				<View style={{ flex: 1 }}>
					{billRules.length === 0 ? (
						<View style={styles.centered}>
							<Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
								No bill rules yet. Tap + to add one.
							</Text>
						</View>
					) : (
						<FlatList
							data={billRules}
							keyExtractor={(item) => item.id.toString()}
							renderItem={({ item }) => (
								<BillRuleListItem
									billRule={item}
									categoryName={getCategoryName(item.category_id)}
									onEdit={() => openEditRuleModal(item)}
									onToggleActive={(isActive: boolean) =>
										handleToggleRuleActive(item.id, isActive)
									}
								/>
							)}
							contentContainerStyle={{ paddingBottom: 80 }}
							ItemSeparatorComponent={() => <Divider />}
						/>
					)}
				</View>
			) : (
				<View style={{ flex: 1 }}>
					<View style={styles.filterContainer}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.filterScroll}
						>
							<Chip
								selected={billStatusFilter === "Pending"}
								onPress={() => setBillStatusFilter("Pending")}
								style={styles.filterChip}
							>
								Pending
							</Chip>
							<Chip
								selected={billStatusFilter === "Overdue"}
								onPress={() => setBillStatusFilter("Overdue")}
								style={styles.filterChip}
							>
								Overdue
							</Chip>
							<Chip
								selected={billStatusFilter === "Paid"}
								onPress={() => setBillStatusFilter("Paid")}
								style={styles.filterChip}
							>
								Paid
							</Chip>
							<Chip
								selected={billStatusFilter === undefined}
								onPress={() => setBillStatusFilter(undefined)}
								style={styles.filterChip}
							>
								All
							</Chip>
						</ScrollView>
					</View>
					{bills.length === 0 ? (
						<View style={styles.centered}>
							<Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
								No bills found.
							</Text>
						</View>
					) : (
						<FlatList
							data={bills}
							keyExtractor={(item) => item.id.toString()}
							renderItem={({ item }) => (
								<BillListItem
									bill={item}
									categoryName={getCategoryName(getCategoryIdFromBill(item))}
									onEdit={() => openEditBillModal(item)}
									onMarkAsPaid={() => openConfirmPaid(item.id)}
								/>
							)}
							contentContainerStyle={{ paddingBottom: 80 }}
							ItemSeparatorComponent={() => <Divider />}
						/>
					)}
				</View>
			)}

			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				color={theme.colors.onPrimary}
				onPress={activeTab === 1 ? openAddRuleModal : openAddBillModal}
				accessibilityLabel={activeTab === 1 ? "Add Bill Rule" : "Add Bill"}
			/>

			<BillRuleForm
				visible={ruleModalVisible}
				onClose={closeRuleModal}
				onSubmit={handleRuleSubmit}
				categories={categories}
				transactionTypes={transactionTypes}
				initialBillRule={editingRule}
			/>

			<BillForm
				visible={billModalVisible}
				onClose={closeBillModal}
				onSubmit={handleBillSubmit}
				billRules={billRules.filter((r) => r.is_active)}
				categories={categories}
				transactionTypes={transactionTypes}
				initialBill={editingBill}
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
		padding: 16,
	},
	tabBar: {
		flexDirection: "row",
		marginBottom: 16,
		backgroundColor: "transparent",
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	filterContainer: {
		marginBottom: 16,
	},
	filterScroll: {
		gap: 8,
	},
	filterChip: {
		marginRight: 0,
		paddingVertical: 0,
	},
	statusFilter: {
		marginBottom: 16,
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
	},
});

export default BillsScreen;
