import React, { useState } from "react";
import {
	BottomTabBarButtonProps,
	createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity } from "react-native";
import DashboardScreen from "../screens/DashboardScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import AccountsScreen from "../screens/AccountsScreen";
import AssetsScreen from '../screens/AssetsScreen';
import LiabilitiesScreen from '../screens/LiabilitiesScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import { useTheme, FAB } from 'react-native-paper';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AppBottomSheet from "../components/AppBottomSheet";
import MoreActionsContent from "../components/MoreActionsContent";

const Tab = createBottomTabNavigator();

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
		<>
			<Tab.Navigator
				screenOptions={{
					headerShown: false,
					tabBarActiveTintColor: theme.colors.primary,
					tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
					tabBarStyle: {
						backgroundColor: theme.colors.surface,
						height: 90,
						paddingBottom: 20,
					},
				}}
			>
				<Tab.Screen
					name="Dashboard"
					component={DashboardScreen}
					options={{
						tabBarLabel: "Dashboard",
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
            tabBarLabel: 'More',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="dots-horizontal" color={color} size={size} />
            ),
            tabBarButton: (props) => <MoreTabButton {...props} />,
          }}
        />
        <Tab.Screen
          name="Liabilities"
          component={LiabilitiesScreen}
          options={{
            tabBarButton: () => null, // Hide from tab bar
            tabBarLabel: () => null, // Hide label
          }}
        />
        <Tab.Screen
          name="Categories"
          component={CategoriesScreen}
          options={{
            tabBarButton: () => null, // Hide from tab bar
            tabBarLabel: () => null, // Hide label
          }}
        />
      </Tab.Navigator>
			<AppBottomSheet
				isVisible={isBottomSheetVisible}
				onClose={closeBottomSheet}
			>
				<MoreActionsContent onClose={closeBottomSheet} />
			</AppBottomSheet>
		</>
	);
};

export default MainTabNavigator;
