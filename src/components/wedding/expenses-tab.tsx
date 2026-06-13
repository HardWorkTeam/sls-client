"use client";

import { Plus, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useExpenseSummary,
} from "@/hooks/use-expenses";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  partial: "Partially Paid",
  paid: "Paid",
};

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "success"> = {
  planned: "secondary",
  partial: "warning",
  paid: "success",
};

interface ExpenseForm {
  item_name: string;
  vendor: string;
  amount: string;
  paid_amount: string;
  status: string;
  spent_at: string;
  note: string;
}

const EMPTY_FORM: ExpenseForm = {
  item_name: "",
  vendor: "",
  amount: "",
  paid_amount: "",
  status: "planned",
  spent_at: "",
  note: "",
};

export function ExpensesTab({ weddingId }: { weddingId: number }) {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useExpenses(weddingId, {
    status: status || undefined,
    page,
  });
  const { data: summary } = useExpenseSummary(weddingId);
  const createExpense = useCreateExpense(weddingId);
  const deleteExpense = useDeleteExpense(weddingId);

  const form = useForm<ExpenseForm>({ defaultValues: EMPTY_FORM });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await createExpense.mutateAsync({
        item_name: values.item_name,
        vendor: values.vendor || null,
        amount: values.amount ? Number(values.amount) : 0,
        paid_amount: values.paid_amount ? Number(values.paid_amount) : 0,
        status: values.status,
        spent_at: values.spent_at || null,
        note: values.note || null,
      });
      form.reset(EMPTY_FORM);
      setDialogOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Total Items" value={summary.total_expenses} icon={Wallet} />
          <StatCard
            label="Total Budget"
            value={formatMoney(summary.total_amount)}
            accent="sky"
          />
          <StatCard
            label="Paid"
            value={formatMoney(summary.total_paid)}
            accent="amber"
          />
          <StatCard
            label="Outstanding"
            value={formatMoney(summary.total_outstanding)}
            accent="rose"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          className="w-44"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="planned">Planned</option>
          <option value="partial">Partially Paid</option>
          <option value="paid">Paid</option>
        </Select>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {isLoading ? (
        <PageLoader label="Loading expenses..." />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No expenses recorded"
          description="Track vendor costs, deposits and payments against your budget."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item / Service</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium text-zinc-800">
                    {expense.item_name}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {expense.vendor ?? "—"}
                  </TableCell>
                  <TableCell>{formatMoney(expense.amount)}</TableCell>
                  <TableCell className="text-zinc-600">
                    {formatMoney(expense.paid_amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[expense.status] ?? "secondary"}>
                      {STATUS_LABELS[expense.status] ?? expense.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {expense.spent_at ? formatDate(expense.spent_at) : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete expense"
                      onClick={() => {
                        if (confirm("Delete this expense record?")) {
                          deleteExpense.mutate(expense.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Expense">
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="expense-item">Item / Service</Label>
            <Input
              id="expense-item"
              {...form.register("item_name", { required: true })}
            />
          </div>
          <div>
            <Label htmlFor="expense-vendor">Vendor</Label>
            <Input id="expense-vendor" {...form.register("vendor")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expense-amount">Amount</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                {...form.register("amount")}
              />
            </div>
            <div>
              <Label htmlFor="expense-paid">Paid amount</Label>
              <Input
                id="expense-paid"
                type="number"
                step="0.01"
                min="0"
                {...form.register("paid_amount")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expense-status">Status</Label>
              <Select id="expense-status" {...form.register("status")}>
                <option value="planned">Planned</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-date">Date</Label>
              <Input id="expense-date" type="date" {...form.register("spent_at")} />
            </div>
          </div>
          <div>
            <Label htmlFor="expense-note">Note</Label>
            <Input id="expense-note" {...form.register("note")} />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              Save Expense
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
