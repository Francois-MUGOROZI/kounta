import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Category } from "../types";

interface CategoryListItemProps {
	category: Category;
	typeName: string;
	onEdit: () => void;
}

const CategoryListItem: React.FC<CategoryListItemProps> = ({
	category,
	typeName,
	onEdit,
}) => {
	const theme = useTheme();
	return (
		<SwipeableListItem onEdit={onEdit} style={styles.container}>
			<View style={styles.content}>
				<View
					style={[styles.colorDot, { backgroundColor: theme.colors.primary }]}
				/>
				<Text variant="titleMedium" style={styles.name}>
					{category.name}
				</Text>
				<Text variant="bodySmall" style={styles.type}>
					{typeName}
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
	type: {
		marginLeft: 8,
		color: "#888",
	},
});

export default CategoryListItem;
