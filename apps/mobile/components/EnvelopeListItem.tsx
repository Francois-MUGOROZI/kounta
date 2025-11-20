import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, IconButton, Avatar } from "react-native-paper";
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
				<View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
					<View style={styles.topRow}>
						<Avatar.Icon
							size={36}
							icon="email-outline"
							style={{
								backgroundColor: theme.colors.elevation.level3,
								marginRight: 16,
							}}
							color={theme.colors.primary}
						/>
						<View style={styles.titleContainer}>
							<Text variant="titleMedium" style={{ fontWeight: "600" }}>
								{envelope.name}
							</Text>
							<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
								{envelope.purpose}
							</Text>
						</View>
						<View style={styles.balanceContainer}>
							<Text
								variant="titleMedium"
								style={{
									fontWeight: "bold",
									color: theme.colors.primary,
								}}
							>
								{envelope.currency} {envelope.current_balance.toLocaleString()}
							</Text>
							<Text variant="bodySmall" style={{ color: theme.colors.outline }}>
								of {envelope.total_amount.toLocaleString()}
							</Text>
						</View>
					</View>
					<View style={styles.actionsRow}>
						<IconButton
							icon="plus"
							size={20}
							onPress={() => setShowAddDialog(true)}
							disabled={loading}
							style={{ margin: 0 }}
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
		padding: 16,
	},
	topRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	titleContainer: {
		flex: 1,
	},
	balanceContainer: {
		alignItems: "flex-end",
	},
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginTop: 8,
	},
});

export default EnvelopeListItem;
