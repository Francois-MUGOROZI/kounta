import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
	Portal,
	Dialog,
	TextInput,
	Button,
	HelperText,
	Text,
	useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { getPopularCurrencyOptions } from "../constants/currencies";

interface AccountFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: {
		name: string;
		account_number?: string;
		account_type_id: number;
		currency: string;
		opening_balance: number;
	}) => void;
	accountTypes: { id: number; name: string }[];
	initialAccount?: {
		id?: number;
		name: string;
		account_number?: string;
		account_type_id: number;
		currency: string;
		opening_balance: number;
	} | null;
}

const AccountFormDialog: React.FC<AccountFormDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	accountTypes,
	initialAccount,
}) => {
	const theme = useTheme();
	const [name, setName] = useState("");
	const [accountNumber, setAccountNumber] = useState("");
	const [accountTypeId, setAccountTypeId] = useState<string>("");
	const [currency, setCurrency] = useState("");
	const [openingBalance, setOpeningBalance] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialAccount) {
			setName(initialAccount.name);
			setAccountNumber(initialAccount.account_number || "");
			setAccountTypeId(initialAccount.account_type_id.toString());
			setCurrency(initialAccount.currency);
			setOpeningBalance(initialAccount.opening_balance.toString());
		} else {
			setName("");
			setAccountNumber("");
			setAccountTypeId(accountTypes[0]?.id?.toString() ?? "");
			setCurrency("");
			setOpeningBalance("");
		}
		setError("");
	}, [visible, initialAccount, accountTypes]);

	const handleSave = () => {
		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		if (!accountTypeId) {
			setError("Type is required");
			return;
		}
		if (!currency.trim()) {
			setError("Currency is required");
			return;
		}
		if (!openingBalance || isNaN(Number(openingBalance))) {
			setError("Opening balance must be a number");
			return;
		}
		onSubmit({
			name: name.trim(),
			account_number: accountNumber.trim() || undefined,
			account_type_id: Number(accountTypeId),
			currency: currency.trim().toUpperCase(),
			opening_balance: Number(openingBalance),
		});
	};

	const selectedTypeLabel =
		accountTypes.find((type) => type.id.toString() === accountTypeId)?.name ||
		"";

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onClose}>
				<Dialog.Title>
					{initialAccount ? "Edit Account" : "Add Account"}
				</Dialog.Title>
				<Dialog.Content
					style={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<TextInput
						label="Name"
						value={name}
						onChangeText={setName}
						style={styles.input}
						autoFocus
					/>
					<TextInput
						label="Account Number (optional)"
						value={accountNumber}
						onChangeText={setAccountNumber}
						style={styles.input}
					/>

					<Dropdown
						label={"Account Type"}
						value={accountTypeId}
						onSelect={(v) => setAccountTypeId(v ?? "")}
						options={accountTypes.map((type) => ({
							label: type.name,
							value: type.id.toString(),
						}))}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								style={{
									backgroundColor: theme.colors.outlineVariant,
									marginBottom: 8,
								}}
								value={selectedTypeLabel}
							/>
						)}
					/>
					<Dropdown
						label={"Currency"}
						value={currency}
						onSelect={(v) => setCurrency(v ?? "")}
						options={getPopularCurrencyOptions()}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								style={{
									backgroundColor: theme.colors.outlineVariant,
									marginBottom: 8,
								}}
								autoCapitalize="characters"
								value={currency}
							/>
						)}
					/>
					<TextInput
						label="Opening Balance"
						value={openingBalance}
						onChangeText={setOpeningBalance}
						style={styles.input}
						keyboardType="numeric"
					/>
					<HelperText type="error" visible={!!error}>
						{error}
					</HelperText>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onClose}>Cancel</Button>
					<Button mode="contained" onPress={handleSave}>
						Save
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	input: {
		marginBottom: 8,
	},
});

export default AccountFormDialog;
