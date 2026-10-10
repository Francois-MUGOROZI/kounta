import { CHARGES_CATEGORY } from "../repositories/LiabilityRepository";

// Default income categories
export const DEFAULT_INCOME_CATEGORIES = [
	"Salary & Wages",
	"Business Revenue",
	"Freelance & Contracting",
	"Investment Returns",
	"Gifts & Windfalls",
	"Other Income",
];

// Default expense categories, aligned with the UN COICOP 2018 household
// spending divisions plus budgeting practice (subscriptions, support, gifts, taxes)
export const DEFAULT_EXPENSE_CATEGORIES = [
	"Food & Groceries",
	"Eating Out",
	"Housing",
	"Utilities",
	"Phone & Internet",
	"Household & Maintenance",
	"Clothing & Footwear",
	"Transportation",
	"Healthcare",
	"Insurance",
	"Education",
	"Personal Care",
	"Leisure & Travel",
	CHARGES_CATEGORY,
	"Miscellaneous",
	"Subscriptions",
	"Family Support",
	"Gifts & Donations",
	"Taxes",
];
