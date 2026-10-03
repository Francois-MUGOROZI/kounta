import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { fontFamily, useKTheme } from "../theme/theme";


export const entityInitials = (name: string) => {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	const first = parts[0][0] ?? "";
	const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
	return (first + last).toUpperCase();
};

/** Initials in a tinted circle; organisations get the secondary tint. */
export const EntityAvatar: React.FC<{
	name: string;
	individual: boolean;
	size?: number;
	onHero?: boolean;
}> = ({ name, individual, size = 40, onHero }) => {
	const theme = useKTheme();
	const bg = onHero
		? "rgba(255,255,255,0.18)"
		: individual
		? theme.colors.primaryContainer
		: theme.colors.secondaryContainer;
	const fg = onHero
		? theme.custom.onHero
		: individual
		? theme.colors.onPrimaryContainer
		: theme.colors.onSecondaryContainer;
	return (
		<View
			style={[avatarStyles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}
			accessibilityElementsHidden
			importantForAccessibility="no"
		>
			<Text style={{ color: fg, fontFamily: fontFamily.semibold, fontSize: Math.round(size * 0.38) }}>
				{entityInitials(name)}
			</Text>
		</View>
	);
};

const avatarStyles = StyleSheet.create({
	circle: {
		alignItems: "center",
		justifyContent: "center",
	},
});
