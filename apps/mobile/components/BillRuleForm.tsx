import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Button, HelperText, Switch, Text, useTheme } from "react-native-paper";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";
import AppDropdown from "./AppDropdown";
import { BillRule, BillFrequency, Category, TransactionType } from "../types";

interface BillRuleFormProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: BillRule) => void;
	categories: Category[];
	transactionTypes: TransactionType[];
	initialBillRule?: BillRule | null;
}

const BillRuleForm: React.FC<BillRuleFormProps> = ({
	visible,
	onClose,
	onSubmit,
	categories,
	transactionTypes,
	initialBillRule,
}) => {
	const theme = useTheme();
	const [name, setName] = useState("");
	const [amount, setAmount] = useState("");
	const [frequency, setFrequency] = useState<string>("");
	const [categoryId, setCategoryId] = useState<string>("");
	const [isActive, setIsActive] = useState(true);
	const [startDate, setStartDate] = useState("");
	const [autoNext, setAutoNext] = useState(true);
	const [currency, setCurrency] = useState("RWF");
	const [error, setError] = useState("");

	const frequencyOptions: { label: string; value: BillFrequency }[] = [
		{ label: "Weekly", value: "Weekly" },
		{ label: "Monthly", value: "Monthly" },
		{ label: "Quarterly", value: "Quarterly" },
		{ label: "Yearly", value: "Yearly" },
		{ label: "One Time", value: "OneTime" },
	];

	const currencyOptions = [
		{ label: "RWF", value: "RWF" },
		{ label: "USD", value: "USD" },
		{ label: "EUR", value: "EUR" },
	];

	useEffect(() => {
		if (initialBillRule) {
			setName(initialBillRule.name);
			setAmount(initialBillRule.amount.toString());
			setFrequency(initialBillRule.frequency);
			setCategoryId(initialBillRule.category_id.toString());
			setIsActive(initialBillRule.is_active);
			setStartDate(initialBillRule.start_date.split("T")[0]);
			setAutoNext(initialBillRule.auto_next);
			setCurrency(initialBillRule.currency || "RWF");
		} else {
			setName("");
			setAmount("");
			setFrequency("Monthly");
			setCategoryId("");
			setIsActive(true);
			setStartDate(new Date().toISOString().split("T")[0]);
			setAutoNext(true);
			setCurrency("RWF");
		}
		setError("");
	}, [visible, initialBillRule]);

	const isEditing = !!initialBillRule;

	const handleSave = () => {
		if (!name.trim() || name.length < 3) {
			setError("Name is required (min 3 chars)");
			return;
		}

		if (isEditing) {
			// In edit mode, only submit editable fields
			onSubmit({
				...initialBillRule,
				name: name.trim(),
				is_active: isActive,
				auto_next: autoNext,
			} as BillRule);
			return;
		}

		// Create mode: validate all fields
		if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
			setError("Amount must be a positive number");
			return;
		}
		if (!frequency) {
			setError("Frequency is required");
			return;
		}
		if (!categoryId) {
			setError("Category is required");
			return;
		}
		if (!startDate) {
			setError("Start date is required");
			return;
		}

		onSubmit({
			name: name.trim(),
			amount: Number(amount),
			frequency: frequency as BillFrequency,
			category_id: Number(categoryId),
			is_active: isActive,
			start_date: new Date(startDate).toISOString(),
			auto_next: autoNext,
			currency: currency,
			created_at: new Date().toISOString(),
		} as BillRule);
	};

	// Filter categories to only show Expense categories (matched by name)
	const expenseTypeId = transactionTypes.find((t) => t.name === "Expense")?.id;
	const expenseCategories = categories.filter(
		(cat) => cat.transaction_type_id === expenseTypeId
	);

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialBillRule ? "Edit Bill Rule" : "Add Bill Rule"}
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
				<>
					<AppNumberInput
						label="Amount"
						value={amount}
						onChangeText={setAmount}
						error={
							error && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
								? "Valid amount required"
								: undefined
						}
					/>
					<AppDropdown
						label="Currency"
						value={currency}
						onSelect={(v) => setCurrency(v ?? "RWF")}
						options={currencyOptions}
					/>
					<AppDropdown
						label="Frequency"
						value={frequency}
						onSelect={(v) => setFrequency(v ?? "")}
						options={frequencyOptions}
						error={error && !frequency ? "Frequency is required" : undefined}
					/>
					<AppDropdown
						label="Category"
						value={categoryId}
						onSelect={(v) => setCategoryId(v ?? "")}
						options={expenseCategories.map((cat) => ({
							label: cat.name,
							value: cat.id.toString(),
						}))}
						error={error && !categoryId ? "Category is required" : undefined}
					/>
					<AppTextInput
						label="Start Date"
						value={startDate}
						onChangeText={setStartDate}
						type="date"
						error={error && !startDate ? "Start date is required" : undefined}
					/>
				</>
			)}
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginVertical: 8,
					paddingVertical: 12,
					paddingHorizontal: 16,
					backgroundColor: theme.colors.surfaceVariant,
					borderRadius: 8,
				}}
			>
				<Text variant="bodyLarge">Active</Text>
				<Switch value={isActive} onValueChange={setIsActive} />
			</View>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginVertical: 8,
					paddingVertical: 12,
					paddingHorizontal: 16,
					backgroundColor: theme.colors.surfaceVariant,
					borderRadius: 8,
				}}
			>
				<Text variant="bodyLarge">Auto Generate Next</Text>
				<Switch value={autoNext} onValueChange={setAutoNext} />
			</View>
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default BillRuleForm;
