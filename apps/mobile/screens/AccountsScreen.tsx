import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useTheme, FAB, Card, Text } from "react-native-paper";
import { accountRepository } from "../repositories/AccountRepository";
import Account from "../models/Account";
import AddAccountModal from "../components/AddAccountModal";

interface AccountsScreenProps {
	accounts: Account[];
}

const AccountsScreen: React.FC<AccountsScreenProps> = ({ accounts }) => {
	const theme = useTheme();
	const [isModalVisible, setIsModalVisible] = useState(false);

	const showModal = () => setIsModalVisible(true);
	const hideModal = () => setIsModalVisible(false);

	const renderAccountItem = ({ item }: { item: Account }) => (
		<Card style={styles.card}>
			<Card.Content>
				<Text variant="titleMedium">{item.name}</Text>
				<Text variant="bodyMedium">
					{item.currency} {item.openingBalance}
				</Text>
			</Card.Content>
		</Card>
	);

	return (
		<View
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<FlatList
				data={accounts}
				renderItem={renderAccountItem}
				keyExtractor={(item) => item.id}
				ListEmptyComponent={
					<Text
						style={{
							color: theme.colors.onBackground,
							textAlign: "center",
							marginTop: 20,
						}}
					>
						No accounts found. Add one!
					</Text>
				}
			/>
			<FAB
				style={[styles.fab, { backgroundColor: theme.colors.primary }]}
				icon="plus"
				onPress={showModal}
			/>
			<AddAccountModal isVisible={isModalVisible} onClose={hideModal} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	card: {
		marginBottom: 10,
		backgroundColor: "#fff",
	},
	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 0,
	},
});

export default AccountsScreen;
