import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Button } from "react-native-paper";
import { radius, useKTheme } from "../../theme/theme";
import type { IconName } from "./icons";

interface AppButtonProps {
	children: string;
	onPress: () => void;
	mode?: "contained" | "contained-tonal" | "outlined" | "text";
	icon?: IconName;
	loading?: boolean;
	disabled?: boolean;
	destructive?: boolean;
	compact?: boolean;
	style?: StyleProp<ViewStyle>;
	accessibilityLabel?: string;
}

/** Paper button with Kounta sizing; disabled while `loading` to block double taps. */
const AppButton: React.FC<AppButtonProps> = ({
	children,
	onPress,
	mode = "contained",
	icon,
	loading,
	disabled,
	destructive,
	compact,
	style,
	accessibilityLabel,
}) => {
	const theme = useKTheme();
	const destructiveColors =
		destructive && mode === "contained"
			? { buttonColor: theme.colors.error, textColor: theme.colors.onError }
			: destructive
			? { textColor: theme.colors.error }
			: {};
	return (
		<Button
			mode={mode}
			icon={icon}
			onPress={onPress}
			loading={loading}
			disabled={disabled || loading}
			compact={compact}
			style={[styles.button, style]}
			contentStyle={compact ? styles.compactContent : styles.content}
			accessibilityLabel={accessibilityLabel}
			{...destructiveColors}
		>
			{children}
		</Button>
	);
};

const styles = StyleSheet.create({
	button: {
		borderRadius: radius.pill,
	},
	content: {
		height: 50,
		paddingHorizontal: 8,
	},
	compactContent: {
		height: 38,
	},
});

export default AppButton;
