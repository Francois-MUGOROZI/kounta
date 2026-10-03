import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Sheet from "./ui/Sheet";
import { SelectField, TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { getCurrencyPickerOptions } from "../constants/currencies";
import { getAssetTypeIcon } from "../constants/typeIcons";
import { Asset, AssetType } from "../types";
import { radius, spacing, useKTheme } from "../theme/theme";

export interface AssetFormValues {
	name: string;
	asset_type_id: number;
	currency: string;
	/** null clears existing notes. */
	notes: string | null;
}

interface AssetFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	assetTypes: AssetType[];
	/** Present when editing. */
	asset?: Asset | null;
	/** Persist the values; throw to keep the sheet open with the error shown. */
	onSubmit: (values: AssetFormValues) => Promise<void>;
}

const Body: React.FC<Omit<AssetFormSheetProps, "visible">> = ({
	onDismiss,
	assetTypes,
	asset,
	onSubmit,
}) => {
	const theme = useKTheme();
	const editing = !!asset;
	const [name, setName] = useState(asset?.name ?? "");
	const [typeId, setTypeId] = useState<number | null>(
		asset?.asset_type_id ?? assetTypes[0]?.id ?? null
	);
	const [currency, setCurrency] = useState<string | null>(asset?.currency ?? "RWF");
	const [notes, setNotes] = useState(asset?.notes ?? "");
	const [errors, setErrors] = useState<Record<string, string>>({});

	const typeOptions = useMemo(
		() => assetTypes.map((t) => ({ value: t.id, label: t.name, icon: getAssetTypeIcon(t.name) })),
		[assetTypes]
	);
	const currencies = useMemo(getCurrencyPickerOptions, []);

	const { submit, saving, error } = useSubmit(async () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = "Give the asset a name";
		if (!typeId) e.type = "Choose a type";
		if (!editing && !currency) e.currency = "Choose a currency";
		setErrors(e);
		if (Object.keys(e).length) return;
		await onSubmit({
			name: name.trim(),
			asset_type_id: typeId!,
			currency: editing ? asset!.currency : currency!,
			notes: notes.trim() || null,
		});
	});

	return (
		<>
			<TextField label="Asset name" value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" />
			<SelectField label="Type" value={typeId} options={typeOptions} onChange={setTypeId} error={errors.type} icon="shape-outline" />
			{editing ? (
				<View style={[styles.locked, { backgroundColor: theme.colors.surfaceVariant }]}>
					<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
						{`Values are in ${asset!.currency}. The currency can't change once an asset is created.`}
					</Text>
				</View>
			) : (
				<>
					<SelectField
						label="Currency"
						value={currency}
						options={currencies}
						onChange={setCurrency}
						error={errors.currency}
						icon="cash-multiple"
					/>
					<View style={[styles.locked, { backgroundColor: theme.colors.surfaceVariant }]}>
						<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
							The asset starts at zero. Record money you put in with an “Invest” transfer, then set its market value with “Revalue”.
						</Text>
					</View>
				</>
			)}
			<TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel={editing ? "Save changes" : "Add asset"}
			/>
		</>
	);
};

const AssetFormSheet: React.FC<AssetFormSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title={props.asset ? "Edit asset" : "New asset"}
		>
			<Body key={session} {...props} />
		</Sheet>
	);
};

const styles = StyleSheet.create({
	locked: {
		padding: spacing.md,
		borderRadius: radius.md,
		marginBottom: spacing.md,
	},
});

export default AssetFormSheet;
