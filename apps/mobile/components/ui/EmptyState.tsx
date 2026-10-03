import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Button, Text } from "react-native-paper";
import { spacing, useKTheme } from "../../theme/theme";
import IconBadge from "./IconBadge";
import type { IconName } from "./icons";

interface EmptyStateProps {
	icon: IconName;
	title: string;
	message?: string;
	actionLabel?: string;
	onAction?: () => void;
	actionIcon?: IconName;
	tone?: "default" | "error";
	compact?: boolean;
	style?: StyleProp<ViewStyle>;
}

/** Friendly placeholder for empty lists and recoverable errors. */
const EmptyState: React.FC<EmptyStateProps> = ({
	icon,
	title,
	message,
	actionLabel,
	onAction,
	actionIcon,
	tone = "default",
	compact = false,
	style,
}) => {
	const theme = useKTheme();
	const isError = tone === "error";
	return (
		<View
			style={[styles.container, compact && styles.compact, style]}
			accessibilityRole={isError ? "alert" : undefined}
		>
			<IconBadge
				icon={icon}
				size={compact ? 44 : 64}
				rounded="full"
				color={isError ? theme.colors.onErrorContainer : theme.colors.primary}
				background={
					isError ? theme.colors.errorContainer : theme.colors.primaryContainer
				}
			/>
			<Text
				variant="titleMedium"
				style={[styles.title, { color: theme.colors.onSurface }]}
			>
				{title}
			</Text>
			{message ? (
				<Text
					variant="bodyMedium"
					style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
				>
					{message}
				</Text>
			) : null}
			{actionLabel && onAction ? (
				<Button
					mode={isError ? "outlined" : "contained-tonal"}
					onPress={onAction}
					style={styles.action}
					icon={actionIcon ?? (isError ? "refresh" : "plus")}
					buttonColor={isError ? undefined : theme.colors.primaryContainer}
					textColor={isError ? undefined : theme.colors.onPrimaryContainer}
				>
					{actionLabel}
				</Button>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: spacing.xxxl * 1.5,
		paddingHorizontal: spacing.xxl,
	},
	compact: {
		paddingVertical: spacing.xl,
	},
	title: {
		marginTop: spacing.lg,
		textAlign: "center",
	},
	message: {
		marginTop: spacing.xs,
		textAlign: "center",
		maxWidth: 300,
	},
	action: {
		marginTop: spacing.lg,
	},
});

export default EmptyState;
