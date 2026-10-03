import React from "react";
import { StyleSheet, View } from "react-native";
import { Appbar, Text } from "react-native-paper";
import { spacing, useKTheme } from "../theme/theme";

interface AppBarProps {
	title: string;
	subtitle?: string;
	onBack?: () => void;
	/** Large, left-aligned title used on top-level tabs. */
	large?: boolean;
	right?: React.ReactNode;
}

/** Flat header that blends into the screen background. */
const AppBar: React.FC<AppBarProps> = ({ title, subtitle, onBack, large, right }) => {
	const theme = useKTheme();
	return (
		<Appbar.Header
			mode="small"
			elevated={false}
			style={[styles.header, { backgroundColor: theme.colors.background }]}
		>
			{onBack ? (
				<Appbar.BackAction onPress={onBack} accessibilityLabel="Go back" />
			) : null}
			<View style={[styles.titleWrap, !onBack && styles.titleWrapRoot]}>
				<Text
					variant={large ? "headlineSmall" : "titleLarge"}
					numberOfLines={1}
					style={{ color: theme.colors.onBackground }}
					accessibilityRole="header"
				>
					{title}
				</Text>
				{subtitle ? (
					<Text
						variant="bodySmall"
						numberOfLines={1}
						style={{ color: theme.colors.onSurfaceVariant }}
					>
						{subtitle}
					</Text>
				) : null}
			</View>
			{right ? <View style={styles.right}>{right}</View> : null}
		</Appbar.Header>
	);
};

const styles = StyleSheet.create({
	header: {
		paddingRight: spacing.xs,
	},
	titleWrap: {
		flex: 1,
		justifyContent: "center",
	},
	titleWrapRoot: {
		paddingLeft: spacing.lg,
	},
	right: {
		flexDirection: "row",
		alignItems: "center",
	},
});

export default AppBar;
