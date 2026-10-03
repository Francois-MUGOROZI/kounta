import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import { useDatabaseInitialization } from "../database";
import AppNavigator from "@/navigation";
import { useCheckOverdueBills } from "@/hooks/useDatabase";
import EmptyState from "@/components/ui/EmptyState";
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

	useEffect(() => {
		if (!isInitializing) {
			SplashScreen.hideAsync().catch(() => {});
		}
	}, [isInitializing]);

	// Normally hidden behind the native splash; shown if initialising runs long.
	if (isInitializing) {
		return (
			<View style={[styles.center, styles.loading, { backgroundColor: theme.colors.background }]}>
				<Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
					Kounta
				</Text>
				<ActivityIndicator color={theme.colors.primary} style={{ marginTop: spacing.lg }} />
			</View>
		);
	}

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
	loading: {
		alignItems: "center",
	},
	footnote: {
		textAlign: "center",
		marginTop: spacing.lg,
	},
});

export default AppInitializer;
