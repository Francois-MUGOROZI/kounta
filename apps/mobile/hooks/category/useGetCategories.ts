import { CategoryRepository } from "../../repositories/CategoryRepository";
import { Category } from "../../types";
import { useQuery } from "../useQuery";

export function useGetCategories() {
	const { data, loading, refreshing, error, refresh, pullToRefresh } =
		useQuery<Category[]>(
			(db) => CategoryRepository.getAll(db),
			[],
			[],
			"Failed to load categories"
		);

	return {
		categories: data,
		loading,
		refreshing,
		error,
		refresh,
		pullToRefresh,
	};
}
