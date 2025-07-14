import React from "react";
import { Appbar, Menu, useTheme } from "react-native-paper";

interface AppBarProps {
	onToggleTheme: () => void;
	currentTheme: "light" | "dark";
}

const AppBar: React.FC<AppBarProps> = ({ onToggleTheme, currentTheme }) => {
	const [visible, setVisible] = React.useState(false);
	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);
	const theme = useTheme();

	const themeIcon =
		currentTheme === "light" ? "weather-night" : "white-balance-sunny";

	return (
		<Appbar.Header elevated style={{ backgroundColor: currentTheme === "light" ? theme.colors.primary : theme.colors.surface }}>
			<Appbar.Content title="Kounta" color={currentTheme === "light" ? theme.colors.onPrimary : theme.colors.onSurface} />
			<Appbar.Action
				icon={themeIcon}
				color={currentTheme === "light" ? theme.colors.onPrimary : theme.colors.onSurface}
				onPress={onToggleTheme}
			/>
			<Menu
				visible={visible}
				onDismiss={closeMenu}
				anchor={
					<Appbar.Action
						icon="account-circle"
						color={currentTheme === "light" ? theme.colors.onPrimary : theme.colors.onSurface}
						onPress={openMenu}
					/>
				}
			>
				<Menu.Item onPress={() => {}} title="Profile" />
				<Menu.Item onPress={() => {}} title="Settings" />
				<Menu.Item onPress={() => {}} title="Logout" />
			</Menu>
		</Appbar.Header>
	);
};

export default AppBar;
