import { AccountRepository } from "../../repositories/AccountRepository";
import { Account } from "../../types";
import { useQuery } from "../useQuery";

export function useGetAccounts() {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Account[]>(
			(db) => AccountRepository.getAll(db),
			[],
			[],
			"Failed to load accounts"
		);

	return {
		accounts: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
}
