import { Flame, CalendarRange, Clock3 } from "lucide-react";
import {
  categoryBreakdown,
  formatCurrency,
  monthLabel,
  type Totals,
  type Transaction,
} from "@/lib/expenses";
import { cn } from "@/lib/utils";

interface AnalyticsProps {
  transactions: Transaction[];
  totals: Totals;
  month: string;
}

/** Highest expense category, monthly summary and recent activity. */
export function Analytics({ transactions, totals, month }: AnalyticsProps) {
  const top = categoryBreakdown(transactions)[0];
  const totalExpense = totals.expense || 1;
  const recent = [...transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="glass-card animate-fade-up p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="size-4 text-destructive" />
          Highest expense category
        </div>
        {top ? (
          <>
            <p className="mt-4 text-2xl font-extrabold tracking-tight">{top.name}</p>
            <p className="text-sm text-muted-foreground">{formatCurrency(top.value)} spent</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full gradient-danger transition-smooth"
                style={{ width: `${Math.min(100, (top.value / totalExpense) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {((top.value / totalExpense) * 100).toFixed(1)}% of all expenses
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No expenses recorded yet.</p>
        )}
      </section>

      <section className="glass-card animate-fade-up p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarRange className="size-4 text-primary" />
          {monthLabel(month)} summary
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          {[
            { label: "Income", value: totals.monthIncome, tone: "text-success" },
            { label: "Expenses", value: totals.monthExpense, tone: "text-destructive" },
            {
              label: "Savings",
              value: totals.savings,
              tone: totals.savings >= 0 ? "text-success" : "text-destructive",
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className={cn("font-bold tabular-nums", row.tone)}>
                {formatCurrency(row.value)}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <dt className="text-muted-foreground">Savings rate</dt>
            <dd className="font-bold tabular-nums">
              {totals.monthIncome > 0
                ? `${((totals.savings / totals.monthIncome) * 100).toFixed(0)}%`
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="glass-card animate-fade-up p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock3 className="size-4 text-primary" />
          Recent transactions
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.category}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-semibold tabular-nums",
                    t.type === "income" ? "text-success" : "text-destructive",
                  )}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
