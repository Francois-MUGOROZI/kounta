import { useDatabase } from "../database";
import React from "react";

export interface TransactionType {
	id: number;
	name: string;
}

export const TransactionTypeRepository = {
	useGetAll() {
		const db = useDatabase();
		const [transactionTypes, setTransactionTypes] = React.useState<
			TransactionType[]
		>([]);
		const [loading, setLoading] = React.useState(true);
		const [error, setError] = React.useState<string | null>(null);

		const fetchTransactionTypes = React.useCallback(async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await db.getAllAsync<TransactionType>(
					"SELECT * FROM transaction_types ORDER BY id ASC"
				);
				setTransactionTypes(result);
			} catch (e: any) {
				setError(e.message || "Failed to load transaction types");
			} finally {
				setLoading(false);
			}
		}, [db]);

		React.useEffect(() => {
			fetchTransactionTypes();
		}, [fetchTransactionTypes]);

		return { transactionTypes, loading, error, refresh: fetchTransactionTypes };
	},

	useGetById(id: number) {
		const db = useDatabase();
		const [transactionType, setTransactionType] =
			React.useState<TransactionType | null>(null);
		const [loading, setLoading] = React.useState(true);
		const [error, setError] = React.useState<string | null>(null);

		const fetchTransactionType = React.useCallback(async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await db.getFirstAsync<TransactionType>(
					"SELECT * FROM transaction_types WHERE id = ?",
					[id]
				);
				setTransactionType(result);
			} catch (e: any) {
				setError(e.message || "Failed to load transaction type");
			} finally {
				setLoading(false);
			}
		}, [db, id]);

		React.useEffect(() => {
			fetchTransactionType();
		}, [fetchTransactionType]);

		return { transactionType, loading, error, refresh: fetchTransactionType };
	},

	async create(db: any, name: string): Promise<void> {
		await db.runAsync("INSERT INTO transaction_types (name) VALUES (?)", [
			name,
		]);
	},

	async update(db: any, id: number, name: string): Promise<void> {
		await db.runAsync("UPDATE transaction_types SET name = ? WHERE id = ?", [
			name,
			id,
		]);
	},

	async delete(db: any, id: number): Promise<void> {
		await db.runAsync("DELETE FROM transaction_types WHERE id = ?", [id]);
	},
};
