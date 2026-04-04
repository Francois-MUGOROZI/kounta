import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Entity } from "../types";

interface EntityListItemProps {
	entity: Entity;
	onEdit: () => void;
	onPress?: () => void;
}

const EntityListItem: React.FC<EntityListItemProps> = ({
	entity,
	onEdit,
	onPress,
}) => {
	const theme = useTheme();

	return (
		<SwipeableListItem
			onEdit={onEdit}
			onPress={onPress}
			style={styles.container}
		>
			<View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
				<Avatar.Icon
					size={36}
					icon={entity.is_individual ? "account" : "domain"}
					style={{
						backgroundColor: theme.colors.elevation.level3,
						marginRight: 16,
					}}
					color={theme.colors.primary}
				/>
				<View style={styles.info}>
					<Text variant="titleMedium" style={{ fontWeight: "600" }}>
						{entity.name}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{entity.is_individual ? "Individual" : "Organization"}
					</Text>
					{entity.phone_number ? (
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							{entity.phone_number}
						</Text>
					) : null}
				</View>
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
	info: {
		flex: 1,
	},
});

export default EntityListItem;
