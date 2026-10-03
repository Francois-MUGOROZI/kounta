import React, { useMemo, useState } from "react";
import Sheet from "./ui/Sheet";
import { AmountField, DateField, SelectField, TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { getCurrencyPickerOptions } from "../constants/currencies";
import { getCategoryIcon } from "../constants/categoryIcons";
import { Bill, Category, TransactionType } from "../types";
import { toDayKey, toLocalISODate } from "../utils/date";

export interface BillFormValues {
	name: string;
	category_id: number;
	currency: string;
	/** Local "YYYY-MM-DD". */
	due_date: string;
	amount: number;
	status: Bill["status"];
	created_at: string;
}

interface BillFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	categories: Category[];
	transactionTypes: TransactionType[];
	/** Present when editing. */
	bill?: Bill | null;
	/** Persist the values; throw to keep the sheet open with the error shown. */
	onSubmit: (values: BillFormValues) => Promise<void>;
}

const Body: React.FC<Omit<BillFormSheetProps, "visible">> = ({
	onDismiss,
	categories,
	transactionTypes,
	bill,
	onSubmit,
}) => {
	const editing = !!bill;
	const [name, setName] = useState(bill?.name ?? "");
	const [categoryId, setCategoryId] = useState<number | null>(bill?.category_id ?? null);
	const [currency, setCurrency] = useState<string | null>(bill?.currency ?? "RWF");
	const [dueDate, setDueDate] = useState(bill ? toDayKey(bill.due_date) : toLocalISODate());
	const [amount, setAmount] = useState(bill ? String(bill.amount) : "");
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Bills are always paid out, so only expense categories apply.
	const expenseTypeId = transactionTypes.find((t) => t.name === "Expense")?.id;
	const categoryOptions = useMemo(
		() =>
			categories
				.filter((c) => c.transaction_type_id === expenseTypeId)
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((c) => ({ value: c.id, label: c.name, icon: getCategoryIcon(c.name) })),
		[categories, expenseTypeId]
	);
	const currencies = useMemo(getCurrencyPickerOptions, []);

	const { submit, saving, error } = useSubmit(async () => {
		const e: Record<string, string> = {};
		if (name.trim().length < 3) e.name = "Use at least 3 characters";
		if (!categoryId) e.category = "Choose a category";
		if (!dueDate) e.dueDate = "Choose a due date";
		if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
			e.amount = "Enter an amount greater than zero";
		setErrors(e);
		if (Object.keys(e).length) return;
		await onSubmit({
			name: name.trim(),
			category_id: categoryId!,
			currency: currency ?? "RWF",
			due_date: dueDate,
			amount: Number(amount),
			status: bill?.status ?? "Pending",
			created_at: bill?.created_at ?? toLocalISODate(),
		});
	});

	return (
		<>
			<TextField
				label="Bill name"
				value={name}
				onChangeText={setName}
				error={errors.name}
				placeholder="e.g. Electricity"
				autoCapitalize="sentences"
			/>
			<SelectField
				label="Category"
				value={categoryId}
				options={categoryOptions}
				onChange={setCategoryId}
				error={errors.category}
				icon="shape-outline"
				emptyMessage="No expense categories yet. Add one under More › Categories."
			/>
			<SelectField
				label="Currency"
				value={currency}
				options={currencies}
				onChange={setCurrency}
				icon="cash-multiple"
			/>
			<AmountField
				label="Amount"
				value={amount}
				onChangeText={setAmount}
				currency={currency ?? "RWF"}
				error={errors.amount}
			/>
			<DateField label="Due date" value={dueDate} onChange={setDueDate} error={errors.dueDate} />
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel={editing ? "Save changes" : "Add bill"}
			/>
		</>
	);
};

const BillFormSheet: React.FC<BillFormSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title={props.bill ? "Edit bill" : "New bill"}
		>
			<Body key={session} {...props} />
		</Sheet>
	);
};

export default BillFormSheet;
