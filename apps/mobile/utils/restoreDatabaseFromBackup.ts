import * as FileSystem from "expo-file-system";

// Replace the local SQLite database file with the downloaded backup
export async function restoreDatabaseFromBackup(fileData: ArrayBuffer) {
	const dbFilePath = FileSystem.documentDirectory + "SQLite/kounta.db";
	// Ensure the SQLite directory exists
	await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + "SQLite", {
		intermediates: true,
	});
	// Write the backup file to the database path
	await FileSystem.writeAsStringAsync(
		dbFilePath,
		Buffer.from(fileData).toString("base64"),
		{
			encoding: FileSystem.EncodingType.Base64,
		}
	);
}
