import { TransactionRepository } from "../../repositories/TransactionRepository";
import { Transaction, TransactionFilter } from "../../types";
import { useQuery } from "../useQuery";

export const useGetTransactions = (filter?: TransactionFilter) => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Transaction[]>(
			(db) => TransactionRepository.getAll(db, filter),
			[JSON.stringify(filter ?? null)],
			[],
			"Failed to load transactions"
		);

	return {
		transactions: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
};
