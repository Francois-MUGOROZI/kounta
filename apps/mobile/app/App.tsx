import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "../contexts/ThemeContext";
import { SQLiteProvider } from "expo-sqlite";
import AppInitializer from "./AppInitializer";

const App = () => (
	<GestureHandlerRootView>
		<ThemeProvider>
			<SQLiteProvider databaseName="kounta.db">
				<AppInitializer />
			</SQLiteProvider>
		</ThemeProvider>
	</GestureHandlerRootView>
);

export default App;
