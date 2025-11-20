import React from "react";
import { StyleSheet, View } from "react-native";
import { Dialog, Portal, Text, useTheme } from "react-native-paper";

interface AppDialogProps {
	visible: boolean;
	onDismiss: () => void;
	title: string;
	children: React.ReactNode;
	actions?: React.ReactNode;
}

const AppDialog: React.FC<AppDialogProps> = ({
	visible,
	onDismiss,
	title,
	children,
	actions,
}) => {
	const theme = useTheme();

	return (
		<Portal>
			<Dialog
				visible={visible}
				onDismiss={onDismiss}
				style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
			>
				<Dialog.Title style={styles.title}>
					<Text variant="titleMedium" style={{ fontWeight: "bold" }}>
						{title}
					</Text>
				</Dialog.Title>
				<Dialog.Content style={styles.content}>{children}</Dialog.Content>
				{actions && <Dialog.Actions>{actions}</Dialog.Actions>}
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	dialog: {
		borderRadius: 16,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 10,
		},
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 10,
	},
	title: {
		textAlign: "center",
		marginBottom: 8, // Reduced margin
	},
	content: {
		paddingHorizontal: 24,
		paddingBottom: 8, // Reduced padding
	},
});

export default AppDialog;
