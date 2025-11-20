import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
	TextInput,
	Button,
	HelperText,
	Text,
	useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { Asset } from "../types";
import { getPopularCurrencyOptions } from "../constants/currencies";
import AppDialog from "./AppDialog";
import AppTextInput from "./AppTextInput";
import AppNumberInput from "./AppNumberInput";

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

	const selectedTypeLabel =
		assetTypes.find((type) => type.id.toString() === typeId)?.name || "";

	return (
		<AppDialog
			visible={visible}
			onDismiss={onClose}
			title={initialAsset ? "Edit Asset" : "Add Asset"}
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
				error={error && !name.trim() ? "Name is required" : undefined}
			/>
			<Dropdown
				label={"Asset Type"}
				value={typeId}
				onSelect={(v) => setTypeId(v ?? "")}
				options={assetTypes.map((type) => ({
					label: type.name,
					value: type.id.toString(),
				}))}
				error={!!error && !typeId}
				CustomMenuHeader={() => null}
				CustomDropdownInput={(props) =>
					renderDropdownInput(props, selectedTypeLabel, "Asset Type")
				}
			/>
			<Dropdown
				label={"Currency"}
				value={currency}
				onSelect={(v) => setCurrency(v ?? "")}
				options={getPopularCurrencyOptions()}
				error={!!error && !currency}
				CustomMenuHeader={() => null}
				CustomDropdownInput={(props) =>
					renderDropdownInput(props, currency, "Currency")
				}
			/>
			<AppNumberInput
				label="Initial Value"
				value={initialValue}
				onChangeText={setInitialValue}
				currency={currency || "RWF"}
				error={
					error && (!initialValue || isNaN(Number(initialValue)))
						? "Valid initial value required"
						: undefined
				}
			/>
			<AppNumberInput
				label="Current Value"
				value={currentValue}
				onChangeText={setCurrentValue}
				currency={currency || "RWF"}
				error={
					error && (!currentValue || isNaN(Number(currentValue)))
						? "Valid current value required"
						: undefined
				}
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

const styles = StyleSheet.create({
	input: {
		marginBottom: 8,
	},
});

export default AssetFormDialog;
