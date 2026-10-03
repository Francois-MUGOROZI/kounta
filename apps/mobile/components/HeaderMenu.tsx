import React, { useRef, useState } from "react";
import { View } from "react-native";
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Dropdown, { Option } from "./ui/Dropdown";
import { RootStackParamList } from "../types";

type Destination = "Settings" | "BackupRestore";

const ITEMS: Option<Destination>[] = [
	{ value: "Settings", label: "Settings", icon: "cog-outline" },
	{ value: "BackupRestore", label: "Backup & restore", icon: "cloud-sync-outline" },
];

/** Overflow (⋮) menu shown in the header of the main tabs. */
const HeaderMenu: React.FC = () => {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const anchor = useRef<View>(null);
	const [open, setOpen] = useState(false);
	return (
		<>
			<View ref={anchor} collapsable={false}>
				<IconButton icon="dots-vertical" onPress={() => setOpen(true)} accessibilityLabel="More options" />
			</View>
			<Dropdown
				visible={open}
				onDismiss={() => setOpen(false)}
				anchor={anchor}
				options={ITEMS}
				variant="menu"
				alignRight
				minWidth={220}
				onSelect={(screen) => {
					setOpen(false);
					if (screen) navigation.navigate(screen);
				}}
			/>
		</>
	);
};

export default HeaderMenu;
