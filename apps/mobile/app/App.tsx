import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, Text, ActivityIndicator } from "react-native-paper";
import { View } from "react-native";
import { ThemeProvider, useAppTheme } from "../contexts/ThemeContext";
import AppNavigator from "@/navigation";
import { SQLiteProvider } from "expo-sqlite";
import { useDatabaseInitialization } from "../database";

const AppContent = () => {
	const { theme } = useAppTheme();
	const { isInitialized, isInitializing, error } = useDatabaseInitialization();
	if (isInitializing) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" />
				<Text variant="bodyLarge" style={{ marginTop: 16 }}>
					Initializing application...
				</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
					Error initializing application: {error}
				</Text>
			</View>
		);
	}

	if (!isInitialized) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text variant="bodyLarge">Application not ready, please restart</Text>
			</View>
		);
	}

	return <AppNavigator />;
};

const App = () => (
	<GestureHandlerRootView>
		<ThemeProvider>
			<SQLiteProvider databaseName="kounta.db">
				<AppContent />
			</SQLiteProvider>
		</ThemeProvider>
	</GestureHandlerRootView>
);

export default App;
