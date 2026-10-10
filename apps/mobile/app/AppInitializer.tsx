import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import { useDatabaseInitialization } from "../database";
import AppNavigator from "@/navigation";
import { useCheckOverdueBills } from "@/hooks/useDatabase";
import EmptyState from "@/components/ui/EmptyState";
import LaunchScreen from "@/components/LaunchScreen";
import { spacing, useKTheme } from "@/theme/theme";
import { TransactionComposerProvider } from "@/contexts/TransactionComposer";

const AppInitializer: React.FC = () => {
	const theme = useKTheme();
	const { isInitialized, isInitializing, error, retry } =
		useDatabaseInitialization();
	const { checkOverdueBills } = useCheckOverdueBills();

	useEffect(() => {
		if (isInitialized) {
			checkOverdueBills();
		}
	}, [isInitialized, checkOverdueBills]);

	// Fallback for a start fast enough to skip the launch screen's layout.
	useEffect(() => {
		if (!isInitializing) {
			SplashScreen.hideAsync().catch(() => {});
		}
	}, [isInitializing]);

	// Takes over from the native splash, which it hides once on screen.
	if (isInitializing) return <LaunchScreen />;

	if (error || !isInitialized) {
		return (
			<View style={[styles.center, { backgroundColor: theme.colors.background }]}>
				<EmptyState
					icon="database-alert-outline"
					tone="error"
					title="Kounta couldn't open your data"
					message={
						error
							? `${error}\n\nYour data has not been changed. Try again, or restart the app if this keeps happening.`
							: "Setup didn't finish. Try again."
					}
					actionLabel="Try again"
					onAction={retry}
				/>
				<Text
					variant="bodySmall"
					style={[styles.footnote, { color: theme.colors.onSurfaceVariant }]}
				>
					Kounta keeps everything on this device.
				</Text>
			</View>
		);
	}

	return (
		<TransactionComposerProvider>
			<AppNavigator />
		</TransactionComposerProvider>
	);
};

const styles = StyleSheet.create({
	center: {
		flex: 1,
		justifyContent: "center",
		padding: spacing.xxl,
	},
	footnote: {
		textAlign: "center",
		marginTop: spacing.lg,
	},
});

export default AppInitializer;
