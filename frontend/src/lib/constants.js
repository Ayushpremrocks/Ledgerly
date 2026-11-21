export const CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "FOOD", label: "Food & dining" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "BILLS", label: "Bills & utilities" },
  { value: "RENT", label: "Rent" },
  { value: "TRAVEL", label: "Travel" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "HEALTH", label: "Health" },
  { value: "EDUCATION", label: "Education" },
  { value: "SALARY", label: "Salary" },
  { value: "SAVINGS", label: "Savings" },
  { value: "OTHER", label: "Other" },
];

export const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || "General";

export const ACCOUNT_TYPES = [
  { value: "SAVINGS", label: "Savings", hint: "Everyday savings that you can dip into anytime." },
  { value: "CURRENT", label: "Current", hint: "For frequent payments and bills." },
  { value: "FIXED_DEPOSIT", label: "Fixed deposit", hint: "Money you plan to leave untouched." },
];

export const accountTypeLabel = (v) => ACCOUNT_TYPES.find((t) => t.value === v)?.label || v;

/** "Rainy day (Savings)" or just "Savings" */
export const accountName = (a) => a?.nickname || `${accountTypeLabel(a?.accountType)} account`;

// Mirrors the backend defaults in application.properties
export const LIMITS = {
  perTransaction: 100000,
  dailyTransfer: 200000,
  maxDeposit: 100000,
};
