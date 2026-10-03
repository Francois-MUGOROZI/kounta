import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import Card from "../components/ui/Card";
import IconBadge from "../components/ui/IconBadge";
import AppButton from "../components/ui/AppButton";
import type { IconName } from "../components/ui/icons";
import { useToast } from "../components/ui/Toast";
import { useConfirm } from "../components/ui/Confirm";
import { useClearDatabase } from "../hooks/useDatabase";
import { useDatabase } from "../database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatShortDate, toLocalISODate } from "../utils/date";
import { radius, spacing, useKTheme } from "../theme/theme";

const DB_PATH = FileSystem.documentDirectory + "SQLite/kounta.db";
const BACKUP_DIR = FileSystem.documentDirectory + "Backup/";

// Named by the day it was made; computed per backup so a long-open screen stays accurate.
const backupPath = () => BACKUP_DIR + toLocalISODate() + "-kounta-backup.db";

// File copies keep the source's modification time, so record when a backup was made.
const LAST_BACKUP_KEY = "lastBackupAt";

const errorText = (e: unknown, fallback: string) =>
	e instanceof Error && e.message ? e.message : fallback;

/** Most recent backup made on this device, if any. */
const findLastBackup = async (): Promise<Date | null> => {
	const recorded = await AsyncStorage.getItem(LAST_BACKUP_KEY).catch(() => null);
	if (recorded) return new Date(recorded);
	// Fall back to the newest file for backups made before this was recorded.
	const dir = await FileSystem.getInfoAsync(BACKUP_DIR);
	if (!dir.exists) return null;
	const names = await FileSystem.readDirectoryAsync(BACKUP_DIR);
	let latest = 0;
	for (const name of names) {
		const info = await FileSystem.getInfoAsync(BACKUP_DIR + name);
		if (info.exists && info.modificationTime && info.modificationTime > latest) {
			latest = info.modificationTime;
		}
	}
	return latest ? new Date(latest * 1000) : null;
};

const formatTime = (date: Date) =>
	`${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

const Section: React.FC<{
	icon: IconName;
	title: string;
	body: string;
	tone?: "default" | "danger";
	children?: React.ReactNode;
}> = ({ icon, title, body, tone = "default", children }) => {
	const theme = useKTheme();
	const danger = tone === "danger";
	return (
		<Card style={styles.section}>
			<View style={styles.sectionHead}>
				<IconBadge
					icon={icon}
					color={danger ? theme.colors.onErrorContainer : undefined}
					background={danger ? theme.colors.errorContainer : undefined}
				/>
				<Text variant="titleMedium" style={[styles.sectionTitle, { color: danger ? theme.colors.error : theme.colors.onSurface }]}>
					{title}
				</Text>
			</View>
			<Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
				{body}
			</Text>
			{children}
		</Card>
	);
};

const BackupRestoreScreen: React.FC = () => {
	const theme = useKTheme();
	const toast = useToast();
	const confirm = useConfirm();
	const db = useDatabase();
	const { clear, loading: clearing } = useClearDatabase();
	const [backingUp, setBackingUp] = useState(false);
	const [restoring, setRestoring] = useState(false);
	const [lastBackup, setLastBackup] = useState<Date | null>(null);
	const [needsRestart, setNeedsRestart] = useState<string | null>(null);

	const loadLastBackup = useCallback(async () => {
		try {
			setLastBackup(await findLastBackup());
		} catch {
			// Purely informational — the screen works without it.
		}
	}, []);

	useEffect(() => {
		loadLastBackup();
	}, [loadLastBackup]);

	const busy = backingUp || restoring || clearing;

	const handleBackup = async () => {
		setBackingUp(true);
		try {
			if (!(await Sharing.isAvailableAsync())) {
				throw new Error("Sharing isn't available on this device, so the backup can't be exported.");
			}
			const path = backupPath();
			await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
			// Fold the write-ahead log into the main file so the copy has the latest data.
			await db.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");
			await FileSystem.copyAsync({ from: DB_PATH, to: path });
			await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString()).catch(() => {});
			await loadLastBackup();
			await Sharing.shareAsync(path, {
				dialogTitle: "Save your Kounta backup",
				mimeType: "application/octet-stream",
			});
			toast.success("Backup created");
		} catch (e) {
			toast.error(`Backup failed: ${errorText(e, "unknown error")}`);
		} finally {
			setBackingUp(false);
		}
	};

	const handleRestore = async () => {
		const ok = await confirm({
			title: "Replace your data?",
			message:
				"Restoring overwrites everything currently in Kounta with the backup file. Anything added since that backup will be lost. Make a fresh backup first if you're unsure.",
			confirmLabel: "Choose backup file",
			destructive: true,
		});
		if (!ok) return;
		setRestoring(true);
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: "application/octet-stream",
			});
			if (result.canceled) return;
			const fileUri = result.assets?.[0]?.uri;
			if (!fileUri) throw new Error("No file selected");
			// Empty the write-ahead log first so stale pages can't be replayed over the restored file.
			await db.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");
			await FileSystem.copyAsync({ from: fileUri, to: DB_PATH });
			setNeedsRestart("Your backup was restored. Close and reopen Kounta to see it.");
			toast.success("Backup restored — restart Kounta");
		} catch (e) {
			toast.error(`Restore failed: ${errorText(e, "unknown error")}`);
		} finally {
			setRestoring(false);
		}
	};

	const handleClear = async () => {
		const ok = await confirm({
			title: "Delete all data?",
			message:
				"This permanently removes every account, transaction, envelope and setting from this phone. It can't be undone — make a backup first.",
			confirmLabel: "Delete everything",
			destructive: true,
		});
		if (!ok) return;
		try {
			await clear();
			setNeedsRestart("All data was deleted. Close and reopen Kounta to start fresh.");
			toast.success("All data deleted — restart Kounta");
		} catch (e) {
			toast.error(`Couldn't clear data: ${errorText(e, "unknown error")}`);
		}
	};

	return (
		<ScrollView
			style={{ backgroundColor: theme.colors.background }}
			contentContainerStyle={styles.content}
		>
			{needsRestart ? (
				<View
					style={[styles.banner, { backgroundColor: theme.custom.warningContainer }]}
					accessibilityRole="alert"
					accessibilityLiveRegion="polite"
				>
					<IconBadge icon="restart" color={theme.custom.warning} background="transparent" size={32} />
					<Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
						{needsRestart}
					</Text>
				</View>
			) : null}

			<Section
				icon="cellphone-lock"
				title="Your data lives on this phone"
				body="Kounta keeps everything on this device — nothing is uploaded. If you lose or reset your phone, a backup file is the only way to get your data back."
			/>

			<Section
				icon="cloud-upload-outline"
				title="Back up"
				body="Creates a copy of all your data and lets you save it to Google Drive, email it to yourself or keep it in Files."
			>
				<Text variant="bodySmall" style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
					{lastBackup
						? `Last backup on this phone: ${formatShortDate(lastBackup)} at ${formatTime(lastBackup)}`
						: "No backup made on this phone yet."}
				</Text>
				<AppButton
					icon="export-variant"
					onPress={handleBackup}
					loading={backingUp}
					disabled={busy && !backingUp}
					style={styles.button}
				>
					Create backup
				</AppButton>
			</Section>

			<Section
				icon="backup-restore"
				title="Restore"
				body="Replace the data in Kounta with a backup file you saved earlier. You'll need to restart the app afterwards."
			>
				<AppButton
					mode="outlined"
					icon="file-upload-outline"
					onPress={handleRestore}
					loading={restoring}
					disabled={busy && !restoring}
					style={styles.button}
				>
					Restore from file
				</AppButton>
			</Section>

			<Section
				icon="delete-alert-outline"
				title="Delete all data"
				body="Wipe everything and start over. Make a backup first — this can't be undone."
				tone="danger"
			>
				<AppButton
					mode="text"
					icon="delete-outline"
					destructive
					onPress={handleClear}
					loading={clearing}
					disabled={busy && !clearing}
					style={styles.button}
				>
					Delete all data
				</AppButton>
			</Section>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	content: {
		padding: spacing.lg,
		paddingBottom: spacing.xxxl * 2,
		gap: spacing.md,
	},
	banner: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.md,
		borderRadius: radius.lg,
	},
	section: {
		gap: spacing.sm,
	},
	sectionHead: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.xs,
	},
	sectionTitle: {
		marginLeft: spacing.md,
		flex: 1,
	},
	meta: {
		marginTop: spacing.xs,
	},
	button: {
		marginTop: spacing.sm,
	},
});

export default BackupRestoreScreen;
