import React, { useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import Sheet from "./ui/Sheet";
import { SegmentedControl, TextField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import IconBadge from "./ui/IconBadge";
import { getCategoryIcon } from "../constants/categoryIcons";
import { Category, TransactionType } from "../types";
import { spacing, useKTheme } from "../theme/theme";

export interface CategoryFormValues {
	name: string;
	transaction_type_id: number;
}

interface CategoryFormSheetProps {
	visible: boolean;
	onDismiss: () => void;
	transactionTypes: TransactionType[];
	/** Pre-selected type for a new category. */
	defaultTypeId?: number;
	/** Present when editing. */
	category?: Category | null;
	/** Persist the values; throw to keep the sheet open with the error shown. */
	onSubmit: (values: CategoryFormValues) => Promise<void>;
}

const Body: React.FC<Omit<CategoryFormSheetProps, "visible">> = ({
	onDismiss,
	transactionTypes,
	defaultTypeId,
	category,
	onSubmit,
}) => {
	const theme = useKTheme();
	const [name, setName] = useState(category?.name ?? "");
	const [typeId, setTypeId] = useState<number | undefined>(
		category?.transaction_type_id ?? defaultTypeId ?? transactionTypes[0]?.id
	);
	const [nameError, setNameError] = useState<string | undefined>();

	const typeName = transactionTypes.find((t) => t.id === typeId)?.name;
	const kind = typeName === "Income" ? "income" : "expense";

	const { submit, saving, error } = useSubmit(async () => {
		if (!name.trim()) {
			setNameError("Give the category a name");
			return;
		}
		setNameError(undefined);
		if (!typeId) throw new Error("Choose whether this is for expenses or income");
		await onSubmit({ name: name.trim(), transaction_type_id: typeId });
	});

	return (
		<>
			<SegmentedControl<string>
				value={typeId !== undefined ? String(typeId) : ""}
				onChange={(v) => setTypeId(Number(v))}
				segments={transactionTypes.map((t) => ({
					value: String(t.id),
					label: t.name,
					color:
						t.name === "Income"
							? theme.custom.income
							: t.name === "Transfer"
							? theme.custom.transfer
							: theme.custom.expense,
				}))}
			/>
			<TextField
				label="Category name"
				value={name}
				onChangeText={setName}
				error={nameError}
				autoCapitalize="sentences"
				autoFocus={!category}
			/>
			{name.trim() ? (
				<View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
					<IconBadge icon={getCategoryIcon(name, kind)} size={32} />
					<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: spacing.sm, flex: 1 }}>
						The icon is picked from the name.
					</Text>
				</View>
			) : null}
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel={category ? "Save changes" : "Add category"}
			/>
		</>
	);
};

const CategoryFormSheet: React.FC<CategoryFormSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title={props.category ? "Edit category" : "New category"}
		>
			<Body key={session} {...props} />
		</Sheet>
	);
};

export default CategoryFormSheet;
