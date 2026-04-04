import React, { useState } from "react";
import {
	View,
	StyleSheet,
	FlatList,
	ScrollView,
} from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
	Chip,
	Divider,
	Button,
} from "react-native-paper";
import { useGetBills } from "../hooks/bill/useGetBills";
import { useCreateBill } from "../hooks/bill/useCreateBill";
import { useUpdateBill } from "../hooks/bill/useUpdateBill";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useGetTransactionTypes } from "../hooks/transactionType/useGetTransactionTypes";
import BillForm from "../components/BillForm";
import BillListItem from "../components/BillListItem";
import AppDialog from "../components/AppDialog";
import type { Bill, BillStatus } from "../types";

const BillsScreen = () => {
	const theme = useTheme();
	const [billStatusFilter, setBillStatusFilter] = useState<
		BillStatus | undefined
	>("Pending");

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

	const [billModalVisible, setBillModalVisible] = useState(false);
	const [editingBill, setEditingBill] = useState<Bill | null>(null);
	const [confirmPaidVisible, setConfirmPaidVisible] = useState(false);
	const [billToPay, setBillToPay] = useState<number | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

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

	const anyLoading =
		loadingBills ||
		creatingBill ||
		updatingBill ||
		loadingCategories ||
		loadingTransactionTypes;

	const anyError =
		errorBills ||
		createBillError ||
		updateBillError ||
		errorCategories;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
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
									categoryName={getCategoryName(item.category_id)}
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
				onPress={openAddBillModal}
				accessibilityLabel="Add Bill"
			/>

			<BillForm
				visible={billModalVisible}
				onClose={closeBillModal}
				onSubmit={handleBillSubmit}
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
					Mark this bill as paid. This only updates the bill status — record
					the payment transaction separately in Transactions if needed.
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
