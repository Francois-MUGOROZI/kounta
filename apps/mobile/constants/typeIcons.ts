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
			// Before "stock": livestock would otherwise match it
			[["livestock", "cattle", "cow"], "cow"],
			[["vehicle", "car"], "car-outline"],
			[["invest", "stock", "share", "equity"], "chart-line"],
			[["bond", "treasury"], "file-certificate-outline"],
			[["crypto", "bitcoin"], "bitcoin"],
			[["fund", "mutual"], "chart-donut"],
			[["valuable", "physical", "gold", "jewel"], "gold"],
			[["business", "company"], "domain"],
			[["intangible", "intellectual", "software", "patent"], "lightbulb-on-outline"],
		],
		"diamond-stone"
	);

export const getLiabilityTypeIcon = (type?: string | null): IconName =>
	match(
		type,
		[
			[["mortgage", "home"], "home-lock"],
			// Before "car": "credit card" would otherwise match it
			[["credit card"], "credit-card-outline"],
			[["car", "auto"], "car-key"],
			[["student", "school"], "school-outline"],
			[["held", "custod", "keeping"], "safe"],
		],
		"credit-card-clock-outline"
	);
