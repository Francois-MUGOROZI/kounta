import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";

interface TypeListItemProps {
	name: string;
	onEdit: () => void;
	onDelete: () => void;
	style?: ViewStyle;
}

const TypeListItem: React.FC<TypeListItemProps> = ({
	name,
	onEdit,
	onDelete,
	style,
}) => {
	const theme = useTheme();
	const combinedStyle = style
		? StyleSheet.flatten([styles.container, style])
		: styles.container;
	return (
		<SwipeableListItem
			onEdit={onEdit}
			onDelete={onDelete}
			style={combinedStyle}
		>
			<View style={styles.content}>
				<View
					style={[styles.colorDot, { backgroundColor: theme.colors.primary }]}
				/>
				<Text style={styles.name} variant="titleMedium">
					{name}
				</Text>
			</View>
		</SwipeableListItem>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 4,
		borderRadius: 8,
		overflow: "hidden",
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
	},
	colorDot: {
		width: 16,
		height: 16,
		borderRadius: 8,
		marginRight: 12,
	},
	name: {
		flex: 1,
	},
});

export default TypeListItem;
