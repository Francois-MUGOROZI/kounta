import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { enGB, registerTranslation } from "react-native-paper-dates";
import { PreferencesProvider } from "../contexts/PreferencesContext";
import { SQLiteProvider } from "expo-sqlite";
import AppInitializer from "./AppInitializer";
import { appFonts } from "../theme/fonts";
import { ToastProvider } from "../components/ui/Toast";
import { ConfirmProvider } from "../components/ui/Confirm";

// Date pickers use British English labels and day-first dates.
registerTranslation("en-GB", enGB);

// Keep the native splash up until fonts load and the launch screen takes over.
SplashScreen.preventAutoHideAsync().catch(() => {});

const App = () => {
	const [fontsLoaded, fontError] = useFonts(appFonts);

	// A font failure is cosmetic — continue with system fonts rather than block.
	if (!fontsLoaded && !fontError) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<KeyboardProvider>
			<PreferencesProvider>
				<SQLiteProvider databaseName="kounta.db">
					<ToastProvider>
						<ConfirmProvider>
							<BottomSheetModalProvider>
								<AppInitializer />
							</BottomSheetModalProvider>
						</ConfirmProvider>
					</ToastProvider>
				</SQLiteProvider>
			</PreferencesProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
};

export default App;
