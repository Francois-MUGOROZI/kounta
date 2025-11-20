import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
	Portal,
	Dialog,
	TextInput,
	Button,
	HelperText,
	useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { getPopularCurrencyOptions } from "../constants/currencies";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";

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

	// Helper to render dropdown input with app styling
	const renderDropdownInput = (props: any, value: string, label: string) => (
		<TextInput
			{...props}
			value={value}
			label={label}
			dense
			style={{
				backgroundColor: theme.colors.surfaceVariant,
				marginBottom: 8,
				fontSize: 14,
			}}
			mode="outlined"
			theme={{ roundness: 8 }}
			right={<TextInput.Icon icon="chevron-down" />}
			contentStyle={{ paddingVertical: 0 }}
		/>
	);

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialAccount ? "Edit Account" : "Add Account"}
			actions={
				<>
					<Button onPress={onClose} style={{ marginRight: 8 }}>
						Cancel
					</Button>
					<Button mode="contained" onPress={handleSave}>
						Save
					</Button>
				</>
			}
		>
			<AppTextInput
				label="Name"
				value={name}
				onChangeText={setName}
				error={error && !name.trim() ? "Name is required" : undefined}
			/>
			<AppTextInput
				label="Account Number (optional)"
				value={accountNumber}
				onChangeText={setAccountNumber}
			/>

			<Dropdown
				label={"Account Type"}
				value={accountTypeId}
				onSelect={(v) => setAccountTypeId(v ?? "")}
				options={accountTypes.map((type) => ({
					label: type.name,
					value: type.id.toString(),
				}))}
				error={!!error && !accountTypeId}
				CustomMenuHeader={() => null}
				CustomDropdownInput={(props) =>
					renderDropdownInput(props, selectedTypeLabel, "Account Type")
				}
			/>
			<Dropdown
				label={"Currency"}
				value={currency}
				onSelect={(v) => setCurrency(v ?? "")}
				options={getPopularCurrencyOptions()}
				error={!!error && !currency}
				CustomMenuHeader={() => null}
				CustomDropdownInput={(props) =>
					renderDropdownInput(props, currency, "Currency")
				}
			/>
			<AppNumberInput
				label="Opening Balance"
				value={openingBalance}
				onChangeText={setOpeningBalance}
				currency={currency || "RWF"}
				error={
					error && (!openingBalance || isNaN(Number(openingBalance)))
						? "Valid opening balance required"
						: undefined
				}
			/>
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

const styles = StyleSheet.create({
	input: {
		marginBottom: 8,
	},
});

export default AccountFormDialog;
