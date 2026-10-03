import React, { useCallback, useState } from "react";
import { View } from "react-native";
import {
	BottomTabHeaderProps,
	createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import {
	createNativeStackNavigator,
	NativeStackHeaderProps,
	NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import DashboardScreen from "../screens/DashboardScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import AccountsScreen from "../screens/AccountsScreen";
import AssetsScreen from "../screens/AssetsScreen";
import LiabilitiesScreen from "../screens/LiabilitiesScreen";
import CategoriesScreen from "../screens/CategoriesScreen";
import TypesScreen from "../screens/TypesScreen";
import BackupRestoreScreen from "../screens/BackupRestoreScreen";
import EnvelopeScreen from "@/screens/EnvelopeScreen";
import BillsScreen from "../screens/BillsScreen";
import TransactionDetailScreen from "../screens/TransactionDetailScreen";
import AccountDetailScreen from "../screens/AccountDetailScreen";
import AssetDetailScreen from "../screens/AssetDetailScreen";
import LiabilityDetailScreen from "../screens/LiabilityDetailScreen";
import EnvelopeDetailScreen from "../screens/EnvelopeDetailScreen";
import EntitiesScreen from "../screens/EntitiesScreen";
import EntityDetailScreen from "../screens/EntityDetailScreen";
import ReceivablesScreen from "../screens/ReceivablesScreen";
import ReceivableDetailScreen from "../screens/ReceivableDetailScreen";
import AppBar from "@/components/AppBar";
import TabBar, { TabMeta } from "@/components/TabBar";
import MoreSheet from "@/components/MoreSheet";
import HeaderMenu from "@/components/HeaderMenu";
import SettingsScreen from "../screens/SettingsScreen";
import CategoryDetailScreen from "../screens/CategoryDetailScreen";
import { MainTabParamList, RootStackParamList } from "../types";
import { useKTheme } from "@/theme/theme";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_META: Record<string, TabMeta> = {
	Dashboard: { label: "Home", icon: "home-outline", activeIcon: "home" },
	Accounts: { label: "Accounts", icon: "wallet-outline", activeIcon: "wallet" },
	Transactions: {
		label: "Activity",
		icon: "swap-vertical",
		activeIcon: "swap-vertical-bold",
	},
	Envelopes: {
		label: "Envelopes",
		icon: "email-outline",
		activeIcon: "email",
	},
	More: { label: "More", icon: "dots-horizontal-circle-outline", activeIcon: "dots-horizontal-circle" },
};

const TAB_TITLES: Record<string, string> = {
	Dashboard: "Kounta",
	Accounts: "Accounts",
	Transactions: "Activity",
	Envelopes: "Envelopes",
};

const renderTabHeader = ({ route, options }: BottomTabHeaderProps) => (
	<AppBar
		large
		title={TAB_TITLES[route.name] ?? route.name}
		right={
			<>
				{options.headerRight?.({ canGoBack: false })}
				<HeaderMenu />
			</>
		}
	/>
);

const renderStackHeader = ({
	navigation,
	route,
	options,
	back,
}: NativeStackHeaderProps) => (
	<AppBar
		title={(options.title as string | undefined) ?? route.name}
		onBack={back ? navigation.goBack : undefined}
		right={options.headerRight?.({ canGoBack: !!back })}
	/>
);

const MainTabNavigator: React.FC = () => {
	const navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const [moreVisible, setMoreVisible] = useState(false);

	const handleCustomPress = useCallback((routeName: string) => {
		if (routeName === "More") {
			setMoreVisible(true);
			return true;
		}
		return false;
	}, []);

	return (
		<View style={{ flex: 1 }}>
			<Tab.Navigator
				tabBar={(props) => (
					<TabBar {...props} meta={TAB_META} onCustomPress={handleCustomPress} />
				)}
				screenOptions={{ header: renderTabHeader }}
			>
				<Tab.Screen name="Dashboard" component={DashboardScreen} />
				<Tab.Screen name="Accounts" component={AccountsScreen} />
				<Tab.Screen name="Transactions" component={TransactionsScreen} />
				<Tab.Screen name="Envelopes" component={EnvelopeScreen} />
				{/* Placeholder route; the tab opens the More sheet instead. */}
				<Tab.Screen name="More" component={View} />
			</Tab.Navigator>
			<MoreSheet
				visible={moreVisible}
				onDismiss={() => setMoreVisible(false)}
				onNavigate={(screen) => {
					setMoreVisible(false);
					navigation.navigate(screen);
				}}
			/>
		</View>
	);
};

const AppNavigator: React.FC = () => {
	const theme = useKTheme();
	return (
		<Stack.Navigator
			screenOptions={{
				header: renderStackHeader,
				animation: "slide_from_right",
				contentStyle: { backgroundColor: theme.colors.background },
			}}
		>
			<Stack.Screen
				name="Main"
				component={MainTabNavigator}
				options={{ headerShown: false }}
			/>
			<Stack.Screen name="Categories" component={CategoriesScreen} />
			<Stack.Screen
				name="CategoryDetail"
				options={{ title: "Category" }}
				component={CategoryDetailScreen}
			/>
			<Stack.Screen name="Assets" component={AssetsScreen} />
			<Stack.Screen name="Liabilities" component={LiabilitiesScreen} />
			<Stack.Screen name="Types" component={TypesScreen} />
			<Stack.Screen
				name="BackupRestore"
				options={{ title: "Backup & Restore" }}
				component={BackupRestoreScreen}
			/>
			<Stack.Screen name="Settings" component={SettingsScreen} />
			<Stack.Screen name="Bills" component={BillsScreen} />
			<Stack.Screen
				name="TransactionDetail"
				options={{ title: "Transaction" }}
				component={TransactionDetailScreen}
			/>
			<Stack.Screen
				name="AccountDetail"
				options={{ title: "Account" }}
				component={AccountDetailScreen}
			/>
			<Stack.Screen
				name="AssetDetail"
				options={{ title: "Asset" }}
				component={AssetDetailScreen}
			/>
			<Stack.Screen
				name="LiabilityDetail"
				options={{ title: "Liability" }}
				component={LiabilityDetailScreen}
			/>
			<Stack.Screen
				name="EnvelopeDetail"
				options={{ title: "Envelope" }}
				component={EnvelopeDetailScreen}
			/>
			<Stack.Screen name="Entities" component={EntitiesScreen} />
			<Stack.Screen
				name="EntityDetail"
				options={{ title: "Entity" }}
				component={EntityDetailScreen}
			/>
			<Stack.Screen name="Receivables" component={ReceivablesScreen} />
			<Stack.Screen
				name="ReceivableDetail"
				options={{ title: "Receivable" }}
				component={ReceivableDetailScreen}
			/>
		</Stack.Navigator>
	);
};

export default AppNavigator;
