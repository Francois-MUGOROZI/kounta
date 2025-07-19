import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import {
	FAB,
	ActivityIndicator,
	Text,
	Snackbar,
	useTheme,
	Surface,
	Divider,
	List,
} from "react-native-paper";
import { useGetCategories } from "../hooks/category/useGetCategories";
import { useCreateCategory } from "../hooks/category/useCreateCategory";
import { useUpdateCategory } from "../hooks/category/useUpdateCategory";
import { useDeleteCategory } from "../hooks/category/useDeleteCategory";
import { useTransactionTypes } from "../hooks/useTransactionTypes";
import CategoryListItem from "../components/CategoryListItem";
import CategoryFormModal from "../components/CategoryFormModal";
import { Category } from "../types";

const CategoriesScreen = () => {
	const theme = useTheme();
	const { categories, loading, error, refresh } = useGetCategories();
	const {
		createCategory,
		loading: creating,
		error: createError,
	} = useCreateCategory();
	const {
		updateCategory,
		loading: updating,
		error: updateError,
	} = useUpdateCategory();
	const {
		deleteCategory,
		loading: deleting,
		error: deleteError,
	} = useDeleteCategory();
	const { transactionTypes } = useTransactionTypes();
	const [modalVisible, setModalVisible] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [snackbar, setSnackbar] = useState({ visible: false, message: "" });

	const openAddModal = () => {
		setEditingCategory(null);
		setModalVisible(true);
	};

	const openEditModal = (category: Category) => {
		setEditingCategory(category);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setEditingCategory(null);
	};

	const handleSubmit = async (data: {
		name: string;
		transaction_type_id: number;
	}) => {
		try {
			if (editingCategory) {
				await updateCategory(editingCategory.id, data);
				setSnackbar({ visible: true, message: "Category updated" });
			} else {
				await createCategory({ ...data, created_at: new Date().toISOString() });
				setSnackbar({ visible: true, message: "Category created" });
			}
			closeModal();
			refresh();
		} catch (e: any) {
			setSnackbar({
				visible: true,
				message: e.message || "Error saving category",
			});
		}
	};

	const handleDelete = (category: Category) => {
		Alert.alert(
			"Delete Category",
			`Are you sure you want to delete "${category.name}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await deleteCategory(category.id);
							setSnackbar({ visible: true, message: "Category deleted" });
							refresh();
						} catch (e: any) {
							setSnackbar({
								visible: true,
								message: e.message || "Error deleting category",
							});
						}
					},
				},
			]
		);
	};

	const getTypeName = (typeId: number) => {
		return transactionTypes.find((t) => t.id === typeId)?.name || "";
	};

	// Group categories by transaction type
	const groupedCategories = useMemo(() => {
		const groups: { [key: string]: Category[] } = {};
		categories.forEach((category) => {
			const typeName = getTypeName(category.transaction_type_id);
			if (!groups[typeName]) {
				groups[typeName] = [];
			}
			groups[typeName].push(category);
		});
		return groups;
	}, [categories, transactionTypes]);

	// Flatten grouped data for FlatList
	const flatListData = useMemo(() => {
		const data: Array<{ type: "header" | "item"; content: any }> = [];
		Object.entries(groupedCategories).forEach(([typeName, categories]) => {
			// Add header
			data.push({ type: "header", content: typeName });
			// Add items
			categories.forEach((category) => {
				data.push({ type: "item", content: category });
			});
		});
		return data;
	}, [groupedCategories]);

	const anyLoading = loading || creating || updating || deleting;
	const anyError = error || createError || updateError || deleteError;

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			{anyLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" />
					<Text variant="bodyLarge" style={{ marginTop: 16 }}>
						Loading categories...
					</Text>
				</View>
			) : anyError ? (
				<View style={styles.centered}>
					<Text variant="bodyLarge" style={{ color: theme.colors.error }}>
						{anyError}
					</Text>
				</View>
			) : (
				<FlatList
					data={flatListData}
					keyExtractor={(item, index) =>
						item.type === "header"
							? `header-${item.content}`
							: `item-${item.content.id}-${index}`
					}
					renderItem={({ item }) => {
						if (item.type === "header") {
							const headerColor =
								item.content === "Income"
									? theme.colors.primary
									: theme.colors.error;
							return (
								<Text
									variant="titleMedium"
									style={[styles.headerText, { color: headerColor }]}
								>
									{item.content}
								</Text>
							);
						} else {
							const category = item.content as Category;
							return (
								<CategoryListItem
									category={category}
									typeName={getTypeName(category.transaction_type_id)}
									onEdit={() => openEditModal(category)}
									onDelete={() => handleDelete(category)}
								/>
							);
						}
					}}
					ListEmptyComponent={
						<View style={styles.centered}>
							<Text
								variant="bodyLarge"
								style={{ color: theme.colors.onSurfaceVariant }}
							>
								No categories yet.
							</Text>
						</View>
					}
					contentContainerStyle={
						flatListData.length === 0 ? styles.centered : undefined
					}
					ItemSeparatorComponent={() => <Divider />}
				/>
			)}
			<FAB
				icon="plus"
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				color={theme.colors.onPrimary}
				onPress={openAddModal}
				accessibilityLabel="Add Category"
			/>
			<CategoryFormModal
				visible={modalVisible}
				onClose={closeModal}
				onSubmit={handleSubmit}
				transactionTypes={transactionTypes}
				initialCategory={editingCategory}
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
		padding: 16,
	},
	fab: {
		position: "absolute",
		right: 16,
		bottom: 24,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		textAlign: "center",
		marginTop: 32,
	},
	headerContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginTop: 8,
	},
	headerText: {
		fontWeight: "600",
		marginTop: 8,
	},
});

export default CategoriesScreen;
