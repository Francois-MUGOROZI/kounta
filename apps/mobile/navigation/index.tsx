import React, { useState } from "react";
import {
	BottomTabBarButtonProps,
	createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import {
	createNativeStackNavigator,
	NativeStackHeaderProps,
} from "@react-navigation/native-stack";
import { View, TouchableOpacity } from "react-native";
import DashboardScreen from "../screens/DashboardScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import AccountsScreen from "../screens/AccountsScreen";
import AssetsScreen from "../screens/AssetsScreen";
import LiabilitiesScreen from "../screens/LiabilitiesScreen";
import CategoriesScreen from "../screens/CategoriesScreen";
import TypesScreen from "../screens/TypesScreen";
import BackupRestoreScreen from "../screens/BackupRestoreScreen";
import { useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AppBottomSheet from "../components/AppBottomSheet";
import MoreActionsContent from "../components/MoreActionsContent";
import AppBar from "@/components/AppBar";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabNavigator: React.FC = () => {
	const theme = useTheme();
	const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

	const openBottomSheet = () => setIsBottomSheetVisible(true);
	const closeBottomSheet = () => setIsBottomSheetVisible(false);

	const MoreTabButton = (props: BottomTabBarButtonProps) => (
		<TouchableOpacity {...(props as any)} onPress={openBottomSheet}>
			{props.children}
		</TouchableOpacity>
	);

	return (
		<View style={{ flex: 1 }}>
			<Tab.Navigator
				screenOptions={{
					headerShown: false,
					tabBarActiveTintColor: theme.colors.primary,
					tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
					tabBarStyle: {
						backgroundColor: theme.colors.surface,
						height: 80,
						paddingBottom: 20,
					},
				}}
			>
				<Tab.Screen
					name="Dashboard"
					component={DashboardScreen}
					options={{
						tabBarLabel: "Dashboard",
						title: "Kounta",
						tabBarIcon: ({ color, size }) => (
							<MaterialCommunityIcons
								name="view-dashboard"
								color={color}
								size={size}
							/>
						),
					}}
				/>
				<Tab.Screen
					name="Accounts"
					component={AccountsScreen}
					options={{
						tabBarLabel: "Accounts",
						tabBarIcon: ({ color, size }) => (
							<MaterialCommunityIcons name="bank" color={color} size={size} />
						),
					}}
				/>
				<Tab.Screen
					name="Transactions"
					component={TransactionsScreen}
					options={{
						tabBarLabel: "Transactions",
						tabBarIcon: ({ color, size }) => (
							<MaterialCommunityIcons
								name="format-list-bulleted"
								color={color}
								size={size}
							/>
						),
					}}
				/>
				<Tab.Screen
					name="Assets"
					component={AssetsScreen}
					options={{
						tabBarLabel: "Assets",
						tabBarIcon: ({ color, size }) => (
							<MaterialCommunityIcons
								name="piggy-bank"
								color={color}
								size={size}
							/>
						),
					}}
				/>
				<Tab.Screen
					name="More"
					component={View} // Dummy component, as the button handles the action
					options={{
						tabBarLabel: "More",
						tabBarIcon: ({ color, size }) => (
							<MaterialCommunityIcons
								name="dots-horizontal"
								color={color}
								size={size}
							/>
						),
						tabBarButton: (props) => <MoreTabButton {...props} />,
					}}
				/>
			</Tab.Navigator>
			<AppBottomSheet
				isVisible={isBottomSheetVisible}
				onClose={closeBottomSheet}
			>
				<MoreActionsContent onClose={closeBottomSheet} />
			</AppBottomSheet>
		</View>
	);
};

const AppNavigator: React.FC = () => {
	return (
		<Stack.Navigator
			screenOptions={{
				header: (props: NativeStackHeaderProps) => <AppBar {...props} />,
			}}
		>
			<Stack.Screen name="Main" component={MainTabNavigator} />
			<Stack.Screen name="Categories" component={CategoriesScreen} />
			<Stack.Screen name="Liabilities" component={LiabilitiesScreen} />
			<Stack.Screen name="Types" component={TypesScreen} />
			<Stack.Screen
				name="BackupRestore"
				options={{ title: "Backup & Restore" }}
				component={BackupRestoreScreen}
			/>
		</Stack.Navigator>
	);
};

export default AppNavigator;
