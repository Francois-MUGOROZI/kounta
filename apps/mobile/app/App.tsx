import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from "react-native-paper";
import { useColorScheme } from "react-native";
import { LightTheme, DarkTheme } from "../theme/theme";
import AppBar from "../components/AppBar";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MainTabNavigator from "../navigation";

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

	const toggleTheme = async () => {
		const newTheme = currentTheme === "light" ? "dark" : "light";
		try {
			await AsyncStorage.setItem("appTheme", newTheme);
			setCurrentTheme(newTheme);
		} catch (e) {
			console.error("Failed to save theme to storage", e);
		}
	};

	const theme = currentTheme === "dark" ? DarkTheme : LightTheme;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<PaperProvider theme={theme}>
				<AppBar onToggleTheme={toggleTheme} currentTheme={currentTheme as any} />
				<MainTabNavigator />
			</PaperProvider>
		</GestureHandlerRootView>
	);
};

export default App;
