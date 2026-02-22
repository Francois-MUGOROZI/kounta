import React, { useState, useEffect } from "react";
import { Button, HelperText } from "react-native-paper";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";
import AppDropdown from "./AppDropdown";
import { getPopularCurrencyOptions } from "../constants/currencies";
import { Envelope } from "@/types";

interface EnvelopeFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: Envelope) => void;
	initialEnvelope?: Envelope | null;
}

const EnvelopeFormDialog: React.FC<EnvelopeFormDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	initialEnvelope,
}) => {
	const isEditing = !!initialEnvelope;
	const [name, setName] = useState("");
	const [totalAmount, setTotalAmount] = useState("");
	const [currency, setCurrency] = useState("");
	const [currentBalance, setCurrentBalance] = useState("");
	const [purpose, setPurpose] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialEnvelope) {
			setName(initialEnvelope.name);
			setTotalAmount(initialEnvelope.total_amount.toString());
			setCurrency(initialEnvelope.currency);
			setCurrentBalance(initialEnvelope.current_balance.toString());
		} else {
			setName("");
			setTotalAmount("");
			setCurrency("");
			setCurrentBalance("");
		}
		setError("");
	}, [visible, initialEnvelope]);

	const handleSave = () => {
		if (!name.trim() || name.length < 3) {
			setError("Name is required");
			return;
		}
		if (isEditing) {
			onSubmit({
				name: name.trim(),
				purpose: purpose.trim(),
			} as Envelope);
			return;
		}
		if (!currency.trim() || currency.length < 3) {
			setError("Currency is required");
			return;
		}
		if (!currentBalance || isNaN(Number(currentBalance))) {
			setError("Current balance must be a number");
			return;
		}
		if (!totalAmount || isNaN(Number(totalAmount))) {
			setError("Total amount must be a number");
			return;
		}
		onSubmit({
			name: name.trim(),
			total_amount: Number(totalAmount),
			currency: currency.trim().toUpperCase(),
			current_balance: Number(currentBalance),
			purpose: purpose.trim(),
		} as Envelope);
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialEnvelope ? "Edit Envelope" : "Add Envelope"}
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
				error={
					error && (!name.trim() || name.length < 3)
						? "Name is required (min 3 chars)"
						: undefined
				}
			/>
			{!isEditing && (
				<AppDropdown
					label="Currency"
					value={currency}
					onSelect={(v) => setCurrency(v ?? "")}
					options={getPopularCurrencyOptions()}
					error={
						error && (!currency || currency.length < 3)
							? "Currency is required"
							: undefined
					}
				/>
			)}
			{!isEditing && (
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
			)}
			{!isEditing && (
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
			)}
			<AppTextInput
				label="Purpose (optional)"
				value={purpose}
				onChangeText={setPurpose}
				multiline
			/>
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default EnvelopeFormDialog;
