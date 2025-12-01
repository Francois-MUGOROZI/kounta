import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar, Chip } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Bill, BillStatus } from "../types";
import { formatAmount } from "@/utils/currency";

interface BillListItemProps {
	bill: Bill;
	billRuleName: string;
	categoryName: string;
	onEdit: () => void;
	onMarkAsPaid?: () => void;
}

const BillListItem: React.FC<BillListItemProps> = ({
	bill,
	billRuleName,
	categoryName,
	onEdit,
	onMarkAsPaid,
}) => {
	const theme = useTheme();

	const getStatusColor = (status: BillStatus) => {
		switch (status) {
			case "Paid":
				return theme.colors.primary;
			case "Overdue":
				return theme.colors.error;
			case "Pending":
			default:
				return theme.colors.secondary;
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	return (
		<SwipeableListItem onEdit={onEdit} style={styles.container}>
			<View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
				<Avatar.Icon
					size={36}
					icon="receipt"
					style={{
						backgroundColor: theme.colors.elevation.level3,
						marginRight: 16,
					}}
					color={getStatusColor(bill.status)}
				/>
				<View style={styles.info}>
					<Text variant="titleMedium" style={{ fontWeight: "600" }}>
						{billRuleName}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{categoryName} • Due: {formatDate(bill.due_date)}
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
						{formatAmount(bill.amount, bill.currency ?? "RWF")}
					</Text>
					<Chip
						mode="flat"
						style={{
							backgroundColor: getStatusColor(bill.status),
						}}
						textStyle={{ fontSize: 10, color: theme.colors.onPrimary }}
					>
						{bill.status}
					</Chip>
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

export default BillListItem;
