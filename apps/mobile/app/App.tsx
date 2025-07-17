import React, { useState, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
	PaperProvider,
	Text,
	ActivityIndicator,
	useTheme,
} from "react-native-paper";
import { useColorScheme, View } from "react-native";
import { LightTheme, DarkTheme } from "../theme/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppNavigator from "@/navigation";
import { SQLiteProvider } from "expo-sqlite";
import { useDatabaseInitialization } from "../database";

const AppContent = () => {
	const theme = useTheme();
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

	return (
		<PaperProvider theme={theme}>
			<AppNavigator />
		</PaperProvider>
	);
};

const App = () => {
	const systemColorScheme = useColorScheme();
	const [currentTheme, setCurrentTheme] = useState(
		systemColorScheme === "dark" ? "dark" : "light"
	);

	useEffect(() => {
		const loadTheme = async () => {
			try {
				const storedTheme = await AsyncStorage.getItem("appTheme");
				if (storedTheme) {
					setCurrentTheme(storedTheme);
				}
			} catch (e) {
				console.error("Failed to load theme from storage", e);
			}
		};
		loadTheme();
	}, []);

	const theme = currentTheme === "dark" ? DarkTheme : LightTheme;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<PaperProvider theme={theme}>
				<SQLiteProvider databaseName="kounta.db">
					<AppContent />
				</SQLiteProvider>
			</PaperProvider>
		</GestureHandlerRootView>
	);
};

export default App;
