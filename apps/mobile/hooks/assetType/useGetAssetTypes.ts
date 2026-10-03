import { AssetTypeRepository } from "../../repositories/AssetTypeRepository";
import { AssetType } from "../../types";
import { useQuery } from "../useQuery";

export const useGetAssetTypes = () => {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<AssetType[]>(
			(db) => AssetTypeRepository.getAll(db),
			[],
			[],
			"Failed to load asset types"
		);

	return {
		assetTypes: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
};
