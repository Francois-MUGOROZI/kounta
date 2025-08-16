import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import { Envelope } from "../types";
import { formatAmount } from "@/utils/currency";

interface EnvelopeListItemProps {
	envelope: Envelope;
	onEdit: () => void;
	onDelete: () => void;
}

const EnvelopeListItem: React.FC<EnvelopeListItemProps> = ({
	envelope,
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
			<View style={styles.content}>
				<View style={styles.info}>
					<Text variant="titleMedium">{envelope.name}</Text>
					<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
						{envelope.purpose}
					</Text>
				</View>
				<View style={styles.balance}>
					<Text variant="titleSmall">
						{envelope.currency} {envelope.total_amount.toLocaleString()} |{" "}
						{envelope.current_balance.toLocaleString()}
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

export default EnvelopeListItem;
