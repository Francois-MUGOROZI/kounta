import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { radius, spacing, useKTheme } from "../../theme/theme";

interface CardProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
	onLongPress?: () => void;
	padded?: boolean;
	accessibilityLabel?: string;
}

/** Flat surface with a hairline border — the base container of every screen. */
const Card: React.FC<CardProps> = ({
	children,
	style,
	onPress,
	onLongPress,
	padded = true,
	accessibilityLabel,
}) => {
	const theme = useKTheme();
	const containerStyle = [
		styles.card,
		{
			backgroundColor: theme.colors.surface,
			borderColor: theme.custom.cardBorder,
		},
		padded && styles.padded,
		style,
	];

	if (!onPress && !onLongPress) {
		return <View style={containerStyle}>{children}</View>;
	}

	return (
		<View style={[styles.clip, { borderRadius: radius.xl }]}>
			<Pressable
				onPress={onPress}
				onLongPress={onLongPress}
				android_ripple={{ color: theme.colors.surfaceDisabled }}
				accessibilityRole="button"
				accessibilityLabel={accessibilityLabel}
				style={({ pressed }) => [
					containerStyle,
					pressed && { opacity: 0.92 },
				]}
			>
				{children}
			</Pressable>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: radius.xl,
		borderWidth: StyleSheet.hairlineWidth,
	},
	padded: {
		padding: spacing.lg,
	},
	clip: {
		overflow: "hidden",
	},
});

export default Card;
