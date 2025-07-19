import React, { useState, useMemo } from "react";
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
import { useGetAccounts } from "../hooks/account/useGetAccounts";
import { useCreateAccount } from "../hooks/account/useCreateAccount";
import { useUpdateAccount } from "../hooks/account/useUpdateAccount";
import { useDeleteAccount } from "../hooks/account/useDeleteAccount";
import { useGetAccountTypes } from "../hooks/accountType/useGetAccountTypes";
import AccountListItem from "../components/AccountListItem";
import AccountFormDialog from "../components/AccountFormDialog";
import { Account } from "../types";

const AccountsScreen = () => {
	const theme = useTheme();
	const { accounts, loading, error, refresh } = useGetAccounts();
	const {
		createAccount,
		loading: creating,
		error: createError,
	} = useCreateAccount();
	const {
		updateAccount,
		loading: updating,
		error: updateError,
	} = useUpdateAccount();
	const {
		deleteAccount,
		loading: deleting,
		error: deleteError,
	} = useDeleteAccount();
	const {
		accountTypes,
		loading: loadingTypes,
		error: errorTypes,
	} = useGetAccountTypes();
	const [modalVisible, setModalVisible] = useState(false);
	const [editingAccount, setEditingAccount] = useState<Account | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const openAddModal = () => {
		setEditingAccount(null);
		setModalVisible(true);
	};

	const openEditModal = (account: Account) => {
		setEditingAccount(account);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setEditingAccount(null);
	};

	const handleSubmit = async (data: {
		name: string;
		account_type_id: number;
		currency: string;
		opening_balance: number;
		account_number?: string;
	}) => {
		try {
			if (editingAccount) {
				await updateAccount(editingAccount.id, data);
				setSnackbar({ visible: true, message: "Account updated" });
			} else {
				await createAccount({
					...data,
					current_balance: data.opening_balance,
					created_at: new Date().toISOString(),
				});
				setSnackbar({ visible: true, message: "Account created" });
			}
			closeModal();
			refresh();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving account",
			});
		}
	};

	const handleDelete = (account: Account) => {
		Alert.alert(
			"Delete Account",
			`Are you sure you want to delete "${account.name}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await deleteAccount(account.id);
							setSnackbar({ visible: true, message: "Account deleted" });
							refresh();
						} catch (e: any) {
							setSnackbar({
								visible: true,
								message: e.message || "Error deleting account",
							});
						}
					},
				},
			]
		);
	};

	const getTypeName = (typeId: number) => {
		return accountTypes.find((t) => t.id === typeId)?.name || "";
	};

	// Group accounts by type
	const groupedAccounts = useMemo(() => {
		const groups: { [key: string]: Account[] } = {};
		accounts.forEach((account) => {
			const typeName = getTypeName(account.account_type_id);
			if (!groups[typeName]) {
				groups[typeName] = [];
			}
			groups[typeName].push(account);
		});
		return groups;
	}, [accounts, accountTypes]);

	const flatListData = useMemo(() => {
		const data: Array<{ type: "header" | "item"; content: any }> = [];
		Object.entries(groupedAccounts).forEach(([typeName, accounts]) => {
			data.push({ type: "header", content: typeName });
			accounts.forEach((account) => {
				data.push({ type: "item", content: account });
			});
		});
		return data;
	}, [groupedAccounts]);

	// Calculate total balances by currency
	const totalByCurrency = useMemo(() => {
		const map: { [currency: string]: number } = {};
		accounts.forEach((acc) => {
			if (!map[acc.currency]) map[acc.currency] = 0;
			map[acc.currency] += acc.current_balance || 0;
		});
		return map;
	}, [accounts]);

	const anyLoading =
		loading || creating || updating || deleting || loadingTypes;
	const anyError =
		error || createError || updateError || deleteError || errorTypes;

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
							{cur}: {val.toLocaleString()}
							{idx < Object.entries(totalByCurrency).length - 1 ? " | " : ""}
						</Text>
					))}
				</Text>
			</Surface>
			{anyLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text variant="bodyLarge" style={{ marginTop: 16 }}>
						Loading accounts...
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
							const account = item.content as Account;
							return (
								<AccountListItem
									account={account}
									typeName={getTypeName(account.account_type_id)}
									onEdit={() => openEditModal(account)}
									onDelete={() => handleDelete(account)}
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
								No accounts yet.
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
				accessibilityLabel="Add Account"
			/>
			<AccountFormDialog
				visible={modalVisible}
				onClose={closeModal}
				onSubmit={handleSubmit}
				accountTypes={accountTypes}
				initialAccount={
					editingAccount
						? {
								...editingAccount,
								account_number: editingAccount.account_number || undefined,
						  }
						: null
				}
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

export default AccountsScreen;
