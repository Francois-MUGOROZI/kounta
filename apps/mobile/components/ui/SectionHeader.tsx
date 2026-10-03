import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { radius, spacing, useKTheme } from "../../theme/theme";

interface SectionHeaderProps {
	title: string;
	actionLabel?: string;
	onAction?: () => void;
	style?: StyleProp<ViewStyle>;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
	title,
	actionLabel,
	onAction,
	style,
}) => {
	const theme = useKTheme();
	return (
		<View style={[styles.row, style]}>
			<Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
				{title}
			</Text>
			{actionLabel && onAction ? (
				<TouchableRipple
					onPress={onAction}
					borderless
					style={styles.action}
					accessibilityRole="button"
				>
					<Text variant="labelLarge" style={{ color: theme.colors.primary }}>
						{actionLabel}
					</Text>
				</TouchableRipple>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: spacing.sm,
		minHeight: 32,
	},
	action: {
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: radius.sm,
	},
});

export default SectionHeader;
