import React, { useState, useEffect, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { Button, HelperText } from "react-native-paper";
import { Category, Transaction, TransactionType } from "../types";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";
import AppDropdown from "./AppDropdown";
import CollapsibleSection from "./CollapsibleSection";

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
	bills: { id: number; name: string; amount: number }[];
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
	bills,
	initialTransaction,
}) => {
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
	const [billId, setBillId] = useState<string>("");
	const [error, setError] = useState("");
	const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

	const selectedTransactionType = transactionTypes.find(
		(t) => t.id.toString() === typeId
	)?.name;

	// Find Expense type ID for default
	const expenseTypeId = useMemo(() => {
		const expenseType = transactionTypes.find((t) => t.name === "Expense");
		return expenseType?.id.toString() || "";
	}, [transactionTypes]);

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
			setBillId(initialTransaction.bill_id?.toString() || "");
		} else {
			setDescription("");
			setAmount("");
			setTypeId(expenseTypeId); // Default to Expense type
			setFromAccountId("");
			setToAccountId("");
			setCategoryId("");
			setDate(new Date().toISOString().split("T")[0]);
			setAssetId("");
			setLiabilityId("");
			setEnvelopeId("");
			setBillId("");
		}
		setError("");
	}, [
		visible,
		initialTransaction,
		transactionTypes,
		accounts,
		categories,
		expenseTypeId,
	]);

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
			bill_id: billId && billId !== "" ? Number(billId) : undefined,
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

	useEffect(() => {
		if (!selectedTransactionType) {
			return;
		}
		if (selectedTransactionType !== "Expense") {
			setEnvelopeId("");
			setLiabilityId("");
			setBillId("");
		}
		if (selectedTransactionType === "Transfer") {
			setAssetId("");
		}
	}, [selectedTransactionType]);

	// Calculate count of selected associations for collapsible header
	const associationCount = useMemo(() => {
		let count = 0;
		if (assetId && assetId !== "") count++;
		if (envelopeId && envelopeId !== "") count++;
		if (liabilityId && liabilityId !== "") count++;
		if (billId && billId !== "") count++;
		return count;
	}, [assetId, envelopeId, liabilityId, billId]);

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
					{/* 1. Type */}
					<AppDropdown
						label="Type"
						value={typeId}
						onSelect={(v) => setTypeId(v ?? "")}
						options={transactionTypes.map((type) => ({
							label: type.name,
							value: type.id.toString(),
						}))}
						error={error && !typeId ? "Type is required" : undefined}
					/>

					{/* 2. Category - Only show for Income/Expense */}
					{selectedTransactionType !== "Transfer" && (
						<AppDropdown
							label="Category"
							value={categoryId}
							onSelect={(v) => setCategoryId(v ?? "")}
							options={filteredCategories.map((category) => ({
								label: category.name,
								value: category.id.toString(),
							}))}
							error={
								error && !categoryId && selectedTransactionType !== "Transfer"
									? "Category is required"
									: undefined
							}
						/>
					)}

					{/* 3. Amount */}
					<AppNumberInput
						label="Amount"
						value={amount}
						onChangeText={setAmount}
						error={
							error && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
								? "Amount must be a positive number"
								: undefined
						}
					/>

					{/* 4. Account(s) */}
					{selectedTransactionType === "Transfer" ? (
						<View style={{ gap: 8 }}>
							<AppDropdown
								label="From Account"
								value={fromAccountId}
								onSelect={(v) => setFromAccountId(v ?? "")}
								options={accounts.map((account) => ({
									label: account.name,
									value: account.id.toString(),
								}))}
								error={
									error &&
									selectedTransactionType === "Transfer" &&
									!fromAccountId
										? "From account is required"
										: undefined
								}
							/>
							<AppDropdown
								label="To Account"
								value={toAccountId}
								onSelect={(v) => setToAccountId(v ?? "")}
								options={accounts.map((account) => ({
									label: account.name,
									value: account.id.toString(),
								}))}
								error={
									error &&
									selectedTransactionType === "Transfer" &&
									!toAccountId
										? "To account is required"
										: undefined
								}
							/>
						</View>
					) : (
						<AppDropdown
							label="Account"
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
							error={
								error &&
								selectedTransactionType !== "Transfer" &&
								!fromAccountId &&
								!toAccountId
									? "Account is required"
									: undefined
							}
						/>
					)}

					{/* 5. Description */}
					<AppTextInput
						label="Description"
						value={description}
						onChangeText={setDescription}
						error={
							error && !description.trim()
								? "Description is required"
								: undefined
						}
					/>

					{/* 6. Date */}
					<AppTextInput
						label="Date"
						value={date}
						onChangeText={setDate}
						type="date"
						error={error && !date.trim() ? "Date is required" : undefined}
					/>

					{/* 7. Associations (Collapsible) */}
					{selectedTransactionType &&
						selectedTransactionType !== "Transfer" && (
							<CollapsibleSection
								title="Associations (Optional)"
								showCount={associationCount}
							>
								<View style={{ gap: 8 }}>
									{/* Asset - Show for Income/Expense (not Transfer) */}
									<AppDropdown
										label="Asset (optional)"
										value={assetId}
										onSelect={(v) => setAssetId(v ?? "")}
										options={[
											{ label: "None", value: "" },
											...assets.map((asset) => ({
												label: asset.name,
												value: asset.id.toString(),
											})),
										]}
										placeholder="None"
									/>

									{/* Envelope, Liability, Bill - Show only for Expense */}
									{selectedTransactionType === "Expense" && (
										<>
											<AppDropdown
												label="Envelope (optional)"
												value={envelopeId}
												onSelect={(v) => setEnvelopeId(v ?? "")}
												options={[
													{ label: "None", value: "" },
													...envelopes.map((envelope) => ({
														label: envelope.name,
														value: envelope.id.toString(),
													})),
												]}
												placeholder="None"
											/>
											<AppDropdown
												label="Liability (optional)"
												value={liabilityId}
												onSelect={(v) => setLiabilityId(v ?? "")}
												options={[
													{ label: "None", value: "" },
													...liabilities.map((liability) => ({
														label: liability.name,
														value: liability.id.toString(),
													})),
												]}
												placeholder="None"
											/>
											{bills.length > 0 && (
												<AppDropdown
													label="Bill (optional)"
													value={billId}
													onSelect={(v) => {
														setBillId(v ?? "");
													}}
													options={[
														{ label: "None", value: "" },
														...bills.map((bill) => ({
															label: `${
																bill.name
															} (${bill.amount.toLocaleString()})`,
															value: bill.id.toString(),
														})),
													]}
													placeholder="None"
												/>
											)}
										</>
									)}
								</View>
							</CollapsibleSection>
						)}

					<HelperText type="error" visible={!!error}>
						{error}
					</HelperText>
				</View>
			</ScrollView>
		</AppDialog>
	);
};

export default TransactionFormDialog;
