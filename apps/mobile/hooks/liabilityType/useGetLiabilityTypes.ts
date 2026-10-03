import { LiabilityTypeRepository } from "../../repositories/LiabilityTypeRepository";
import { LiabilityType } from "../../types";
import { useQuery } from "../useQuery";

export const useGetLiabilityTypes = () => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<LiabilityType[]>(
			(db) => LiabilityTypeRepository.getAll(db),
			[],
			[],
			"Failed to load liability types"
		);

	return {
		liabilityTypes: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
};
