import type { IconName } from "../components/ui/icons";

const match = (name: string | null | undefined, table: [string[], IconName][], fallback: IconName) => {
	const lower = (name ?? "").toLowerCase();
	for (const [keys, icon] of table) {
		if (keys.some((k) => lower.includes(k))) return icon;
	}
	return fallback;
};

export const getAccountTypeIcon = (type?: string | null): IconName =>
	match(
		type,
		[
			[["mobile", "momo", "wallet"], "cellphone"],
			[["cash"], "cash"],
			[["credit"], "credit-card-outline"],
			[["saving"], "piggy-bank-outline"],
			[["bank"], "bank-outline"],
		],
		"wallet-outline"
	);

export const getAssetTypeIcon = (type?: string | null): IconName =>
	match(
		type,
		[
			[["real estate", "land", "house", "property"], "home-city-outline"],
			[["vehicle", "car"], "car-outline"],
			[["stock", "share", "equity"], "chart-line"],
			[["bond", "treasury"], "file-certificate-outline"],
			[["crypto", "bitcoin"], "bitcoin"],
			[["fund", "mutual"], "chart-donut"],
			[["physical", "gold", "jewel"], "gold"],
		],
		"diamond-stone"
	);

export const getLiabilityTypeIcon = (type?: string | null): IconName =>
	match(
		type,
		[
			[["mortgage", "home"], "home-lock"],
			[["car", "auto"], "car-key"],
			[["credit card"], "credit-card-outline"],
			[["student", "school"], "school-outline"],
		],
		"credit-card-clock-outline"
	);
