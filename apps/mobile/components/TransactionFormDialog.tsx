import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Button, HelperText, useTheme, TextInput } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { Category, Transaction, TransactionType } from "../types";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";

interface TransactionFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: Transaction) => void;
	transactionTypes: TransactionType[];
	accounts: { id: number; name: string }[];
	categories: Category[];
	assets: { id: number; name: string }[];
	liabilities: { id: number; name: string }[];
	envelopes: { id: number; name: string }[];
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
	envelopes,
	initialTransaction,
}) => {
	const theme = useTheme();
	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("");
	const [typeId, setTypeId] = useState<string>("");
	const [fromAccountId, setFromAccountId] = useState<string>("");
	const [toAccountId, setToAccountId] = useState<string>("");
	const [categoryId, setCategoryId] = useState<string>("");
	const [date, setDate] = useState("");
	const [assetId, setAssetId] = useState<string>("");
	const [liabilityId, setLiabilityId] = useState<string>("");
	const [envelopeId, setEnvelopeId] = useState<string>("");
	const [error, setError] = useState("");
	const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

	const selectedTransactionType = transactionTypes.find(
		(t) => t.id.toString() === typeId
	)?.name;

	useEffect(() => {
		if (initialTransaction) {
			setDescription(initialTransaction.description);
			setAmount(initialTransaction.amount.toString());
			setTypeId(initialTransaction.transaction_type_id.toString());
			setFromAccountId(initialTransaction.from_account_id?.toString() || "");
			setToAccountId(initialTransaction.to_account_id?.toString() || "");
			setCategoryId(initialTransaction.category_id.toString());
			setDate(initialTransaction.date);
			setAssetId(initialTransaction.asset_id?.toString() || "");
			setLiabilityId(initialTransaction.liability_id?.toString() || "");
			setEnvelopeId(initialTransaction.envelope_id?.toString() || "");
		} else {
			setDescription("");
			setAmount("");
			setTypeId("");
			setFromAccountId("");
			setToAccountId("");
			setCategoryId("");
			setDate(new Date().toISOString().split("T")[0]);
			setAssetId("");
			setLiabilityId("");
			setEnvelopeId("");
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
		if (!typeId || typeId.trim() === "") {
			setError("Type is required");
			return;
		}
		if (selectedTransactionType === "Transfer") {
			if (fromAccountId.trim() === "" || toAccountId.trim() === "") {
				setError("From and To accounts are required for a transfer");
				return;
			}
			if (fromAccountId === toAccountId) {
				setError("From and To accounts cannot be the same");
				return;
			}
		} else {
			if (fromAccountId.trim() === "" && toAccountId.trim() === "") {
				setError("An account is required");
				return;
			}
			if (categoryId.trim() === "" && selectedTransactionType !== "Transfer") {
				setError("Category is required");
				return;
			}
		}
		if (date.trim() === "") {
			setError("Date is required");
			return;
		}

		onSubmit({
			description: description.trim(),
			amount: Number(amount),
			transaction_type_id: Number(typeId),
			from_account_id:
				fromAccountId && fromAccountId !== ""
					? Number(fromAccountId)
					: undefined,
			to_account_id:
				toAccountId && toAccountId !== "" ? Number(toAccountId) : undefined,
			category_id: categoryId && categoryId !== "" ? Number(categoryId) : null,
			date: date && date.trim() !== "" ? date : new Date(date).toISOString(),
			asset_id: assetId && assetId !== "" ? Number(assetId) : undefined,
			liability_id:
				liabilityId && liabilityId !== "" ? Number(liabilityId) : undefined,
			envelope_id:
				envelopeId && envelopeId !== "" ? Number(envelopeId) : undefined,
		} as Transaction);
	};

	useEffect(() => {
		if (typeId) {
			setFilteredCategories(
				categories.filter(
					(category) => category.transaction_type_id === Number(typeId)
				)
			);
		} else {
			setFilteredCategories(categories);
		}
	}, [typeId, categories]);

	// Helper to render dropdown input with premium styling
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
			title={initialTransaction ? "Edit Transaction" : "Add Transaction"}
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
			<ScrollView
				style={{ maxHeight: 500 }}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 16 }}
			>
				<View style={{ gap: 8 }}>
					<AppTextInput
						label="Description"
						value={description}
						onChangeText={setDescription}
					/>
					<AppNumberInput
						label="Amount"
						value={amount}
						onChangeText={setAmount}
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
						CustomDropdownInput={(props) =>
							renderDropdownInput(
								props,
								transactionTypes.find((type) => type.id.toString() === typeId)
									?.name || "",
								"Type"
							)
						}
					/>

					{selectedTransactionType === "Transfer" ? (
						<View>
							<Dropdown
								label={"From Account"}
								value={fromAccountId}
								onSelect={(v) => setFromAccountId(v ?? "")}
								options={accounts.map((account) => ({
									label: account.name,
									value: account.id.toString(),
								}))}
								error={!!error}
								CustomMenuHeader={() => null}
								CustomDropdownInput={(props) =>
									renderDropdownInput(
										props,
										accounts.find(
											(account) => account.id.toString() === fromAccountId
										)?.name || "",
										"From Account"
									)
								}
							/>
							<Dropdown
								label={"To Account"}
								value={toAccountId}
								onSelect={(v) => setToAccountId(v ?? "")}
								options={accounts.map((account) => ({
									label: account.name,
									value: account.id.toString(),
								}))}
								error={!!error}
								CustomMenuHeader={() => null}
								CustomDropdownInput={(props) =>
									renderDropdownInput(
										props,
										accounts.find(
											(account) => account.id.toString() === toAccountId
										)?.name || "",
										"To Account"
									)
								}
							/>
						</View>
					) : (
						<View>
							<Dropdown
								label={"Account"}
								value={
									selectedTransactionType === "Income"
										? toAccountId
										: fromAccountId
								}
								onSelect={(v) => {
									if (selectedTransactionType === "Income") {
										setToAccountId(v ?? "");
										setFromAccountId("");
									} else {
										setFromAccountId(v ?? "");
										setToAccountId("");
									}
								}}
								options={accounts.map((account) => ({
									label: account.name,
									value: account.id.toString(),
								}))}
								error={!!error}
								CustomMenuHeader={() => null}
								CustomDropdownInput={(props) =>
									renderDropdownInput(
										props,
										accounts.find(
											(account) =>
												account.id.toString() ===
												(selectedTransactionType === "Income"
													? toAccountId
													: fromAccountId)
										)?.name || "",
										"Account"
									)
								}
							/>
							<Dropdown
								label={"Category"}
								value={categoryId}
								onSelect={(v) => setCategoryId(v ?? "")}
								options={filteredCategories.map((category) => ({
									label: category.name,
									value: category.id.toString(),
								}))}
								error={!!error}
								CustomMenuHeader={() => null}
								CustomDropdownInput={(props) =>
									renderDropdownInput(
										props,
										categories.find(
											(category) => category.id.toString() === categoryId
										)?.name || "",
										"Category"
									)
								}
							/>
						</View>
					)}

					<AppTextInput
						label="Date"
						value={date}
						onChangeText={setDate}
						type="date"
					/>

					{selectedTransactionType !== "Transfer" && (
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
							CustomDropdownInput={(props) =>
								renderDropdownInput(
									props,
									assets.find((asset) => asset.id.toString() === assetId)
										?.name || "None",
									"Asset (optional)"
								)
							}
						/>
					)}
					{selectedTransactionType === "Expense" && (
						<>
							<Dropdown
								label={"Envelope (optional)"}
								value={envelopeId}
								onSelect={(v) => setEnvelopeId(v ?? "")}
								options={[
									{ label: "None", value: "" },
									...envelopes.map((envelope) => ({
										label: envelope.name,
										value: envelope.id.toString(),
									})),
								]}
								error={!!error}
								CustomMenuHeader={() => null}
								CustomDropdownInput={(props) =>
									renderDropdownInput(
										props,
										envelopes.find(
											(envelope) => envelope.id.toString() === envelopeId
										)?.name || "None",
										"Envelope (optional)"
									)
								}
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
								CustomDropdownInput={(props) =>
									renderDropdownInput(
										props,
										liabilities.find(
											(liability) => liability.id.toString() === liabilityId
										)?.name || "None",
										"Liability (optional)"
									)
								}
							/>
						</>
					)}
					<HelperText type="error" visible={!!error}>
						{error}
					</HelperText>
				</View>
			</ScrollView>
		</AppDialog>
	);
};

const styles = StyleSheet.create({
	// Styles handled by Premium components
});

export default TransactionFormDialog;
