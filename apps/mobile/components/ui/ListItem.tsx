import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { spacing, useKTheme } from "../../theme/theme";

interface ListItemProps {
	title: string;
	subtitle?: string;
	left?: React.ReactNode;
	/** Primary trailing content, usually an <AmountText />. */
	right?: React.ReactNode;
	/** Secondary trailing line under `right`. */
	rightCaption?: string;
	chevron?: boolean;
	onPress?: () => void;
	onLongPress?: () => void;
	style?: StyleProp<ViewStyle>;
	titleLines?: number;
	accessibilityLabel?: string;
}

/** Standard tappable row: leading visual, two lines of text, trailing value. */
const ListItem: React.FC<ListItemProps> = ({
	title,
	subtitle,
	left,
	right,
	rightCaption,
	chevron,
	onPress,
	onLongPress,
	style,
	titleLines = 1,
	accessibilityLabel,
}) => {
	const theme = useKTheme();
	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			disabled={!onPress && !onLongPress}
			android_ripple={{ color: theme.colors.surfaceDisabled }}
			accessibilityRole={onPress ? "button" : undefined}
			accessibilityLabel={accessibilityLabel}
			style={({ pressed }) => [
				styles.row,
				pressed && { backgroundColor: theme.colors.surfaceVariant },
				style,
			]}
		>
			{left ? <View style={styles.left}>{left}</View> : null}
			<View style={styles.body}>
				<Text
					variant="titleSmall"
					numberOfLines={titleLines}
					style={{ color: theme.colors.onSurface }}
				>
					{title}
				</Text>
				{subtitle ? (
					<Text
						variant="bodySmall"
						numberOfLines={1}
						style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
					>
						{subtitle}
					</Text>
				) : null}
			</View>
			{right || rightCaption ? (
				<View style={styles.right}>
					{right}
					{rightCaption ? (
						<Text
							variant="bodySmall"
							numberOfLines={1}
							style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
						>
							{rightCaption}
						</Text>
					) : null}
				</View>
			) : null}
			{chevron ? (
				<MaterialCommunityIcons
					name="chevron-right"
					size={20}
					color={theme.colors.outline}
					style={styles.chevron}
				/>
			) : null}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		minHeight: 64,
	},
	left: {
		marginRight: spacing.md,
	},
	body: {
		flex: 1,
		justifyContent: "center",
	},
	subtitle: {
		marginTop: 2,
	},
	right: {
		alignItems: "flex-end",
		marginLeft: spacing.md,
		flexShrink: 0,
	},
	chevron: {
		marginLeft: spacing.xs,
		marginRight: -spacing.xs,
	},
});

export default ListItem;
