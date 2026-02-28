import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
	Text,
	FAB,
	useTheme,
	SegmentedButtons,
	Divider,
	Snackbar,
} from "react-native-paper";
import { useGetAccountTypes } from "../hooks/accountType/useGetAccountTypes";
import { useCreateAccountType } from "../hooks/accountType/useCreateAccountType";
import { useUpdateAccountType } from "../hooks/accountType/useUpdateAccountType";
import { useGetAssetTypes } from "../hooks/assetType/useGetAssetTypes";
import { useCreateAssetType } from "../hooks/assetType/useCreateAssetType";
import { useUpdateAssetType } from "../hooks/assetType/useUpdateAssetType";
import { useGetLiabilityTypes } from "../hooks/liabilityType/useGetLiabilityTypes";
import { useCreateLiabilityType } from "../hooks/liabilityType/useCreateLiabilityType";
import { useUpdateLiabilityType } from "../hooks/liabilityType/useUpdateLiabilityType";
import TypeFormDialog from "../components/TypeFormDialog";
import TypeListItem from "../components/TypeListItem";

const TABS = [
	{ label: "Account Types", value: "account" },
	{ label: "Asset Types", value: "asset" },
	{ label: "Liability Types", value: "liability" },
];

const TypesScreen = () => {
	const theme = useTheme();
	const [tab, setTab] = useState("account");
	const [dialogVisible, setDialogVisible] = useState(false);
	const [editingType, setEditingType] = useState<any>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	// Hooks for each type
	const {
		accountTypes,
		loading: loadingAccountTypes,
		refresh: refreshAccountTypes,
	} = useGetAccountTypes();
	const { createAccountType } = useCreateAccountType();
	const { updateAccountType } = useUpdateAccountType();

	const {
		assetTypes,
		loading: loadingAssetTypes,
		refresh: refreshAssetTypes,
	} = useGetAssetTypes();
	const { createAssetType } = useCreateAssetType();
	const { updateAssetType } = useUpdateAssetType();

	const {
		liabilityTypes,
		loading: loadingLiabilityTypes,
		refresh: refreshLiabilityTypes,
	} = useGetLiabilityTypes();
	const { createLiabilityType } = useCreateLiabilityType();
	const { updateLiabilityType } = useUpdateLiabilityType();

	// State for dialog
	const [dialogType, setDialogType] = useState<
		"account" | "asset" | "liability"
	>("account");

	// Handlers
	const openAddDialog = () => {
		setEditingType(null);
		setDialogType(tab as any);
		setDialogVisible(true);
	};
	const openEditDialog = (type: any) => {
		setEditingType(type);
		setDialogType(tab as any);
		setDialogVisible(true);
	};
	const closeDialog = () => {
		setEditingType(null);
		setDialogVisible(false);
	};

	// CRUD logic
	const handleSave = async (name: string) => {
		try {
			if (editingType) {
				if (tab === "account") {
					await updateAccountType(editingType.id, name);
					refreshAccountTypes();
				} else if (tab === "asset") {
					await updateAssetType(editingType.id, { name });
					refreshAssetTypes();
				} else if (tab === "liability") {
					await updateLiabilityType(editingType.id, { name });
					refreshLiabilityTypes();
				}
				setSnackbar({ visible: true, message: "Type updated" });
			} else {
				if (tab === "account") {
					await createAccountType(name);
					refreshAccountTypes();
				} else if (tab === "asset") {
					await createAssetType({ name });
					refreshAssetTypes();
				} else if (tab === "liability") {
					await createLiabilityType({ name });
					refreshLiabilityTypes();
				}
				setSnackbar({ visible: true, message: "Type created" });
			}
			closeDialog();
		} catch (e: any) {
			setSnackbar({ visible: true, message: e.message || "Error saving type" });
		}
	};

	// Data for current tab
	let data: any[] = [];
	let loading = false;
	if (tab === "account") {
		data = accountTypes;
		loading = loadingAccountTypes;
	} else if (tab === "asset") {
		data = assetTypes;
		loading = loadingAssetTypes;
	} else if (tab === "liability") {
		data = liabilityTypes;
		loading = loadingLiabilityTypes;
	}

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<SegmentedButtons
				value={tab}
				onValueChange={setTab}
				buttons={TABS.map((t) => ({ value: t.value, label: t.label }))}
				style={{ marginBottom: 16 }}
			/>
			<Divider style={{ marginBottom: 8 }} />
			<FlatList
				data={data}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<TypeListItem name={item.name} onEdit={() => openEditDialog(item)} />
				)}
				ListEmptyComponent={
					loading ? (
						<Text style={{ textAlign: "center", marginTop: 32 }}>
							Loading...
						</Text>
					) : (
						<Text style={{ textAlign: "center", marginTop: 32 }}>
							No types found.
						</Text>
					)
				}
				contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
				ItemSeparatorComponent={() => <Divider />}
			/>
			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				color={theme.colors.onPrimary}
				onPress={openAddDialog}
				accessibilityLabel="Add Type"
			/>
			<TypeFormDialog
				visible={dialogVisible}
				onClose={closeDialog}
				onSubmit={handleSave}
				initialName={editingType?.name || ""}
				typeLabel={TABS.find((t) => t.value === dialogType)?.label || "Type"}
			/>
			<Snackbar
				visible={snackbar.visible}
				onDismiss={() => setSnackbar({ visible: false, message: "" })}
				duration={2000}
			>
				{snackbar.message}
			</Snackbar>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 8,
	},
	fab: {
		position: "absolute",
		right: 16,
		bottom: 24,
	},
});

export default TypesScreen;
