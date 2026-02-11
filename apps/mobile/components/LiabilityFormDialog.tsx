import React, { useState, useEffect } from "react";
import { Button, HelperText } from "react-native-paper";
import { getPopularCurrencyOptions } from "../constants/currencies";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";
import AppDropdown from "./AppDropdown";
import { Liability } from "../types";

interface LiabilityFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: {
		name: string;
		liability_type_id: number;
		currency: string;
		total_amount: number;
		current_balance: number;
		notes?: string;
	}) => void;
	liabilityTypes: { id: number; name: string }[];
	initialLiability?: Liability | null;
}

const LiabilityFormDialog: React.FC<LiabilityFormDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	liabilityTypes,
	initialLiability,
}) => {
	const [name, setName] = useState("");
	const [typeId, setTypeId] = useState<string>("");
	const [currency, setCurrency] = useState("");
	const [totalAmount, setTotalAmount] = useState("");
	const [currentBalance, setCurrentBalance] = useState("");
	const [notes, setNotes] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialLiability) {
			setName(initialLiability.name);
			setTypeId(initialLiability.liability_type_id.toString());
			setCurrency(initialLiability.currency);
			setTotalAmount(initialLiability.total_amount.toString());
			setCurrentBalance(initialLiability.current_balance.toString());
			setNotes(initialLiability.notes || "");
		} else {
			setName("");
			setTypeId(liabilityTypes[0]?.id?.toString() ?? "");
			setCurrency("");
			setTotalAmount("");
			setCurrentBalance("");
			setNotes("");
		}
		setError("");
	}, [visible, initialLiability, liabilityTypes]);

	const handleSave = () => {
		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		if (!typeId) {
			setError("Type is required");
			return;
		}
		if (!currency.trim()) {
			setError("Currency is required");
			return;
		}
		if (!totalAmount || isNaN(Number(totalAmount))) {
			setError("Total amount must be a number");
			return;
		}
		if (!currentBalance || isNaN(Number(currentBalance))) {
			setError("Current balance must be a number");
			return;
		}
		if (Number(currentBalance) > Number(totalAmount)) {
			setError("Current balance cannot be greater than total amount");
			return;
		}
		onSubmit({
			name: name.trim(),
			liability_type_id: Number(typeId),
			currency: currency.trim().toUpperCase(),
			total_amount: Number(totalAmount),
			current_balance: Number(currentBalance),
			notes: notes.trim() || undefined,
		});
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialLiability ? "Edit Liability" : "Add Liability"}
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
			<AppDropdown
				label="Liability Type"
				value={typeId}
				onSelect={(v) => setTypeId(v ?? "")}
				options={liabilityTypes.map((type) => ({
					label: type.name,
					value: type.id.toString(),
				}))}
				error={error && !typeId ? "Type is required" : undefined}
			/>
			<AppDropdown
				label="Currency"
				value={currency}
				onSelect={(v) => setCurrency(v ?? "")}
				options={getPopularCurrencyOptions()}
				error={error && !currency ? "Currency is required" : undefined}
			/>
			<AppNumberInput
				label="Total Amount"
				value={totalAmount}
				onChangeText={setTotalAmount}
				currency={currency || "RWF"}
				error={
					error && (!totalAmount || isNaN(Number(totalAmount)))
						? "Valid total amount required"
						: undefined
				}
			/>
			<AppNumberInput
				label="Current Balance"
				value={currentBalance}
				onChangeText={setCurrentBalance}
				currency={currency || "RWF"}
				error={
					error && (!currentBalance || isNaN(Number(currentBalance)))
						? "Valid current balance required"
						: undefined
				}
			/>
			<AppTextInput
				label="Notes (optional)"
				value={notes}
				onChangeText={setNotes}
				multiline
			/>
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default LiabilityFormDialog;
