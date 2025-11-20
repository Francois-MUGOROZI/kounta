import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, IconButton } from "react-native-paper";
import SwipeableListItem from "./SwipeableListItem";
import AddToEnvelopeDialog from "./AddToEnvelopeDialog";
import { Envelope } from "../types";
import { useAddToEnvelope } from "@/hooks/envelope/useAddToEnvelope";

interface EnvelopeListItemProps {
	envelope: Envelope;
	onEdit: () => void;
	onDelete: () => void;
	onEnvelopeUpdated?: () => void;
}

const EnvelopeListItem: React.FC<EnvelopeListItemProps> = ({
	envelope,
	onEdit,
	onDelete,
	onEnvelopeUpdated,
}) => {
	const theme = useTheme();
	const [showAddDialog, setShowAddDialog] = useState(false);
	const { addToEnvelope, loading } = useAddToEnvelope();

	const handleAddToEnvelope = async (envelopeId: number, amount: number) => {
		await addToEnvelope(envelopeId, amount);
		setShowAddDialog(false);
		onEnvelopeUpdated?.();
	};

	return (
		<>
			<SwipeableListItem
				onEdit={onEdit}
				onDelete={onDelete}
				style={styles.container}
			>
				<View style={styles.content}>
					<View style={styles.topRow}>
						<View style={styles.titleContainer}>
							<Text variant="titleMedium">{envelope.name}</Text>
						</View>
						<View style={styles.balanceContainer}>
							<Text variant="titleSmall">
								{envelope.currency} {envelope.total_amount.toLocaleString()} |{" "}
								{envelope.current_balance.toLocaleString()}
							</Text>
						</View>
					</View>
					<View style={styles.descriptionRow}>
						<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
							{envelope.purpose}
						</Text>
					</View>
					<View style={styles.actionsRow}>
						<IconButton
							icon="plus"
							size={16}
							onPress={() => setShowAddDialog(true)}
							disabled={loading}
						/>
					</View>
				</View>
			</SwipeableListItem>
			<AddToEnvelopeDialog
				visible={showAddDialog}
				onClose={() => setShowAddDialog(false)}
				onSubmit={handleAddToEnvelope}
				envelope={envelope}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 4,
		borderRadius: 8,
		overflow: "hidden",
	},
	content: {
		padding: 0,
	},
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	titleContainer: {
		flex: 1,
	},
	balanceContainer: {
		alignItems: "flex-end",
	},
	descriptionRow: {
		marginBottom: 0,
	},
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		height: 40,
	},
});

export default EnvelopeListItem;
