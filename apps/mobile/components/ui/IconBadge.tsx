import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useKTheme } from "../../theme/theme";
import type { IconName } from "./icons";

interface IconBadgeProps {
	icon: IconName;
	color?: string;
	background?: string;
	size?: number;
	rounded?: "full" | "squircle";
}

/** Tinted icon tile used as the leading visual of list rows and cards. */
const IconBadge: React.FC<IconBadgeProps> = ({
	icon,
	color,
	background,
	size = 40,
	rounded = "squircle",
}) => {
	const theme = useKTheme();
	return (
		<View
			style={[
				styles.badge,
				{
					width: size,
					height: size,
					borderRadius: rounded === "full" ? size / 2 : size * 0.32,
					backgroundColor: background ?? theme.colors.primaryContainer,
				},
			]}
		>
			<MaterialCommunityIcons
				name={icon}
				size={Math.round(size * 0.5)}
				color={color ?? theme.colors.onPrimaryContainer}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	badge: {
		alignItems: "center",
		justifyContent: "center",
	},
});

export default IconBadge;
