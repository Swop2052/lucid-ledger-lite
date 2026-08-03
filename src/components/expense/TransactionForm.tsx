import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  INCOME_CATEGORIES,
  todayISO,
  uid,
  validateTransaction,
  type FormErrors,
  type FormValues,
  type Transaction,
  type TxType,
} from "@/lib/expenses";
import { cn } from "@/lib/utils";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Transaction | null;
  onSubmit: (tx: Transaction) => void;
}

const emptyValues = (): FormValues => ({
  title: "",
  amount: "",
  category: "",
  date: todayISO(),
  type: "expense",
  notes: "",
});

/** Add / edit transaction dialog with full client-side validation. */
export function TransactionForm({ open, onOpenChange, editing, onSubmit }: TransactionFormProps) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});

  // Sync the form whenever it opens (new entry vs. editing an existing one).
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      editing
        ? {
            title: editing.title,
            amount: String(editing.amount),
            category: editing.category,
            date: editing.date,
            type: editing.type,
            notes: editing.notes ?? "",
          }
        : emptyValues(),
    );
  }, [open, editing]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const categories =
    values.type === "income"
      ? INCOME_CATEGORIES
      : CATEGORIES.filter((c) => c !== "Salary" && c !== "Freelancing");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateTransaction(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    onSubmit({
      id: editing?.id ?? uid(),
      title: values.title.trim(),
      amount: Number(values.amount),
      category: values.category,
      date: values.date,
      type: values.type,
      notes: values.notes.trim() || undefined,
      createdAt: editing?.createdAt ?? Date.now(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>
            Track where every dollar goes. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            {(["expense", "income"] as TxType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  set("type", type);
                  set("category", "");
                }}
                className={cn(
                  "rounded-xl py-2 text-sm font-semibold capitalize transition-smooth",
                  values.type === type
                    ? type === "income"
                      ? "gradient-success text-primary-foreground shadow-elevated"
                      : "gradient-danger text-primary-foreground shadow-elevated"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={values.title}
              maxLength={60}
              placeholder="Grocery run"
              onChange={(e) => set("title", e.target.value)}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={values.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                max={todayISO()}
                value={values.date}
                onChange={(e) => set("date", e.target.value)}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={values.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              maxLength={200}
              placeholder="Optional details..."
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              {editing ? "Save changes" : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
