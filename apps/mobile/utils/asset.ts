import { Asset } from "../types";
import { calcPercentChange, formatPercent } from "./percent";

/** Gain = what the asset is worth plus what came back out, minus what went in. */
export const assetGain = (asset: Asset) => {
	const invested = asset.initial_cost + asset.contributions;
	const gain = asset.current_valuation + asset.withdrawals - invested;
	const pct = formatPercent(calcPercentChange(asset.current_valuation + asset.withdrawals, invested));
	return { invested, gain, pct };
};
