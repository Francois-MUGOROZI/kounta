import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { LightTheme, DarkTheme } from "../theme/theme";

interface ThemeContextValue {
	theme: typeof LightTheme;
	isDark: boolean;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	theme: LightTheme,
	isDark: false,
	toggleTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const systemColorScheme = useColorScheme();
	const [isDark, setIsDark] = useState(systemColorScheme === "dark");

	useEffect(() => {
		const loadTheme = async () => {
			const storedTheme = await AsyncStorage.getItem("appTheme");
			if (storedTheme) setIsDark(storedTheme === "dark");
		};
		loadTheme();
	}, []);

	const toggleTheme = async () => {
		const newIsDark = !isDark;
		setIsDark(newIsDark);
		await AsyncStorage.setItem("appTheme", newIsDark ? "dark" : "light");
	};

	const theme = isDark ? DarkTheme : LightTheme;

	return (
		<ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
			<PaperProvider theme={theme}>
				<View
					style={{
						flex: 1,
						backgroundColor: theme.colors.background,
					}}
				>
					{children}
				</View>
			</PaperProvider>
		</ThemeContext.Provider>
	);
};
