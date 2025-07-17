import React from "react";
import { View, StyleSheet } from "react-native";
import { List, IconButton, Text } from "react-native-paper";

interface CategoryListItemProps {
	category: { id: number; name: string; transaction_type_id: number };
	onEdit: () => void;
	onDelete: () => void;
}

const CategoryListItem: React.FC<CategoryListItemProps> = ({
	category,
	onEdit,
	onDelete,
}) => {
	return (
		<List.Item
			title={category.name}
			right={(props) => (
				<View style={styles.actions}>
					<IconButton
						icon="pencil"
						size={20}
						onPress={onEdit}
						accessibilityLabel="Edit"
					/>
					<IconButton
						icon="delete"
						size={20}
						onPress={onDelete}
						accessibilityLabel="Delete"
					/>
				</View>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	actions: {
		flexDirection: "row",
		alignItems: "center",
	},
});

export default CategoryListItem;
