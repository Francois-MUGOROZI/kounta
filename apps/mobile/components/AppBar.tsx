import React, { useMemo } from "react";
import { Appbar, Menu } from "react-native-paper";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useAppTheme } from "../contexts/ThemeContext";

const AppBar: React.FC<NativeStackHeaderProps> = ({
	navigation,
	route,
	options,
	back,
}) => {
	const [visible, setVisible] = React.useState(false);
	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);
	const { theme, isDark, toggleTheme } = useAppTheme();

	const themeIcon = !isDark ? "weather-night" : "white-balance-sunny";

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
				backgroundColor: !isDark ? theme.colors.primary : theme.colors.surface,
			}}
		>
			{back ? (
				<Appbar.BackAction
					onPress={navigation.goBack}
					color={!isDark ? theme.colors.onPrimary : theme.colors.onSurface}
				/>
			) : null}
			<Appbar.Content
				title={title}
				color={!isDark ? theme.colors.onPrimary : theme.colors.onSurface}
			/>
			{!back && (
				<>
					<Appbar.Action
						icon={themeIcon}
						color={!isDark ? theme.colors.onPrimary : theme.colors.onSurface}
						onPress={toggleTheme}
					/>
					<Menu
						visible={visible}
						onDismiss={closeMenu}
						anchor={
							<Appbar.Action
								icon="account-circle"
								color={
									!isDark ? theme.colors.onPrimary : theme.colors.onSurface
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
