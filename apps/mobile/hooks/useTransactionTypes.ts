import { TransactionTypeRepository } from "../repositories/TransactionTypeRepository";

export function useTransactionTypes() {
	return TransactionTypeRepository.useGetAll();
}
