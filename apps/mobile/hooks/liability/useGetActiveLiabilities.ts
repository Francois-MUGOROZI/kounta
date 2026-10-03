import { LiabilityRepository } from "../../repositories/LiabilityRepository";
import { Liability } from "../../types";
import { useQuery } from "../useQuery";

export const useGetActiveLiabilities = () => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Liability[]>(
			(db) => LiabilityRepository.getActive(db),
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
