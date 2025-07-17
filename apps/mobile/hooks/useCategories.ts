import { CategoryRepository } from "../repositories/CategoryRepository";

export function useCategories() {
	return CategoryRepository.useGetAll();
}
