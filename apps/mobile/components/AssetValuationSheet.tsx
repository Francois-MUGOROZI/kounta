import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Sheet from "./ui/Sheet";
import { AmountField } from "./ui/fields";
import { FormActions, useSheetSession, useSubmit } from "./ui/form";
import { Asset } from "../types";
import { formatAmount, formatSignedAmount } from "../utils/currency";
import { calcPercentChange, formatPercent } from "../utils/percent";
import { radius, spacing, useKTheme } from "../theme/theme";

interface AssetValuationSheetProps {
	visible: boolean;
	onDismiss: () => void;
	asset: Asset;
	/** Persist the new market value; throw to keep the sheet open. */
	onSubmit: (newValuation: number) => Promise<void>;
}

const Body: React.FC<Omit<AssetValuationSheetProps, "visible">> = ({
	onDismiss,
	asset,
	onSubmit,
}) => {
	const theme = useKTheme();
	const [value, setValue] = useState(String(asset.current_valuation));
	const [fieldError, setFieldError] = useState<string | null>(null);

	const parsed = Number(value);
	const valid = value !== "" && !isNaN(parsed) && parsed >= 0;
	const change = valid ? parsed - asset.current_valuation : 0;
	const changePct = valid ? formatPercent(calcPercentChange(parsed, asset.current_valuation)) : null;

	const { submit, saving, error } = useSubmit(async () => {
		if (!valid) {
			setFieldError("Enter the value as zero or more");
			return;
		}
		setFieldError(null);
		await onSubmit(parsed);
	});

	return (
		<>
			<AmountField
				size="hero"
				label="Market value today"
				value={value}
				onChangeText={setValue}
				currency={asset.currency}
				error={fieldError}
				autoFocus
			/>
			<View style={[styles.note, { backgroundColor: theme.colors.surfaceVariant }]}>
				<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
					{`Currently ${formatAmount(asset.current_valuation, asset.currency)}.`}
					{valid && change !== 0
						? ` That's ${formatSignedAmount(change, asset.currency)}${changePct ? ` (${changePct})` : ""}.`
						: ""}
					{" Revaluing doesn't move any money — it only updates what the asset is worth."}
				</Text>
			</View>
			<FormActions
				onCancel={onDismiss}
				onSubmit={submit}
				saving={saving}
				error={error}
				submitLabel="Update value"
			/>
		</>
	);
};

const AssetValuationSheet: React.FC<AssetValuationSheetProps> = (props) => {
	const session = useSheetSession(props.visible);
	return (
		<Sheet
			visible={props.visible}
			onDismiss={props.onDismiss}
			title="Revalue asset"
			subtitle={props.asset.name}
		>
			<Body key={session} {...props} />
		</Sheet>
	);
};

const styles = StyleSheet.create({
	note: {
		padding: spacing.md,
		borderRadius: radius.md,
		marginBottom: spacing.md,
	},
});

export default AssetValuationSheet;
