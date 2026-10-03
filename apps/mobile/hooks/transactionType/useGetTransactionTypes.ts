import { TransactionTypeRepository } from "../../repositories/TransactionTypeRepository";
import { TransactionType } from "../../types";
import { useQuery } from "../useQuery";

export const useGetTransactionTypes = () => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<TransactionType[]>(
			(db) => TransactionTypeRepository.getAll(db),
			[],
			[],
			"Failed to load transaction types"
		);

	return {
		transactionTypes: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
};
