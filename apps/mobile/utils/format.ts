/** "•••• 9571" — enough to recognise an account without exposing the number. */
export const maskAccountNumber = (value?: string | null) =>
	value ? `•••• ${value.replace(/\s/g, "").slice(-4)}` : "";
