import React, { useState, useEffect } from "react";
import { View } from "react-native";
import {
	TextInput,
	Button,
	HelperText,
	useTheme,
	Switch,
	Text,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";
import { Bill, BillRule, Category } from "../types";
import { generateBillName } from "../utils/bills";

interface BillFormProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: Bill) => void;
	billRules: BillRule[];
	categories: Category[];
	initialBill?: Bill | null;
}

const BillForm: React.FC<BillFormProps> = ({
	visible,
	onClose,
	onSubmit,
	billRules,
	categories,
	initialBill,
}) => {
	const theme = useTheme();
	const [isOneTime, setIsOneTime] = useState(true);
	const [billRuleId, setBillRuleId] = useState<string>("");
	const [dueDate, setDueDate] = useState("");
	const [amount, setAmount] = useState("");
	const [name, setName] = useState("");
	const [categoryId, setCategoryId] = useState<string>("");
	const [currency, setCurrency] = useState("RWF");
	const [error, setError] = useState("");

	const currencyOptions = [
		{ label: "RWF", value: "RWF" },
		{ label: "USD", value: "USD" },
		{ label: "EUR", value: "EUR" },
	];

	// Filter categories to only show Expense categories
	const expenseCategories = categories.filter(
		(cat) => cat.transaction_type_id === 2 // Assuming 2 is Expense
	);

	useEffect(() => {
		if (initialBill) {
			const isOneTimeBill = initialBill.bill_rule_id === null;
			setIsOneTime(isOneTimeBill);
			if (isOneTimeBill) {
				setBillRuleId("");
				setName(initialBill.name);
				setCategoryId(initialBill.category_id.toString());
				setCurrency(initialBill.currency || "RWF");
			} else {
				setBillRuleId(initialBill.bill_rule_id?.toString() || "");
				const rule = billRules.find((r) => r.id === initialBill.bill_rule_id);
				if (rule) {
					setName(
						generateBillName(initialBill.due_date, rule.name, rule.frequency)
					);
				} else {
					setName(initialBill.name);
				}
			}
			setDueDate(initialBill.due_date.split("T")[0]);
			setAmount(initialBill.amount.toString());
		} else {
			setIsOneTime(true);
			setBillRuleId("");
			setDueDate(new Date().toISOString().split("T")[0]);
			setAmount("");
			setName("");
			setCategoryId("");
			setCurrency("RWF");
		}
		setError("");
	}, [visible, initialBill, billRules]);

	// Auto-generate name when bill rule is selected
	useEffect(() => {
		if (!isOneTime && billRuleId && dueDate) {
			const rule = billRules.find((r) => r.id.toString() === billRuleId);
			if (rule) {
				setName(generateBillName(dueDate, rule.name, rule.frequency));
				setAmount(rule.amount.toString());
			}
		}
	}, [billRuleId, dueDate, isOneTime, billRules]);

	const handleSave = () => {
		if (isOneTime) {
			// Validation for one-time bills
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
				bill_rule_id: null,
				name: name.trim(),
				category_id: Number(categoryId),
				currency: currency,
				due_date: new Date(dueDate).toISOString(),
				amount: Number(amount),
				status: initialBill?.status || "Pending",
				created_at: initialBill?.created_at || new Date().toISOString(),
			} as Bill);
		} else {
			// Validation for recurring bills
			if (!billRuleId) {
				setError("Bill rule is required");
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

			const rule = billRules.find((r) => r.id.toString() === billRuleId);
			if (!rule) {
				setError("Invalid bill rule selected");
				return;
			}

			onSubmit({
				bill_rule_id: Number(billRuleId),
				name: generateBillName(dueDate, rule.name, rule.frequency),
				category_id: rule.category_id,
				currency: rule.currency,
				due_date: new Date(dueDate).toISOString(),
				amount: Number(amount),
				status: initialBill?.status || "Pending",
				created_at: initialBill?.created_at || new Date().toISOString(),
			} as Bill);
		}
	};

	// Helper to render dropdown input with app styling
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
			{!initialBill && (
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 16,
					}}
				>
					<Switch value={isOneTime} onValueChange={setIsOneTime} />
					<Text style={{ marginLeft: 8 }}>One-time bill</Text>
				</View>
			)}

			{isOneTime ? (
				<>
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
					<Dropdown
						label="Category"
						value={categoryId}
						onSelect={(v) => setCategoryId(v ?? "")}
						options={expenseCategories.map((cat) => ({
							label: cat.name,
							value: cat.id.toString(),
						}))}
						error={!!error && !categoryId}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) =>
							renderDropdownInput(
								props,
								expenseCategories.find((c) => c.id.toString() === categoryId)
									?.name || "",
								"Category"
							)
						}
					/>
					<Dropdown
						label="Currency"
						value={currency}
						onSelect={(v) => setCurrency(v ?? "RWF")}
						options={currencyOptions}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) =>
							renderDropdownInput(props, currency, "Currency")
						}
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
				</>
			) : (
				<>
					<Dropdown
						label={"Bill Rule"}
						value={billRuleId}
						onSelect={(v) => {
							setBillRuleId(v ?? "");
							// Auto-fill amount from selected rule
							const rule = billRules.find((r) => r.id.toString() === v);
							if (rule) {
								setAmount(rule.amount.toString());
							}
						}}
						options={billRules.map((rule) => ({
							label: rule.name,
							value: rule.id.toString(),
						}))}
						error={!!error && !billRuleId}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) =>
							renderDropdownInput(
								props,
								billRules.find((r) => r.id.toString() === billRuleId)?.name ||
									"",
								"Bill Rule"
							)
						}
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
					{name && (
						<View
							style={{
								marginTop: 8,
								padding: 8,
								backgroundColor: theme.colors.surfaceVariant,
								borderRadius: 4,
							}}
						>
							<Text
								variant="bodySmall"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								Bill name: {name}
							</Text>
						</View>
					)}
				</>
			)}
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

export default BillForm;
