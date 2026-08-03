import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { formatCurrency, type Totals } from "@/lib/expenses";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  totals: Totals;
  monthName: string;
}

/** Four headline KPI cards for the dashboard. */
export function StatCards({ totals, monthName }: StatCardsProps) {
  const cards = [
    {
      label: "Total Balance",
      value: totals.balance,
      hint: "Income minus expenses",
      icon: Wallet,
      accent: "gradient-primary",
    },
    {
      label: "Total Income",
      value: totals.income,
      hint: "All time earnings",
      icon: ArrowUpRight,
      accent: "gradient-success",
    },
    {
      label: "Total Expenses",
      value: totals.expense,
      hint: "All time spending",
      icon: ArrowDownRight,
      accent: "gradient-danger",
    },
    {
      label: "Monthly Savings",
      value: totals.savings,
      hint: monthName,
      icon: PiggyBank,
      accent: totals.savings >= 0 ? "gradient-success" : "gradient-danger",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="glass-card hover-lift animate-fade-up p-5"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {card.label}
              </p>
              <p
                className={cn(
                  "mt-2 truncate text-2xl font-extrabold tracking-tight",
                  card.value < 0 ? "text-destructive" : "text-foreground",
                )}
              >
                {formatCurrency(card.value)}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{card.hint}</p>
            </div>
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-2xl text-primary-foreground shadow-elevated",
                card.accent,
              )}
            >
              <card.icon className="size-5" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
