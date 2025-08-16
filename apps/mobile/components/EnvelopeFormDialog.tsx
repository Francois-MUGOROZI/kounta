import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
	Portal,
	Dialog,
	TextInput,
	Button,
	HelperText,
	useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
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
	const theme = useTheme();
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
		<Portal>
			<Dialog visible={visible} onDismiss={onClose}>
				<Dialog.Title>
					{initialEnvelope ? "Edit Envelope" : "Add Envelope"}
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
						label="Purpose (optional)"
						value={purpose}
						onChangeText={setPurpose}
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

export default EnvelopeFormDialog;
