import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, Avatar } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Bill, BillStatus } from "../types";
import { formatAmount } from "../utils/currency";

interface BillListItemProps {
	bill: Bill;
	categoryName: string;
	onEdit: () => void;
	onMarkAsPaid?: () => void;
}

const BillListItem: React.FC<BillListItemProps> = ({
	bill,
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
		<SwipeableListItem
			onEdit={onEdit}
			onComplete={bill.status !== "Paid" ? onMarkAsPaid : undefined}
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
					color={getStatusColor(bill.status)}
				/>
				<View style={styles.info}>
					<Text variant="titleMedium" style={{ fontWeight: "600" }}>
						{bill.name}
					</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{categoryName} • Due: {formatDate(bill.due_date)}
					</Text>
					{bill.paid_amount > 0 && bill.status !== "Paid" && (
						<Text
							variant="bodySmall"
							style={{ color: theme.colors.primary, marginTop: 2 }}
						>
							Paid: {formatAmount(bill.paid_amount, bill.currency)} /{" "}
							{formatAmount(bill.amount, bill.currency)}
						</Text>
					)}
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
					<View style={{ flexDirection: "row", alignItems: "center" }}>
						<Text
							variant="bodySmall"
							style={{
								color: getStatusColor(bill.status),
								fontSize: 10,
							}}
						>
							{bill.status}
						</Text>
					</View>
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
