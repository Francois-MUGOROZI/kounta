import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar, Switch } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { BillRule } from "../types";
import { formatAmount } from "@/utils/currency";

interface BillRuleListItemProps {
	billRule: BillRule;
	categoryName: string;
	onEdit: () => void;
	onToggleActive: (isActive: boolean) => void;
}

const BillRuleListItem: React.FC<BillRuleListItemProps> = ({
	billRule,
	categoryName,
	onEdit,
	onToggleActive,
}) => {
	const theme = useTheme();

	return (
		<SwipeableListItem
			onEdit={onEdit}
			style={styles.container}
		>
			<View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
				<Avatar.Icon
					size={36}
					icon="receipt"
					style={{
						backgroundColor: theme.colors.elevation.level3,
						marginRight: 16,
					}}
					color={
						billRule.is_active ? theme.colors.primary : theme.colors.outline
					}
				/>
				<View style={styles.info}>
					<Text variant="titleMedium" style={{ fontWeight: "600" }}>
						{billRule.name}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{categoryName} • {billRule.frequency}
					</Text>
				</View>
				<View style={styles.rightSection}>
					<Text
						variant="titleMedium"
						style={{
							fontWeight: "bold",
							color: theme.colors.primary,
							marginBottom: 4,
						}}
					>
						{formatAmount(billRule.amount, billRule.currency)}
					</Text>
					<Switch value={billRule.is_active} onValueChange={onToggleActive} />
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
	rightSection: {
		marginLeft: 16,
		alignItems: "flex-end",
	},
});

export default BillRuleListItem;
