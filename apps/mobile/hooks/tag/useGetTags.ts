import { TagRepository, TagUsage } from "../../repositories/TagRepository";
import { useQuery } from "../useQuery";

export function useGetTags() {
	const { data, loading, error, refresh } = useQuery<TagUsage[]>(
		(db) => TagRepository.getAll(db),
		[],
		[],
		"Failed to load tags"
	);

	return { tags: data, loading, error, refresh };
}
