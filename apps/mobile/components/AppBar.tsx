import React, { useMemo } from "react";
import { Appbar, Menu, useTheme } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

import { reloadAsync } from "expo-updates";

const AppBar: React.FC<NativeStackHeaderProps> = ({
	navigation,
	route,
	options,
	back,
}) => {
	const [visible, setVisible] = React.useState(false);
	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);
	const theme = useTheme();

	const toggleTheme = async () => {
		const newTheme = theme.dark ? "light" : "dark";
		try {
			await AsyncStorage.setItem("appTheme", newTheme);
			// Reload the app to apply the new theme
			await reloadAsync();
		} catch (e) {
			console.error("Failed to save theme to storage", e);
		}
	};

	const themeIcon = !theme.dark ? "weather-night" : "white-balance-sunny";

	const title = useMemo(() => {
		if (route.name === "Main") {
			const tabRoute = getFocusedRouteNameFromRoute(route) || "Kounta";
			return tabRoute;
		}
		return options.title ?? route.name;
	}, [options, route]);

	return (
		<Appbar.Header
			elevated
			style={{
				backgroundColor: !theme.dark
					? theme.colors.primary
					: theme.colors.surface,
			}}
		>
			{back ? (
				<Appbar.BackAction
					onPress={navigation.goBack}
					color={!theme.dark ? theme.colors.onPrimary : theme.colors.onSurface}
				/>
			) : null}
			<Appbar.Content
				title={title}
				color={!theme.dark ? theme.colors.onPrimary : theme.colors.onSurface}
			/>
			{!back && (
				<>
					<Appbar.Action
						icon={themeIcon}
						color={
							!theme.dark ? theme.colors.onPrimary : theme.colors.onSurface
						}
						onPress={toggleTheme}
					/>
					<Menu
						visible={visible}
						onDismiss={closeMenu}
						anchor={
							<Appbar.Action
								icon="account-circle"
								color={
									!theme.dark ? theme.colors.onPrimary : theme.colors.onSurface
								}
								onPress={openMenu}
							/>
						}
					>
						<Menu.Item onPress={() => {}} title="Profile" />
						<Menu.Item onPress={() => {}} title="Settings" />
						<Menu.Item onPress={() => {}} title="Logout" />
					</Menu>
				</>
			)}
		</Appbar.Header>
	);
};

export default AppBar;
