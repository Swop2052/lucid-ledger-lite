import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Moon, Plus, Sun, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCards } from "@/components/expense/StatCards";
import { TransactionForm } from "@/components/expense/TransactionForm";
import { TransactionList } from "@/components/expense/TransactionList";
import { Charts } from "@/components/expense/Charts";
import { Analytics } from "@/components/expense/Analytics";
import {
  THEME_KEY,
  computeTotals,
  loadTransactions,
  monthLabel,
  saveTransactions,
  todayISO,
  type Transaction,
} from "@/lib/expenses";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Expense Tracker — FinTech Dashboard" },
      {
        name: "description",
        content:
          "Track income, expenses, savings and spending trends with a fast, private expense dashboard stored on your device.",
      },
      { property: "og:title", content: "Smart Expense Tracker — FinTech Dashboard" },
      {
        property: "og:description",
        content:
          "Modern expense tracker with dashboards, charts and analytics. All data stays in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const currentMonth = todayISO().slice(0, 7);

  // Hydrate from local storage after mount (avoids SSR mismatch).
  useEffect(() => {
    setTransactions(loadTransactions());
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const prefersDark =
      storedTheme === "dark" ||
      (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
    const timer = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  const persist = useCallback((next: Transaction[]) => {
    setTransactions(next);
    saveTransactions(next);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  const handleSubmit = (tx: Transaction) => {
    const exists = transactions.some((t) => t.id === tx.id);
    persist(exists ? transactions.map((t) => (t.id === tx.id ? tx : t)) : [tx, ...transactions]);
    toast.success(exists ? "Transaction updated" : "Transaction added");
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    persist(transactions.filter((t) => t.id !== id));
    toast.success("Transaction deleted");
  };

  const totals = useMemo(
    () => computeTotals(transactions, currentMonth),
    [transactions, currentMonth],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-elevated">
            <Wallet className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
              Smart Expense Tracker
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {monthLabel(currentMonth)} · saved privately on this device
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="skeleton-shimmer h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="skeleton-shimmer h-72 rounded-2xl" />
          <Skeleton className="skeleton-shimmer h-96 rounded-2xl" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <StatCards totals={totals} monthName={monthLabel(currentMonth)} />
          <Charts transactions={transactions} />
          <Analytics transactions={transactions} totals={totals} month={currentMonth} />
          <TransactionList
            transactions={transactions}
            onAdd={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            onEdit={(tx) => {
              setEditing(tx);
              setFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        </div>
      )}

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
