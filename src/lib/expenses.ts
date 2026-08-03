/**
 * Core domain logic for Smart Expense Tracker.
 * All data is persisted in the browser's Local Storage (no backend).
 */

export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // ISO yyyy-mm-dd
  type: TxType;
  notes: string;
  createdAt: number;
}

export const CATEGORIES = [
  "Food",
  "Shopping",
  "Travel",
  "Bills",
  "Entertainment",
  "Education",
  "Health",
  "Salary",
  "Freelancing",
  "Others",
] as const;

export const INCOME_CATEGORIES = ["Salary", "Freelancing", "Others"];

const STORAGE_KEY = "set.transactions.v1";
export const THEME_KEY = "set.theme";

/** Read all transactions from local storage (safe on the server). */
export function loadTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Transaction[]) : [];
  } catch {
    return [];
  }
}

/** Persist all transactions. */
export function saveTransactions(items: Transaction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

export const monthKey = (date: string) => date.slice(0, 7); // yyyy-mm

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y ?? 2024, (m ?? 1) - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

/* ---------------------------------- stats --------------------------------- */

export interface Totals {
  income: number;
  expense: number;
  balance: number;
  monthIncome: number;
  monthExpense: number;
  savings: number;
}

export function computeTotals(items: Transaction[], month = todayISO().slice(0, 7)): Totals {
  let income = 0;
  let expense = 0;
  let monthIncome = 0;
  let monthExpense = 0;

  for (const t of items) {
    const inMonth = monthKey(t.date) === month;
    if (t.type === "income") {
      income += t.amount;
      if (inMonth) monthIncome += t.amount;
    } else {
      expense += t.amount;
      if (inMonth) monthExpense += t.amount;
    }
  }

  return {
    income,
    expense,
    balance: income - expense,
    monthIncome,
    monthExpense,
    savings: monthIncome - monthExpense,
  };
}

/** Expense totals for the last `count` months, oldest first. */
export function monthlyExpenseSeries(items: Transaction[], count = 6) {
  const now = new Date();
  const buckets: { key: string; label: string; expense: number; income: number }[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key, label: monthLabel(key).split(" ")[0] ?? key, expense: 0, income: 0 });
  }

  for (const t of items) {
    const bucket = buckets.find((b) => b.key === monthKey(t.date));
    if (!bucket) continue;
    if (t.type === "expense") bucket.expense += t.amount;
    else bucket.income += t.amount;
  }
  return buckets;
}

/** Expense totals grouped by category (descending). */
export function categoryBreakdown(items: Transaction[]) {
  const map = new Map<string, number>();
  for (const t of items) {
    if (t.type !== "expense") continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Distinct months present in the data (newest first). */
export function availableMonths(items: Transaction[]) {
  return [...new Set(items.map((t) => monthKey(t.date)))].sort().reverse();
}

/* -------------------------------- validation ------------------------------- */

export interface FormValues {
  title: string;
  amount: string;
  category: string;
  date: string;
  type: TxType;
  notes: string;
}

export type FormErrors = Partial<Record<keyof FormValues, string>>;

export function validateTransaction(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.title.trim()) errors.title = "Title is required";
  else if (values.title.trim().length > 60) errors.title = "Keep the title under 60 characters";

  const amount = Number(values.amount);
  if (!values.amount.trim()) errors.amount = "Amount is required";
  else if (Number.isNaN(amount)) errors.amount = "Amount must be a number";
  else if (amount <= 0) errors.amount = "Amount must be greater than zero";
  else if (amount > 1_000_000_000) errors.amount = "Amount is too large";

  if (!values.category) errors.category = "Pick a category";

  if (!values.date) errors.date = "Date is required";
  else {
    const d = new Date(values.date);
    if (Number.isNaN(d.getTime())) errors.date = "Invalid date";
    else if (d.getTime() > Date.now() + 86_400_000) errors.date = "Date cannot be in the future";
  }

  if (values.notes.length > 200) errors.notes = "Notes must be under 200 characters";

  return errors;
}
