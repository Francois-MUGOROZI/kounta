import { Envelope } from "../types";

/** Tone for an envelope's remaining balance: overspent, nearly empty (<20%), or healthy. */
export const envelopeTone = (env: Envelope): "expense" | "warning" | "primary" => {
	if (env.current_balance < 0) return "expense";
	const ratio = env.total_amount > 0 ? env.current_balance / env.total_amount : 0;
	return ratio < 0.2 ? "warning" : "primary";
};
