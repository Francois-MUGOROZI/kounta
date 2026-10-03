import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import AppButton from "./AppButton";
import { FormError } from "./fields";
import { spacing } from "../../theme/theme";
import { haptics } from "../../utils/haptics";
import type { IconName } from "./icons";

/**
 * Increments each time a sheet opens. Key the form body with it so every
 * opening starts from fresh state.
 */
export const useSheetSession = (visible: boolean) => {
	const [session, setSession] = useState(0);
	useEffect(() => {
		if (visible) setSession((s) => s + 1);
	}, [visible]);
	return session;
};

/**
 * Runs a save handler with a pending flag and captures its error message so
 * the form can stay open and show what went wrong.
 */
export const useSubmit = (handler: () => Promise<void>) => {
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const submit = useCallback(async () => {
		if (saving) return;
		setSaving(true);
		setError(null);
		try {
			await handler();
		} catch (e) {
			haptics.error();
			setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
		} finally {
			setSaving(false);
		}
	}, [handler, saving]);
	return { submit, saving, error, setError };
};

interface FormActionsProps {
	onCancel: () => void;
	onSubmit: () => void;
	submitLabel: string;
	saving?: boolean;
	error?: string | null;
	submitIcon?: IconName;
	destructive?: boolean;
}

/** Error banner plus Cancel / primary action row at the end of a form. */
export const FormActions: React.FC<FormActionsProps> = ({
	onCancel,
	onSubmit,
	submitLabel,
	saving,
	error,
	submitIcon = "check",
	destructive,
}) => (
	<View style={styles.wrap}>
		<FormError message={error} />
		<View style={styles.row}>
			<AppButton mode="text" onPress={onCancel} style={styles.cancel}>
				Cancel
			</AppButton>
			<AppButton
				onPress={onSubmit}
				loading={saving}
				icon={submitIcon}
				destructive={destructive}
				style={styles.primary}
			>
				{submitLabel}
			</AppButton>
		</View>
	</View>
);

const styles = StyleSheet.create({
	wrap: {
		marginTop: spacing.sm,
	},
	row: {
		flexDirection: "row",
		gap: spacing.md,
	},
	cancel: {
		flex: 1,
	},
	primary: {
		flex: 2,
	},
});
