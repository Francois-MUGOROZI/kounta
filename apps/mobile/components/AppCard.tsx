import React from "react";
import { StyleSheet, ViewStyle, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

interface AppCardProps {
	children: React.ReactNode;
	style?: ViewStyle;
	variant?: "standard" | "hero";
	title?: string;
	subtitle?: string;
	icon?: string;
	onPress?: () => void;
}

const AppCard: React.FC<AppCardProps> = ({
	children,
	style,
	variant = "standard",
	title,
	subtitle,
	icon,
	onPress,
}) => {
	const theme = useTheme();

	const isHero = variant === "hero";
	// Use theme colors for Hero variant instead of hardcoded values
	const backgroundColor = isHero ? theme.colors.primary : theme.colors.surface;
	const textColor = isHero ? theme.colors.onPrimary : theme.colors.onSurface;
	const subtitleColor = isHero
		? theme.colors.onPrimary
		: theme.colors.onSurfaceVariant;

	return (
		<Card
			style={[
				styles.card,
				{
					backgroundColor,
					borderColor: isHero ? "transparent" : theme.colors.outline,
					borderWidth: isHero ? 0 : 0.5,
				},
				style,
			]}
			elevation={isHero ? 4 : 1}
			onPress={onPress}
		>
			<Card.Content style={styles.content}>
				{(title || subtitle) && (
					<View style={styles.header}>
						<View>
							{title && (
								<Text
									variant="titleMedium"
									style={{ color: textColor, fontWeight: "600" }}
								>
									{title}
								</Text>
							)}
							{subtitle && (
								<Text variant="bodySmall" style={{ color: subtitleColor }}>
									{subtitle}
								</Text>
							)}
						</View>
						{/* Icon support can be added here if needed */}
					</View>
				)}
				{children}
			</Card.Content>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		marginBottom: 12,
	},
	content: {
		paddingVertical: 16,
		paddingHorizontal: 16,
	},
	header: {
		marginBottom: 12,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
});

export default AppCard;
