import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, ScrollView } from "react-native";
import { Button, HelperText } from "react-native-paper";
import { Category, Transaction, TransactionType } from "../types";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";
import AppDropdown from "./AppDropdown";
import TransferFields, { TransferDirection } from "./TransferFields";
import AssociationFields from "./AssociationFields";

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
}) => {
	// Find default type ID
	const expenseTypeId = useMemo(() => {
		const expenseType = transactionTypes.find((t) => t.name === "Expense");
		return expenseType?.id.toString() || "";
	}, [transactionTypes]);

	// Form state
	const [typeId, setTypeId] = useState<string>(expenseTypeId);
	const [categoryId, setCategoryId] = useState<string>("");
	const [amount, setAmount] = useState("");
	const [fromAccountId, setFromAccountId] = useState<string>("");
	const [toAccountId, setToAccountId] = useState<string>("");
	const [assetId, setAssetId] = useState<string>("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [liabilityId, setLiabilityId] = useState<string>("");
	const [envelopeId, setEnvelopeId] = useState<string>("");
	const [billId, setBillId] = useState<string>("");
	const [error, setError] = useState("");
	const [transferDirection, setTransferDirection] =
		useState<TransferDirection>("account-to-account");

	const selectedTransactionType = transactionTypes.find(
		(t) => t.id.toString() === typeId
	)?.name;

	// Reset form when dialog opens
	useEffect(() => {
		if (visible) {
			setTypeId(expenseTypeId);
			setCategoryId("");
			setAmount("");
			setFromAccountId("");
			setToAccountId("");
			setAssetId("");
			setDescription("");
			setDate(new Date().toISOString().split("T")[0]);
			setLiabilityId("");
			setEnvelopeId("");
			setBillId("");
			setError("");
			setTransferDirection("account-to-account");
		}
	}, [visible, expenseTypeId]);

	// Filter categories by transaction type
	const filteredCategories = useMemo(() => {
		if (typeId) {
			return categories.filter((c) => c.transaction_type_id === Number(typeId));
		}
		return categories;
	}, [typeId, categories]);

	// Clear dependent fields when transaction type changes
	const handleTypeChange = useCallback((newTypeId: string) => {
		setTypeId(newTypeId);
		setError("");
		setCategoryId("");
		setFromAccountId("");
		setToAccountId("");
		setAssetId("");
		setLiabilityId("");
		setEnvelopeId("");
		setBillId("");
		setTransferDirection("account-to-account");
	}, []);

	// Clear direction-specific fields when direction changes
	const handleDirectionChange = useCallback((direction: TransferDirection) => {
		setTransferDirection(direction);
		setFromAccountId("");
		setToAccountId("");
		setAssetId("");
	}, []);

	const handleSave = () => {
		if (!typeId || typeId.trim() === "") {
			setError("Type is required");
			return;
		}
		if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
			setError("Amount must be a positive number");
			return;
		}
		if (!description.trim()) {
			setError("Description is required");
			return;
		}
		if (date.trim() === "") {
			setError("Date is required");
			return;
		}

		// Type-specific validation
		if (selectedTransactionType === "Transfer") {
			if (transferDirection === "account-to-account") {
				if (!fromAccountId || !toAccountId) {
					setError("Both From and To accounts are required");
					return;
				}
				if (fromAccountId === toAccountId) {
					setError("From and To accounts cannot be the same");
					return;
				}
			} else if (transferDirection === "account-to-asset") {
				if (!fromAccountId) {
					setError("From account is required");
					return;
				}
				if (!assetId) {
					setError("Asset is required");
					return;
				}
			} else if (transferDirection === "asset-to-account") {
				if (!assetId) {
					setError("Asset is required");
					return;
				}
				if (!toAccountId) {
					setError("To account is required");
					return;
				}
			} else if (transferDirection === "reinvest-into-asset") {
				if (!assetId) {
					setError("Asset is required");
					return;
				}
			}
		} else {
			// Income / Expense
			if (!categoryId) {
				setError("Category is required");
				return;
			}
			if (!fromAccountId && !toAccountId) {
				setError("Account is required");
				return;
			}
		}

		// Build transaction — null out irrelevant fields based on type/direction
		let finalFromAccountId: number | undefined;
		let finalToAccountId: number | undefined;
		let finalAssetId: number | undefined;

		if (selectedTransactionType === "Transfer") {
			if (transferDirection === "account-to-account") {
				finalFromAccountId = Number(fromAccountId);
				finalToAccountId = Number(toAccountId);
			} else if (transferDirection === "account-to-asset") {
				finalFromAccountId = Number(fromAccountId);
				finalAssetId = Number(assetId);
			} else if (transferDirection === "asset-to-account") {
				finalToAccountId = Number(toAccountId);
				finalAssetId = Number(assetId);
			} else if (transferDirection === "reinvest-into-asset") {
				finalAssetId = Number(assetId);
				// no accounts — money stays inside the asset
			}
		} else if (selectedTransactionType === "Income") {
			finalToAccountId =
				toAccountId && toAccountId !== "" ? Number(toAccountId) : undefined;
			finalAssetId = assetId && assetId !== "" ? Number(assetId) : undefined;
		} else {
			// Expense
			finalFromAccountId =
				fromAccountId && fromAccountId !== ""
					? Number(fromAccountId)
					: undefined;
			finalAssetId = assetId && assetId !== "" ? Number(assetId) : undefined;
		}

		onSubmit({
			description: description.trim(),
			amount: Number(amount),
			transaction_type_id: Number(typeId),
			from_account_id: finalFromAccountId,
			to_account_id: finalToAccountId,
			category_id: categoryId ? Number(categoryId) : null,
			date,
			asset_id: finalAssetId,
			liability_id:
				liabilityId && liabilityId !== "" ? Number(liabilityId) : undefined,
			envelope_id:
				envelopeId && envelopeId !== "" ? Number(envelopeId) : undefined,
			bill_id: billId && billId !== "" ? Number(billId) : undefined,
		} as Transaction);
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title="Add Transaction"
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
				<View style={{ gap: 2 }}>
					{/* 1. Transaction Type */}
					<AppDropdown
						label="Type"
						value={typeId}
						onSelect={(v) => handleTypeChange(v ?? "")}
						options={transactionTypes.map((type) => ({
							label: type.name,
							value: type.id.toString(),
						}))}
						error={error && !typeId ? "Type is required" : undefined}
					/>

					{/* 2. Category (Income/Expense only) */}
					{selectedTransactionType &&
						selectedTransactionType !== "Transfer" && (
							<AppDropdown
								label="Category"
								value={categoryId}
								onSelect={(v) => setCategoryId(v ?? "")}
								options={filteredCategories.map((c) => ({
									label: c.name,
									value: c.id.toString(),
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

					{/* 4. Source & Destination — varies by type */}
					{selectedTransactionType === "Transfer" ? (
						<TransferFields
							transferDirection={transferDirection}
							onDirectionChange={handleDirectionChange}
							fromAccountId={fromAccountId}
							onFromAccountChange={setFromAccountId}
							toAccountId={toAccountId}
							onToAccountChange={setToAccountId}
							assetId={assetId}
							onAssetChange={setAssetId}
							accounts={accounts}
							assets={assets}
							error={error}
						/>
					) : (
						<AppDropdown
							label={
								selectedTransactionType === "Income"
									? "To Account"
									: "From Account"
							}
							value={
								selectedTransactionType === "Income"
									? toAccountId
									: fromAccountId
							}
							onSelect={(v) => {
								if (selectedTransactionType === "Income") {
									setToAccountId(v ?? "");
								} else {
									setFromAccountId(v ?? "");
								}
							}}
							options={accounts.map((a) => ({
								label: a.name,
								value: a.id.toString(),
							}))}
							error={
								error && !fromAccountId && !toAccountId
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

					{/* 7. Associations (Income/Expense only) */}
					{selectedTransactionType &&
						selectedTransactionType !== "Transfer" && (
							<AssociationFields
								transactionType={selectedTransactionType}
								assetId={assetId}
								onAssetChange={setAssetId}
								envelopeId={envelopeId}
								onEnvelopeChange={setEnvelopeId}
								liabilityId={liabilityId}
								onLiabilityChange={setLiabilityId}
								billId={billId}
								onBillChange={setBillId}
								assets={assets}
								envelopes={envelopes}
								liabilities={liabilities}
								bills={bills}
							/>
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
