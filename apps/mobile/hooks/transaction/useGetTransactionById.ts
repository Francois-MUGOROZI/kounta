import { TransactionRepository } from "../../repositories/TransactionRepository";
import { Transaction } from "../../types";
import { useQuery } from "../useQuery";

export const useGetTransactionById = (id: number) => {
	const { data, loading, error, refresh } = useQuery<Transaction | null>(
		(db) => TransactionRepository.getById(db, id),
		[id],
		null,
		"Failed to load transaction"
	);

	return { transaction: data, loading, error, refresh };
};
