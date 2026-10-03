import { AccountTypeRepository } from "../../repositories/AccountTypeRepository";
import { AccountType } from "../../types";
import { useQuery } from "../useQuery";

export function useGetAccountTypes() {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<AccountType[]>(
			(db) => AccountTypeRepository.getAll(db),
			[],
			[],
			"Failed to load account types"
		);

	return {
		accountTypes: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
}
