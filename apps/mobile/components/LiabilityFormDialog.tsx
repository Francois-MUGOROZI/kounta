import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
	Portal,
	Dialog,
	TextInput,
	Button,
	HelperText,
	Text,
	useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { Liability } from "../types";
import { getPopularCurrencyOptions } from "../constants/currencies";

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
	const theme = useTheme();
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
		<Portal>
			<Dialog visible={visible} onDismiss={onClose}>
				<Dialog.Title>
					{initialLiability ? "Edit Liability" : "Add Liability"}
				</Dialog.Title>
				<Dialog.Content
					style={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<TextInput
						label="Name"
						value={name}
						onChangeText={setName}
						style={styles.input}
						autoFocus
					/>
					<Dropdown
						label={"Liability Type"}
						value={typeId}
						onSelect={(v) => setTypeId(v ?? "")}
						options={liabilityTypes.map((type) => ({
							label: type.name,
							value: type.id.toString(),
						}))}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								value={
									liabilityTypes.find((type) => type.id.toString() === typeId)
										?.name || ""
								}
								style={{
									backgroundColor: theme.colors.outlineVariant,
									marginBottom: 8,
								}}
								outlineColor={theme.colors.primary}
								activeOutlineColor={theme.colors.primary}
							/>
						)}
					/>
					<Dropdown
						label={"Currency"}
						value={currency}
						onSelect={(v) => setCurrency(v ?? "")}
						options={getPopularCurrencyOptions()}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								style={{
									backgroundColor: theme.colors.outlineVariant,
									marginBottom: 8,
								}}
								autoCapitalize="characters"
								outlineColor={theme.colors.primary}
								activeOutlineColor={theme.colors.primary}
								value={currency}
							/>
						)}
					/>
					<TextInput
						label="Total Amount"
						value={totalAmount}
						onChangeText={setTotalAmount}
						style={styles.input}
						keyboardType="numeric"
					/>
					<TextInput
						label="Current Balance"
						value={currentBalance}
						onChangeText={setCurrentBalance}
						style={styles.input}
						keyboardType="numeric"
					/>
					<TextInput
						label="Notes (optional)"
						value={notes}
						onChangeText={setNotes}
						style={styles.input}
						multiline
					/>
					<HelperText type="error" visible={!!error}>
						{error}
					</HelperText>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onClose}>Cancel</Button>
					<Button mode="contained" onPress={handleSave}>
						Save
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	input: {
		marginBottom: 8,
	},
});

export default LiabilityFormDialog;
