import React, { useState, useEffect } from "react";
import { Button, HelperText } from "react-native-paper";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";
import AppDropdown from "./AppDropdown";
import { Bill, Category, TransactionType } from "../types";
import { format, parseISO } from "date-fns";

interface BillFormProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: Bill) => void;
	categories: Category[];
	transactionTypes: TransactionType[];
	initialBill?: Bill | null;
}

const BillForm: React.FC<BillFormProps> = ({
	visible,
	onClose,
	onSubmit,
	categories,
	transactionTypes,
	initialBill,
}) => {
	const [name, setName] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [amount, setAmount] = useState("");
	const [categoryId, setCategoryId] = useState<string>("");
	const [currency, setCurrency] = useState("RWF");
	const [error, setError] = useState("");

	const currencyOptions = [
		{ label: "RWF", value: "RWF" },
		{ label: "USD", value: "USD" },
		{ label: "EUR", value: "EUR" },
	];

	// Filter categories to only show Expense categories
	const expenseTypeId = transactionTypes.find((t) => t.name === "Expense")?.id;
	const expenseCategories = categories.filter(
		(cat) => cat.transaction_type_id === expenseTypeId
	);

	useEffect(() => {
		if (initialBill) {
			setName(initialBill.name);
			setDueDate(initialBill.due_date.split("T")[0]);
			setAmount(initialBill.amount.toString());
			setCategoryId(initialBill.category_id.toString());
			setCurrency(initialBill.currency || "RWF");
		} else {
			setName("");
			setDueDate(new Date().toISOString().split("T")[0]);
			setAmount("");
			setCategoryId("");
			setCurrency("RWF");
		}
		setError("");
	}, [visible, initialBill]);

	const handleSave = () => {
		if (!name || name.trim().length < 3) {
			setError("Name is required (min 3 chars)");
			return;
		}
		if (!categoryId) {
			setError("Category is required");
			return;
		}
		if (!dueDate) {
			setError("Due date is required");
			return;
		}
		if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
			setError("Amount must be a positive number");
			return;
		}

		onSubmit({
			name: name.trim(),
			category_id: Number(categoryId),
			currency: currency,
			due_date: format(parseISO(dueDate), "yyyy-MM-dd"),
			amount: Number(amount),
			status: initialBill?.status || "Pending",
			created_at: initialBill?.created_at || format(new Date(), "yyyy-MM-dd"),
		} as Bill);
	};

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialBill ? "Edit Bill" : "Add Bill"}
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
					error && (!name || name.trim().length < 3)
						? "Name is required (min 3 chars)"
						: undefined
				}
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
			<AppDropdown
				label="Currency"
				value={currency}
				onSelect={(v) => setCurrency(v ?? "RWF")}
				options={currencyOptions}
			/>
			<AppTextInput
				label="Due Date"
				value={dueDate}
				onChangeText={setDueDate}
				type="date"
				error={error && !dueDate ? "Due date is required" : undefined}
			/>
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
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default BillForm;
