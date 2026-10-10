import React from "react";
import { Image, StyleSheet, useColorScheme, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { DarkTheme, LightTheme } from "../theme/theme";

const LIGHT_MARK = require("../assets/images/splash-icon.png");
const DARK_MARK = require("../assets/images/splash-icon-dark.png");
const LIGHT_NAME = require("../assets/images/splash-branding.png");
const DARK_NAME = require("../assets/images/splash-branding-dark.png");
// Same as the splash plugin's `imageWidth` in app.json.
const MARK_SIZE = 200;
// Android 12+ draws the splash branding image in a 200x80dp box, 60dp from the bottom.
const NAME_WIDTH = 200;
const NAME_HEIGHT = 80;
const NAME_BOTTOM = 60;

/**
 * A copy of the native splash (same background, mark, name, sizes and positions)
 * shown while the app starts. Android drops its splash if the first frame
 * takes more than a few seconds, leaving a black screen; handing over to this
 * copy as soon as it's laid out keeps startup seamless however long it takes.
 * Follows the system theme, as the native splash does.
 */
const LaunchScreen: React.FC = () => {
	const dark = useColorScheme() === "dark";
	return (
		<View
			style={[styles.fill, { backgroundColor: (dark ? DarkTheme : LightTheme).colors.background }]}
			onLayout={() => SplashScreen.hideAsync().catch(() => {})}
		>
			<Image source={dark ? DARK_MARK : LIGHT_MARK} style={styles.mark} />
			<Image source={dark ? DARK_NAME : LIGHT_NAME} style={styles.name} />
		</View>
	);
};

const styles = StyleSheet.create({
	fill: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
	},
	mark: {
		width: MARK_SIZE,
		height: MARK_SIZE,
	},
	name: {
		position: "absolute",
		bottom: NAME_BOTTOM,
		width: NAME_WIDTH,
		height: NAME_HEIGHT,
	},
});

export default LaunchScreen;
