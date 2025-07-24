import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

const DB_PATH = FileSystem.documentDirectory + "SQLite/kounta.db";
const BACKUP_DIR = FileSystem.documentDirectory + "Backup/";
const BACKUP_PATH = BACKUP_DIR + "kounta-backup.db";

const BackupRestoreScreen: React.FC = () => {
	const theme = useTheme();
	const [loading, setLoading] = useState(false);

	const handleBackupAndExport = async () => {
		setLoading(true);
		try {
			await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
			await FileSystem.copyAsync({ from: DB_PATH, to: BACKUP_PATH });
			await Sharing.shareAsync(BACKUP_PATH);
		} catch (e: any) {
			Alert.alert("Backup/Export Failed", e.message || "Unknown error");
		} finally {
			setLoading(false);
		}
	};

	const handleRestore = async () => {
		setLoading(true);
		try {
			// Pick a file from device storage
			const result = await DocumentPicker.getDocumentAsync({
				type: "application/octet-stream",
			});
			if (result.canceled) {
				setLoading(false);
				return;
			}
			const fileUri = result.assets?.[0]?.uri;
			if (!fileUri) throw new Error("No file selected");
			await FileSystem.copyAsync({ from: fileUri, to: DB_PATH });
			Alert.alert("Restore Complete", "Database restored from selected file.");
		} catch (e: any) {
			Alert.alert("Restore Failed", e.message || "Unknown error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<Text variant="headlineMedium" style={{ marginBottom: 24 }}>
				Backup & Restore
			</Text>
			<Button
				mode="contained"
				onPress={handleBackupAndExport}
				loading={loading}
				style={{ marginBottom: 16 }}
			>
				Backup & Export
			</Button>
			<Button mode="outlined" onPress={handleRestore} loading={loading}>
				Restore from File
			</Button>
			{/* Export button removed, now combined with backup */}
			<Text style={{ marginTop: 32, color: theme.colors.onSurfaceVariant }}>
				Backup is saved to app private storage. Use Export to share or upload
				your backup file to cloud or other apps.
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
});

export default BackupRestoreScreen;
