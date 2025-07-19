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
import { Transaction } from "../types";

interface TransactionFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: {
		description: string;
		amount: number;
		transaction_type_id: number;
		account_id: number;
		category_id: number;
		date: string;
		asset_id?: number | null;
		liability_id?: number | null;
	}) => void;
	transactionTypes: { id: number; name: string }[];
	accounts: { id: number; name: string }[];
	categories: { id: number; name: string }[];
	assets: { id: number; name: string }[];
	liabilities: { id: number; name: string }[];
	initialTransaction?: Transaction | null;
}

const TransactionFormDialog: React.FC<TransactionFormDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	transactionTypes,
	accounts,
	categories,
	assets,
	liabilities,
	initialTransaction,
}) => {
	const theme = useTheme();
	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("");
	const [typeId, setTypeId] = useState<string>("");
	const [accountId, setAccountId] = useState<string>("");
	const [categoryId, setCategoryId] = useState<string>("");
	const [date, setDate] = useState("");
	const [assetId, setAssetId] = useState<string>("");
	const [liabilityId, setLiabilityId] = useState<string>("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialTransaction) {
			setDescription(initialTransaction.description);
			setAmount(initialTransaction.amount.toString());
			setTypeId(initialTransaction.transaction_type_id.toString());
			setAccountId(initialTransaction.account_id.toString());
			setCategoryId(initialTransaction.category_id.toString());
			setDate(initialTransaction.date);
			setAssetId(initialTransaction.asset_id?.toString() || "");
			setLiabilityId(initialTransaction.liability_id?.toString() || "");
		} else {
			setDescription("");
			setAmount("");
			setTypeId(transactionTypes[0]?.id?.toString() ?? "");
			setAccountId(accounts[0]?.id?.toString() ?? "");
			setCategoryId(categories[0]?.id?.toString() ?? "");
			setDate(new Date().toISOString().split("T")[0]);
			setAssetId("");
			setLiabilityId("");
		}
		setError("");
	}, [visible, initialTransaction, transactionTypes, accounts, categories]);

	const handleSave = () => {
		if (!description.trim()) {
			setError("Description is required");
			return;
		}
		if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
			setError("Amount must be a positive number");
			return;
		}
		if (!typeId) {
			setError("Type is required");
			return;
		}
		if (!accountId) {
			setError("Account is required");
			return;
		}
		if (!categoryId) {
			setError("Category is required");
			return;
		}
		if (!date) {
			setError("Date is required");
			return;
		}
		onSubmit({
			description: description.trim(),
			amount: Number(amount),
			transaction_type_id: Number(typeId),
			account_id: Number(accountId),
			category_id: Number(categoryId),
			date: new Date(date).toISOString(),
			asset_id: assetId ? Number(assetId) : null,
			liability_id: liabilityId ? Number(liabilityId) : null,
		});
	};

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onClose}>
				<Dialog.Title>
					{initialTransaction ? "Edit Transaction" : "Add Transaction"}
				</Dialog.Title>
				<Dialog.Content
					style={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<TextInput
						label="Description"
						value={description}
						onChangeText={setDescription}
						style={styles.input}
						autoFocus
					/>
					<TextInput
						label="Amount"
						value={amount}
						onChangeText={setAmount}
						style={styles.input}
						keyboardType="numeric"
					/>
					<Dropdown
						label={"Type"}
						value={typeId}
						onSelect={(v) => setTypeId(v ?? "")}
						options={transactionTypes.map((type) => ({
							label: type.name,
							value: type.id.toString(),
						}))}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								value={
									transactionTypes.find((type) => type.id.toString() === typeId)
										?.name || ""
								}
								style={{
									backgroundColor: theme.colors.outlineVariant,
									marginBottom: 8,
								}}
								outlineColor={theme.colors.primary}
								activeOutlineColor={theme.colors.primary}
							/>
						)}
					/>
					<Dropdown
						label={"Account"}
						value={accountId}
						onSelect={(v) => setAccountId(v ?? "")}
						options={accounts.map((account) => ({
							label: account.name,
							value: account.id.toString(),
						}))}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								value={
									accounts.find(
										(account) => account.id.toString() === accountId
									)?.name || ""
								}
								style={{
									backgroundColor: theme.colors.outlineVariant,
									marginBottom: 8,
								}}
								outlineColor={theme.colors.primary}
								activeOutlineColor={theme.colors.primary}
							/>
						)}
					/>
					<Dropdown
						label={"Category"}
						value={categoryId}
						onSelect={(v) => setCategoryId(v ?? "")}
						options={categories.map((category) => ({
							label: category.name,
							value: category.id.toString(),
						}))}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								value={
									categories.find(
										(category) => category.id.toString() === categoryId
									)?.name || ""
								}
								style={{
									backgroundColor: theme.colors.outlineVariant,
									marginBottom: 8,
								}}
								outlineColor={theme.colors.primary}
								activeOutlineColor={theme.colors.primary}
							/>
						)}
					/>
					<TextInput
						label="Date"
						value={date}
						onChangeText={setDate}
						style={styles.input}
						placeholder="YYYY-MM-DD"
					/>
					<Dropdown
						label={"Asset (optional)"}
						value={assetId}
						onSelect={(v) => setAssetId(v ?? "")}
						options={[
							{ label: "None", value: "" },
							...assets.map((asset) => ({
								label: asset.name,
								value: asset.id.toString(),
							})),
						]}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								value={
									assets.find((asset) => asset.id.toString() === assetId)
										?.name || "None"
								}
								style={{
									backgroundColor: theme.colors.outlineVariant,
									marginBottom: 8,
								}}
								outlineColor={theme.colors.primary}
								activeOutlineColor={theme.colors.primary}
							/>
						)}
					/>
					<Dropdown
						label={"Liability (optional)"}
						value={liabilityId}
						onSelect={(v) => setLiabilityId(v ?? "")}
						options={[
							{ label: "None", value: "" },
							...liabilities.map((liability) => ({
								label: liability.name,
								value: liability.id.toString(),
							})),
						]}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								value={
									liabilities.find(
										(liability) => liability.id.toString() === liabilityId
									)?.name || "None"
								}
								style={{
									backgroundColor: theme.colors.outlineVariant,
									marginBottom: 8,
								}}
								outlineColor={theme.colors.primary}
								activeOutlineColor={theme.colors.primary}
							/>
						)}
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
	label: {
		marginTop: 8,
		marginBottom: 4,
	},
});

export default TransactionFormDialog;
