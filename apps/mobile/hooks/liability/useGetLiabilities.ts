import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { Liability } from "../../types";
import { useQuery } from "../useQuery";

export const useGetLiabilities = () => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Liability[]>(
			(db) => LiabilityRepository.getAll(db),
			[],
			[],
			"Failed to load liabilities"
		);

	return {
		liabilities: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
};
