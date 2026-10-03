import { AssetRepository } from "../../repositories/AssetRepository";
import { Asset } from "../../types";
import { useQuery } from "../useQuery";

export const useGetAssets = () => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Asset[]>(
			(db) => AssetRepository.getAll(db),
			[],
			[],
			"Failed to load assets"
		);

	return {
		assets: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
};
