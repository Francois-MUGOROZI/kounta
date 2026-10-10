import type { IconName } from "../components/ui/icons";

/**
 * Icons for the seeded categories plus common user-created names. Matching is
 * case-insensitive on keywords so custom categories still get a sensible icon.
 */
// Keywords are regex fragments matched at a word start; add a lookahead
// (e.g. "cars?(?![a-z])") when a short word would also prefix others ("care").
const KEYWORDS: [string[], IconName][] = [
	[["salary", "wage", "payroll"], "briefcase-outline"],
	[["freelance", "side"], "laptop"],
	[["dividend"], "chart-pie"],
	[["interest"], "percent-outline"],
	[["investment", "invest"], "chart-line"],
	[["business", "sales"], "storefront-outline"],
	[["refund", "cashback"], "cash-refund"],
	[["gift", "giveaway", "donation", "charity", "tithe"], "gift-outline"],
	[["family", "support", "allowance"], "account-heart-outline"],
	[["eating", "dining", "restaurant", "takeaway"], "food-fork-drink"],
	[["food", "grocer", "meal"], "silverware-fork-knife"],
	[["transport", "fuel", "taxi", "moto", "bus(?![a-z])", "cars?(?![a-z])"], "car-outline"],
	[["household"], "sofa-outline"],
	[["housing", "rent", "home", "house"], "home-outline"],
	[["phone", "internet", "airtime", "bundle"], "cellphone"],
	[["utilit", "electric", "water"], "lightning-bolt-outline"],
	[["insurance"], "shield-check-outline"],
	[["health", "medical", "pharma", "doctor"], "heart-pulse"],
	[["entertain", "movie", "fun", "leisure"], "movie-open-outline"],
	[["shopping", "clothes", "clothing"], "shopping-outline"],
	[["education", "school", "tuition", "course", "book"], "school-outline"],
	[["tax"], "bank-outline"],
	[["debt", "loan", "credit"], "credit-card-clock-outline"],
	[["withdraw"], "cash-minus"],
	[["saving", "deposit"], "piggy-bank-outline"],
	[["subscription", "netflix", "spotify"], "repeat"],
	[["travel", "trip", "flight", "hotel"], "airplane"],
	[["repair", "maintenance"], "wrench-outline"],
	[["personal", "care", "beauty", "hair"], "face-man-shimmer-outline"],
	[["asset"], "diamond-stone"],
	[["earning", "income"], "cash-plus"],
	[["misc", "other"], "dots-horizontal-circle-outline"],
];

export const getCategoryIcon = (
	name: string | null | undefined,
	kind: "income" | "expense" = "expense"
): IconName => {
	const lower = (name ?? "").toLowerCase();
	for (const [keys, icon] of KEYWORDS) {
		// Match at word starts so "healthcare" doesn't hit "car".
		if (keys.some((k) => new RegExp(`(^|[^a-z])${k}`).test(lower))) return icon;
	}
	return kind === "income" ? "arrow-bottom-left" : "arrow-top-right";
};
