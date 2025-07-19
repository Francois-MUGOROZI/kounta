import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Liability } from "../types";
import { formatAmount } from "../utils/currency";

interface LiabilityListItemProps {
	liability: Liability;
	typeName: string;
	onEdit: () => void;
	onDelete: () => void;
}

const LiabilityListItem: React.FC<LiabilityListItemProps> = ({
	liability,
	typeName,
	onEdit,
	onDelete,
}) => {
	const theme = useTheme();
	return (
		<SwipeableListItem
			onEdit={onEdit}
			onDelete={onDelete}
			style={styles.container}
		>
			<View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
				<View style={styles.info}>
					<Text variant="titleMedium">{liability.name}</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{typeName}
					</Text>
					{liability.notes ? (
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							{liability.notes}
						</Text>
					) : null}
				</View>
				<View style={styles.balance}>
					<Text variant="titleMedium">
						{formatAmount(liability.current_balance, liability.currency)}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						of {formatAmount(liability.total_amount, liability.currency)}
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
	balance: {
		marginLeft: 16,
		alignItems: "flex-end",
	},
});

export default LiabilityListItem;
