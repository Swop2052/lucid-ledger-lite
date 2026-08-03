import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  categoryBreakdown,
  formatCurrency,
  monthlyExpenseSeries,
  type Transaction,
} from "@/lib/expenses";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary-glow)",
];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  color: "var(--popover-foreground)",
  fontSize: "0.8rem",
};

/** Monthly bar chart + category pie chart. */
export function Charts({ transactions }: { transactions: Transaction[] }) {
  const monthly = monthlyExpenseSeries(transactions, 6);
  const byCategory = categoryBreakdown(transactions).slice(0, 6);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="glass-card animate-fade-up p-5">
        <h2 className="text-lg font-bold tracking-tight">Monthly expenses</h2>
        <p className="text-xs text-muted-foreground">Spending over the last 6 months</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={48}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                contentStyle={tooltipStyle}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="expense" fill="var(--chart-1)" radius={[10, 10, 6, 6]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="glass-card animate-fade-up p-5">
        <h2 className="text-lg font-bold tracking-tight">Spending by category</h2>
        <p className="text-xs text-muted-foreground">Top expense categories</p>
        {byCategory.length === 0 ? (
          <div className="mt-6 grid h-56 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            No expense data yet
          </div>
        ) : (
          <div className="mt-2 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {byCategory.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2">
              {byCategory.map((entry, i) => (
                <li key={entry.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {entry.name}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatCurrency(entry.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
