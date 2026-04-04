import React, { useState, useEffect } from "react";
import { Button, HelperText, Switch, Text } from "react-native-paper";
import { View } from "react-native";
import { getPopularCurrencyOptions } from "../constants/currencies";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";
import AppDropdown from "./AppDropdown";
import { Entity, Receivable, ReceivableType } from "../types";

const RECEIVABLE_TYPE_OPTIONS: { label: string; value: ReceivableType }[] = [
	{ label: "Salary", value: "Salary" },
	{ label: "Personal Loan", value: "Personal-Loan" },
	{ label: "Refund", value: "Refund" },
	{ label: "Deposit", value: "Deposit" },
	{ label: "IOU", value: "IOU" },
	{ label: "Interest", value: "Interest" },
];

interface ReceivableFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: {
		entity_id: number;
		title: string;
		type: ReceivableType;
		currency: string;
		principal: number;
		interest_rate: number;
		requires_outflow: boolean;
		due_date?: string;
		notes?: string;
	}) => void;
	entities: Entity[];
	initialReceivable?: Receivable | null;
}

const ReceivableFormDialog: React.FC<ReceivableFormDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	entities,
	initialReceivable,
}) => {
	const isEditing = !!initialReceivable;
	const [entityId, setEntityId] = useState<string>("");
	const [title, setTitle] = useState("");
	const [type, setType] = useState<string>("");
	const [currency, setCurrency] = useState("");
	const [principal, setPrincipal] = useState("");
	const [interestRate, setInterestRate] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [notes, setNotes] = useState("");
	const [requiresOutflow, setRequiresOutflow] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialReceivable) {
			setEntityId(initialReceivable.entity_id.toString());
			setTitle(initialReceivable.title);
			setType(initialReceivable.type);
			setCurrency(initialReceivable.currency);
			setPrincipal(initialReceivable.principal.toString());
			setInterestRate(initialReceivable.interest_rate.toString());
			setRequiresOutflow(!!initialReceivable.requires_outflow);
			setDueDate(initialReceivable.due_date || "");
			setNotes(initialReceivable.notes || "");
		} else {
			setEntityId("");
			setTitle("");
			setType("");
			setCurrency("");
			setPrincipal("");
			setInterestRate("0");
			setRequiresOutflow(false);
			setDueDate("");
			setNotes("");
		}
		setError("");
	}, [visible, initialReceivable, entities]);

	// Suggest a default when type changes, but user can override
	const handleTypeChange = (newType: string) => {
		setType(newType);
		if (!isEditing) {
			// Suggest outflow for lending-like types
			const lendingTypes = ["IOU", "Personal-Loan"];
			setRequiresOutflow(lendingTypes.includes(newType));
		}
	};

	const handleSave = () => {
		if (!entityId) {
			setError("Entity is required");
			return;
		}
		if (!title.trim()) {
			setError("Title is required");
			return;
		}
		if (!type) {
			setError("Type is required");
			return;
		}
		if (isEditing) {
			onSubmit({
				entity_id: Number(entityId),
				title: title.trim(),
				type: type as ReceivableType,
				currency: initialReceivable!.currency,
				principal: initialReceivable!.principal,
				interest_rate: Number(interestRate) || 0,
				requires_outflow: initialReceivable!.requires_outflow,
				due_date: dueDate.trim() || undefined,
				notes: notes.trim() || undefined,
			});
			return;
		}
		if (!currency.trim()) {
			setError("Currency is required");
			return;
		}
		if (!principal || isNaN(Number(principal)) || Number(principal) <= 0) {
			setError("Principal must be a positive number");
			return;
		}
		onSubmit({
			entity_id: Number(entityId),
			title: title.trim(),
			type: type as ReceivableType,
			currency: currency.trim().toUpperCase(),
			principal: Number(principal),
			interest_rate: Number(interestRate) || 0,
			requires_outflow: requiresOutflow,
			due_date: dueDate.trim() || undefined,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialReceivable ? "Edit Receivable" : "Add Receivable"}
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
			<AppDropdown
				label="Entity"
				value={entityId}
				onSelect={(v) => setEntityId(v ?? "")}
				options={entities.map((e) => ({
					label: e.name,
					value: e.id.toString(),
				}))}
				error={error && !entityId ? "Entity is required" : undefined}
				disabled={isEditing}
			/>
			<AppTextInput
				label="Title"
				value={title}
				onChangeText={setTitle}
				error={error && !title.trim() ? "Title is required" : undefined}
			/>
			<AppDropdown
				label="Type"
				value={type}
				onSelect={(v) => handleTypeChange(v ?? "")}
				options={RECEIVABLE_TYPE_OPTIONS}
				error={error && !type ? "Type is required" : undefined}
			/>
			{!isEditing && (
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						marginVertical: 8,
					}}
				>
					<View style={{ flex: 1 }}>
						<Text variant="bodyMedium">
							Requires lending transfer
						</Text>
						<Text
							variant="bodySmall"
							style={{ opacity: 0.6 }}
						>
							{requiresOutflow
								? "Stays Pending until you transfer money out"
								: "Active immediately — money is already owed"}
						</Text>
					</View>
					<Switch
						value={requiresOutflow}
						onValueChange={setRequiresOutflow}
					/>
				</View>
			)}
			{!isEditing && (
				<AppDropdown
					label="Currency"
					value={currency}
					onSelect={(v) => setCurrency(v ?? "")}
					options={getPopularCurrencyOptions()}
					error={error && !currency ? "Currency is required" : undefined}
				/>
			)}
			{!isEditing && (
				<AppNumberInput
					label="Principal Amount"
					value={principal}
					onChangeText={setPrincipal}
					currency={currency || "RWF"}
					error={
						error &&
						(!principal || isNaN(Number(principal)) || Number(principal) <= 0)
							? "Valid principal required"
							: undefined
					}
				/>
			)}
			<AppNumberInput
				label="Interest Rate % (optional)"
				value={interestRate}
				onChangeText={setInterestRate}
			/>
			<AppTextInput
				label="Due Date (optional)"
				value={dueDate}
				onChangeText={setDueDate}
				type="date"
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

export default ReceivableFormDialog;
