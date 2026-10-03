import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import IconBadge from "./IconBadge";
import type { IconName } from "./icons";
import { radius, spacing, useKTheme } from "../../theme/theme";

export interface RowAction {
	label: string;
	icon: IconName;
	onPress: () => void;
	color?: string;
	background?: string;
	disabled?: boolean;
}

/** Evenly spaced tiles for a screen's primary actions. */
const ActionRow: React.FC<{ actions: RowAction[] }> = ({ actions }) => {
	const theme = useKTheme();
	return (
		<View style={styles.row}>
			{actions.map((a) => (
				<Pressable
					key={a.label}
					onPress={a.onPress}
					disabled={a.disabled}
					android_ripple={{ color: theme.colors.surfaceDisabled }}
					accessibilityRole="button"
					accessibilityLabel={a.label}
					style={({ pressed }) => [
						styles.tile,
						{ backgroundColor: theme.colors.surface, borderColor: theme.custom.cardBorder },
						(pressed || a.disabled) && { opacity: a.disabled ? 0.45 : 0.85 },
					]}
				>
					<IconBadge icon={a.icon} color={a.color} background={a.background} size={40} rounded="full" />
					<Text
						variant="labelLarge"
						numberOfLines={1}
						style={{ color: theme.colors.onSurface, marginTop: spacing.sm }}
					>
						{a.label}
					</Text>
				</Pressable>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		gap: spacing.md,
		marginTop: spacing.lg,
	},
	tile: {
		flex: 1,
		alignItems: "center",
		paddingVertical: spacing.lg,
		paddingHorizontal: spacing.xs,
		borderRadius: radius.xl,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},
});

export default ActionRow;
