import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";

interface TypeListItemProps {
	name: string;
	onEdit: () => void;
	style?: ViewStyle;
}

const TypeListItem: React.FC<TypeListItemProps> = ({ name, onEdit, style }) => {
	const theme = useTheme();
	const combinedStyle = style
		? StyleSheet.flatten([styles.container, style])
		: styles.container;
	return (
		<SwipeableListItem onEdit={onEdit} style={combinedStyle}>
			<View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
				<Avatar.Icon
					size={36}
					icon="tag-outline"
					style={{
						backgroundColor: theme.colors.elevation.level3,
						marginRight: 16,
					}}
					color={theme.colors.primary}
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
	name: {
		flex: 1,
		fontWeight: "600",
	},
});

export default TypeListItem;
