import { useMemo, useState } from "react";
import { Pencil, Search, Trash2, Inbox } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  availableMonths,
  formatCurrency,
  monthKey,
  monthLabel,
  type Transaction,
} from "@/lib/expenses";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

/** Searchable, filterable and paginated transaction table. */
export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  onAdd,
}: TransactionListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("all");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const months = useMemo(() => availableMonths(transactions), [transactions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions
      .filter((t) => {
        const matchesTerm =
          !term ||
          t.title.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term) ||
          (t.notes ?? "").toLowerCase().includes(term);
        const matchesCategory = category === "all" || t.category === category;
        const matchesMonth = month === "all" || monthKey(t.date) === month;
        return matchesTerm && matchesCategory && matchesMonth;
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  }, [transactions, search, category, month]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <section className="glass-card animate-fade-up p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight">Transactions</h2>
          <p className="truncate text-xs text-muted-foreground">
            {filtered.length} record{filtered.length === 1 ? "" : "s"} found
          </p>
        </div>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={onAdd}>
          New
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search title, category or notes"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
          />
        </div>

        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            resetPage();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={month}
          onValueChange={(v) => {
            setMonth(v);
            resetPage();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {pageItems.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Inbox className="size-6" />
          </span>
          <p className="font-semibold">No transactions yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your first income or expense to start seeing insights on your dashboard.
          </p>
          <Button variant="outline" size="sm" onClick={onAdd}>
            Add transaction
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {pageItems.map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 transition-smooth hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-primary-foreground",
                    t.type === "income" ? "gradient-success" : "gradient-danger",
                  )}
                >
                  {t.category.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.category} · {new Date(t.date).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {t.notes ? ` · ${t.notes}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={cn(
                    "mr-1 text-sm font-bold tabular-nums",
                    t.type === "income" ? "text-success" : "text-destructive",
                  )}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${t.title}`}
                  onClick={() => onEdit(t)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${t.title}`}
                  onClick={() => setPendingDelete(t)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” will be permanently removed from your local data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
