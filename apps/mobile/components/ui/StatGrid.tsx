import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import { radius, spacing, tabularNums, useKTheme } from "../../theme/theme";

export interface Stat {
	label: string;
	value: string;
	tone?: "default" | "income" | "expense" | "warning" | "muted";
	/** Small line under the value, e.g. a percentage. */
	caption?: string;
}

/** Two-column grid of labelled figures inside a card. */
const StatGrid: React.FC<{ items: Stat[]; style?: StyleProp<ViewStyle> }> = ({ items, style }) => {
	const theme = useKTheme();
	const color = (tone: Stat["tone"]) =>
		tone === "income"
			? theme.custom.income
			: tone === "expense"
			? theme.custom.expense
			: tone === "warning"
			? theme.custom.warning
			: tone === "muted"
			? theme.colors.onSurfaceVariant
			: theme.colors.onSurface;
	return (
		<View
			style={[
				styles.grid,
				{ backgroundColor: theme.colors.surface, borderColor: theme.custom.cardBorder },
				style,
			]}
		>
			{items.map((item, i) => (
				<View
					key={item.label}
					style={[
						styles.cell,
						i % 2 === 1 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.colors.outlineVariant },
						i >= 2 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant },
					]}
				>
					<Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
						{item.label}
					</Text>
					<Text
						variant="titleSmall"
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.75}
						style={{ color: color(item.tone), marginTop: 2, ...tabularNums }}
					>
						{item.value}
					</Text>
					{item.caption ? (
						<Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
							{item.caption}
						</Text>
					) : null}
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		borderRadius: radius.xl,
		borderWidth: StyleSheet.hairlineWidth,
		marginTop: spacing.lg,
		overflow: "hidden",
	},
	cell: {
		width: "50%",
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
});

export default StatGrid;
