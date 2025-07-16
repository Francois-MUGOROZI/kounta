import React, { useState, useEffect } from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import {
	Text,
	useTheme,
	TextInput,
	Button,
	Portal,
	Dialog,
	ActivityIndicator,
} from "react-native-paper";
// Removed: import { accountRepository } from '../repositories/AccountRepository';
// Removed: import { accountTypeRepository } from '../repositories/AccountTypeRepository';
// Removed: import AccountType from '../models/AccountType';

interface AddAccountModalProps {
	isVisible: boolean;
	onClose: () => void;
	// For now, accountTypes is an array of { id: string, name: string }
	accountTypes: { id: string; name: string }[];
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({
	isVisible,
	onClose,
	accountTypes,
}) => {
	const theme = useTheme();
	const [accountName, setAccountName] = useState("");
	const [selectedAccountType, setSelectedAccountType] = useState<
		{ id: string; name: string } | undefined
	>(undefined);
	const [currency, setCurrency] = useState("");
	const [openingBalance, setOpeningBalance] = useState("");
	const [loading, setLoading] = useState(false);
	const [dialogVisible, setDialogVisible] = useState(false);
	const [dialogMessage, setDialogMessage] = useState("");

	useEffect(() => {
		if (accountTypes.length > 0 && !selectedAccountType) {
			setSelectedAccountType(accountTypes[0]);
		}
	}, [accountTypes, selectedAccountType]);

	const showDialog = (message: string) => {
		setDialogMessage(message);
		setDialogVisible(true);
	};

	const hideDialog = () => setDialogVisible(false);

	// Placeholder for future SQLite integration
	const handleAddAccount = async () => {
		if (!accountName || !selectedAccountType || !currency || !openingBalance) {
			showDialog("Please fill all fields.");
			return;
		}
		setLoading(true);
		try {
			// TODO: Implement SQLite insert logic here
			showDialog(
				"Account added successfully! (SQLite logic not yet implemented)"
			);
			onClose();
			// Clear form
			setAccountName("");
			setCurrency("");
			setOpeningBalance("");
			setSelectedAccountType(accountTypes[0]);
		} catch (error) {
			console.error("Error adding account:", error);
			showDialog("Failed to add account. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Portal>
			<Dialog
				visible={isVisible}
				onDismiss={onClose}
				style={{ backgroundColor: theme.colors.background }}
			>
				<Dialog.Title>Add New Account</Dialog.Title>
				<Dialog.Content>
					<TextInput
						label="Account Name"
						value={accountName}
						onChangeText={setAccountName}
						mode="outlined"
						style={styles.input}
						theme={{
							colors: {
								primary: theme.colors.primary,
							},
						}}
					/>
					{/* Account Type Dropdown - Placeholder for now */}
					<TouchableOpacity
						onPress={() => showDialog("Account type selection coming soon!")}
						style={styles.input}
					>
						<TextInput
							label="Account Type"
							value={selectedAccountType?.name || "Select Type"}
							editable={false}
							mode="outlined"
							right={<TextInput.Icon icon="menu-down" />}
							theme={{
								colors: {
									primary: theme.colors.primary,
								},
							}}
						/>
					</TouchableOpacity>
					<TextInput
						label="Currency (e.g., USD, RWF)"
						value={currency}
						onChangeText={setCurrency}
						mode="outlined"
						style={styles.input}
						theme={{
							colors: {
								primary: theme.colors.primary,
							},
						}}
					/>
					<TextInput
						label="Opening Balance"
						value={openingBalance}
						onChangeText={setOpeningBalance}
						keyboardType="numeric"
						mode="outlined"
						style={styles.input}
						theme={{
							colors: {
								primary: theme.colors.primary,
							},
						}}
					/>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onClose} textColor={theme.colors.error}>
						Cancel
					</Button>
					<Button
						onPress={handleAddAccount}
						loading={loading}
						disabled={loading}
						textColor={theme.colors.primary}
					>
						Add Account
					</Button>
				</Dialog.Actions>
			</Dialog>

			<Dialog
				visible={dialogVisible}
				onDismiss={hideDialog}
				style={{ backgroundColor: theme.colors.background }}
			>
				<Dialog.Title>Alert</Dialog.Title>
				<Dialog.Content>
					<Text>{dialogMessage}</Text>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={hideDialog} textColor={theme.colors.primary}>
						OK
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	input: {
		marginBottom: 10,
	},
});

export default AddAccountModal;
