import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme, Divider, IconButton } from "react-native-paper";

interface CollapsibleSectionProps {
	title: string;
	children: React.ReactNode;
	defaultExpanded?: boolean;
	showCount?: number;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
	title,
	children,
	defaultExpanded = false,
	showCount,
}) => {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const theme = useTheme();

	const toggleExpanded = () => {
		setExpanded(!expanded);
	};

	const countText =
		showCount !== undefined && showCount > 0 ? ` (${showCount})` : "";

	return (
		<View style={styles.container}>
			<Divider style={styles.divider} />
			<View
				style={[
					styles.wrapper,
					{ backgroundColor: theme.colors.surfaceVariant },
				]}
			>
				<TouchableOpacity
					onPress={toggleExpanded}
					style={styles.header}
					activeOpacity={0.7}
				>
					<Text variant="titleSmall" style={styles.title}>
						{title}
						{countText}
					</Text>
					<IconButton
						icon={expanded ? "chevron-up" : "chevron-down"}
						size={20}
						onPress={toggleExpanded}
						style={styles.iconButton}
					/>
				</TouchableOpacity>
				{expanded && <View style={styles.content}>{children}</View>}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginTop: 8,
	},
	divider: {
		marginVertical: 12,
	},
	wrapper: {
		borderRadius: 8,
		overflow: "hidden",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	title: {
		fontWeight: "600",
		flex: 1,
	},
	iconButton: {
		margin: 0,
	},
	content: {
		paddingTop: 0,
		paddingBottom: 12,
		paddingHorizontal: 12,
	},
});

export default CollapsibleSection;
