import React, { useEffect } from "react";
import { Text, ActivityIndicator } from "react-native-paper";
import { View } from "react-native";
import { useAppTheme } from "../contexts/ThemeContext";
// ...existing code...
import { useDatabaseInitialization } from "../database";
import AppNavigator from "@/navigation";
import { useCheckOverdueBills } from "@/hooks/useDatabase";

const AppInitializer: React.FC = () => {
	const { theme } = useAppTheme();
	const { isInitialized, isInitializing, error } = useDatabaseInitialization();
	const { checkOverdueBills } = useCheckOverdueBills();

	useEffect(() => {
		if (isInitialized) {
			checkOverdueBills();
		}
	}, [isInitialized, checkOverdueBills]);

	if (isInitializing) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					padding: 32,
				}}
			>
				<Text
					variant="headlineMedium"
					style={{ marginBottom: 16, textAlign: "center" }}
				>
					Welcome to Kounta!
				</Text>
				<Text
					variant="bodyLarge"
					style={{
						marginBottom: 24,
						textAlign: "center",
						color: theme.colors.onSurfaceVariant,
					}}
				>
					Your personal finance app is getting ready. Please wait while we
					initialize your data and set up your experience.
				</Text>
				<Text
					variant="bodyMedium"
					style={{
						marginBottom: 16,
						textAlign: "center",
						color: theme.colors.onSurfaceVariant,
					}}
				>
					We are setting up your app. Please wait a moment while we prepare
					everything for you.
				</Text>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (error) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					padding: 32,
				}}
			>
				<Text
					variant="headlineMedium"
					style={{
						color: theme.colors.error,
						marginBottom: 16,
						textAlign: "center",
					}}
				>
					Initialization Error
				</Text>
				<Text
					variant="bodyLarge"
					style={{
						color: theme.colors.error,
						marginBottom: 16,
						textAlign: "center",
					}}
				>
					{error}
				</Text>
				<Text
					variant="bodyMedium"
					style={{
						color: theme.colors.onSurfaceVariant,
						marginBottom: 24,
						textAlign: "center",
					}}
				>
					Something went wrong while setting up your app. Please try restarting
					the app. If the problem persists, contact support or try restoring
					from a backup.
				</Text>
			</View>
		);
	}

	if (!isInitialized) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					padding: 32,
				}}
			>
				<Text
					variant="headlineMedium"
					style={{
						marginBottom: 16,
						textAlign: "center",
						color: theme.colors.error,
					}}
				>
					App Not Ready
				</Text>
				<Text
					variant="bodyLarge"
					style={{
						marginBottom: 16,
						textAlign: "center",
						color: theme.colors.onSurfaceVariant,
					}}
				>
					The application is not ready yet. This may be due to incomplete setup
					or a previous error.
				</Text>
				<Text
					variant="bodyMedium"
					style={{
						marginBottom: 24,
						textAlign: "center",
						color: theme.colors.onSurfaceVariant,
					}}
				>
					Please restart or reinstall the app. If you have a backup, you can
					restore your data from the Backup & Restore screen in More Actions.
				</Text>
			</View>
		);
	}

	return <AppNavigator />;
};

export default AppInitializer;
