import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Asset } from "../types";
import { formatAmount } from "../utils/currency";

interface AssetListItemProps {
	asset: Asset;
	typeName: string;
	onEdit: () => void;
	onDelete: () => void;
}

const AssetListItem: React.FC<AssetListItemProps> = ({
	asset,
	typeName,
	onEdit,
	onDelete,
}) => {
	const theme = useTheme();
	const getIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case "cash":
				return "cash";
			case "bank":
				return "bank";
			case "real estate":
				return "home-city";
			case "vehicle":
				return "car";
			case "investment":
				return "chart-line";
			default:
				return "briefcase";
		}
	};

	return (
		<SwipeableListItem
			onEdit={onEdit}
			onDelete={onDelete}
			style={styles.container}
		>
			<View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
				<Avatar.Icon
					size={36}
					icon={getIcon(typeName)}
					style={{ backgroundColor: theme.colors.elevation.level3, marginRight: 16 }}
					color={theme.colors.primary}
				/>
				<View style={styles.info}>
					<Text variant="titleMedium" style={{ fontWeight: "600" }}>
						{asset.name}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{typeName}
					</Text>
					{asset.notes ? (
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							{asset.notes}
						</Text>
					) : null}
				</View>
				<View style={styles.value}>
					<Text
						variant="titleMedium"
						style={{
							fontWeight: "bold",
							color: theme.colors.primary,
						}}
					>
						{formatAmount(asset.current_value, asset.currency)}
					</Text>
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
	value: {
		marginLeft: 16,
		alignItems: "flex-end",
	},
});

export default AssetListItem;
