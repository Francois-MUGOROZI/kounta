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
import { Asset } from "../types";
import { getPopularCurrencyOptions } from "../constants/currencies";

interface AssetFormDialogProps {
	visible: boolean;
	onClose: () => void;
	onSubmit: (data: {
		name: string;
		asset_type_id: number;
		currency: string;
		initial_value: number;
		current_value: number;
		notes?: string;
	}) => void;
	assetTypes: { id: number; name: string }[];
	initialAsset?: Asset | null;
}

const AssetFormDialog: React.FC<AssetFormDialogProps> = ({
	visible,
	onClose,
	onSubmit,
	assetTypes,
	initialAsset,
}) => {
	const theme = useTheme();
	const [name, setName] = useState("");
	const [typeId, setTypeId] = useState<string>("");
	const [currency, setCurrency] = useState("");
	const [initialValue, setInitialValue] = useState("");
	const [currentValue, setCurrentValue] = useState("");
	const [notes, setNotes] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (initialAsset) {
			setName(initialAsset.name);
			setTypeId(initialAsset.asset_type_id.toString());
			setCurrency(initialAsset.currency);
			setInitialValue(initialAsset.initial_value.toString());
			setCurrentValue(initialAsset.current_value.toString());
			setNotes(initialAsset.notes || "");
		} else {
			setName("");
			setTypeId(assetTypes[0]?.id?.toString() ?? "");
			setCurrency("");
			setInitialValue("");
			setCurrentValue("");
			setNotes("");
		}
		setError("");
	}, [visible, initialAsset, assetTypes]);

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
		if (!initialValue || isNaN(Number(initialValue))) {
			setError("Initial value must be a number");
			return;
		}
		if (!currentValue || isNaN(Number(currentValue))) {
			setError("Current value must be a number");
			return;
		}
		onSubmit({
			name: name.trim(),
			asset_type_id: Number(typeId),
			currency: currency.trim().toUpperCase(),
			initial_value: Number(initialValue),
			current_value: Number(currentValue),
			notes: notes.trim() || undefined,
		});
	};

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onClose}>
				<Dialog.Title>{initialAsset ? "Edit Asset" : "Add Asset"}</Dialog.Title>
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
						label={"Asset Type"}
						value={typeId}
						onSelect={(v) => setTypeId(v ?? "")}
						options={assetTypes.map((type) => ({
							label: type.name,
							value: type.id.toString(),
						}))}
						error={!!error}
						CustomMenuHeader={() => null}
						CustomDropdownInput={(props) => (
							<TextInput
								{...props}
								value={
									assetTypes.find((type) => type.id.toString() === typeId)
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
						label="Initial Value"
						value={initialValue}
						onChangeText={setInitialValue}
						style={styles.input}
						keyboardType="numeric"
					/>
					<TextInput
						label="Current Value"
						value={currentValue}
						onChangeText={setCurrentValue}
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

export default AssetFormDialog;
