import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
	TextInput,
	Button,
	HelperText,
	useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";
import { Bill, BillRule } from "../types";

interface BillFormProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: Bill) => void;
	billRules: BillRule[];
	initialBill?: Bill | null;
}

const BillForm: React.FC<BillFormProps> = ({
	visible,
	onClose,
	onSubmit,
	billRules,
	initialBill,
}) => {
	const theme = useTheme();
	const [billRuleId, setBillRuleId] = useState<string>("");
	const [dueDate, setDueDate] = useState("");
	const [amount, setAmount] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialBill) {
			setBillRuleId(initialBill.bill_rule_id.toString());
			setDueDate(initialBill.due_date.split("T")[0]);
			setAmount(initialBill.amount.toString());
		} else {
			setBillRuleId("");
			setDueDate(new Date().toISOString().split("T")[0]);
			setAmount("");
		}
		setError("");
	}, [visible, initialBill]);

	const handleSave = () => {
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

		onSubmit({
			bill_rule_id: Number(billRuleId),
			due_date: new Date(dueDate).toISOString(),
			amount: Number(amount),
			status: initialBill?.status || "Pending",
			created_at: initialBill?.created_at || new Date().toISOString(),
		} as Bill);
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
						billRules.find((r) => r.id.toString() === billRuleId)?.name || "",
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
			<HelperText type="error" visible={!!error}>
				{error}
			</HelperText>
		</AppDialog>
	);
};

const styles = StyleSheet.create({
	input: {
		marginBottom: 8,
	},
});

export default BillForm;
