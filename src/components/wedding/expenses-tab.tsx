"use client";

import { Plus, Trash2, Wallet, Pencil } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DualCurrencyValue, StatCard } from "@/components/ui/stat-card";
import {
  DataTable,
  FormDialog,
  FormField,
  QueryState,
  Toolbar,
  type DataTableColumn,
} from "@/components/kit";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useExpenseSummary,
  useUpdateExpense,
} from "@/hooks/use-expenses";
import { apiErrorMessage } from "@/lib/api";
import type { Expense } from "@/types/api";
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
  currency: string;
  paid_amount: string;
  status: string;
  spent_at: string;
  note: string;
}

const EMPTY_FORM: ExpenseForm = {
  item_name: "",
  vendor: "",
  amount: "",
  currency: "USD",
  paid_amount: "",
  status: "planned",
  spent_at: "",
  note: "",
};

export function ExpensesTab({ weddingId }: { weddingId: number }) {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expenses = useExpenses(weddingId, {
    status: status || undefined,
    page,
  });
  const { data: summary } = useExpenseSummary(weddingId);
  const createExpense = useCreateExpense(weddingId);
  const updateExpense = useUpdateExpense(weddingId);
  const { mutate: removeExpense } = useDeleteExpense(weddingId);
  const confirm = useConfirm();

  const form = useForm<ExpenseForm>({ defaultValues: EMPTY_FORM });

  const openDialog = () => {
    setError(null);
    setEditingExpense(null);
    form.reset(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((expense: Expense) => {
    setError(null);
    setEditingExpense(expense);
    form.reset({
      item_name: expense.item_name,
      vendor: expense.vendor ?? "",
      amount: String(expense.amount),
      currency: expense.currency || "USD",
      paid_amount: expense.paid_amount ? String(expense.paid_amount) : "",
      status: expense.status,
      spent_at: expense.spent_at ? expense.spent_at.split("T")[0] : "",
      note: expense.note ?? "",
    });
    setDialogOpen(true);
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const payload = {
        item_name: values.item_name,
        vendor: values.vendor || null,
        amount: values.amount ? Number(values.amount) : 0,
        currency: values.currency,
        paid_amount: values.paid_amount ? Number(values.paid_amount) : 0,
        status: values.status,
        spent_at: values.spent_at || null,
        note: values.note || null,
      };

      if (editingExpense) {
        await updateExpense.mutateAsync({ expenseId: editingExpense.id, payload });
      } else {
        await createExpense.mutateAsync(payload);
      }
      form.reset(EMPTY_FORM);
      setDialogOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const columns = useMemo<DataTableColumn<Expense>[]>(
    () => [
      {
        key: "item",
        header: "Item / Service",
        className: "font-medium text-zinc-800",
        cell: (expense) => expense.item_name,
      },
      {
        key: "vendor",
        header: "Vendor",
        hideBelow: "md",
        className: "text-zinc-600",
        cell: (expense) => expense.vendor ?? "—",
      },
      {
        key: "amount",
        header: "Amount",
        cell: (expense) => formatMoney(expense.amount, expense.currency),
      },
      {
        key: "paid",
        header: "Paid",
        className: "text-zinc-600",
        cell: (expense) => formatMoney(expense.paid_amount, expense.currency),
      },
      {
        key: "status",
        header: "Status",
        cell: (expense) => (
          <Badge variant={STATUS_VARIANT[expense.status] ?? "secondary"}>
            {STATUS_LABELS[expense.status] ?? expense.status}
          </Badge>
        ),
      },
      {
        key: "date",
        header: "Date",
        hideBelow: "sm",
        className: "text-xs text-zinc-500",
        cell: (expense) => (expense.spent_at ? formatDate(expense.spent_at) : "—"),
      },
      {
        key: "actions",
        header: "",
        headClassName: "w-24",
        cell: (expense) => (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit expense"
              onClick={() => openEditDialog(expense)}
            >
              <Pencil className="h-4 w-4 text-zinc-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete expense"
              onClick={async () => {
                if (
                  await confirm({
                    title: "Delete this expense record?",
                    description: "This expense entry will be permanently removed.",
                  })
                ) {
                  removeExpense(expense.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [confirm, openEditDialog, removeExpense],
  );

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Total Items" value={summary.total_expenses} icon={Wallet} />
          <StatCard
            label="Total Budget"
            value={
              <DualCurrencyValue usd={summary.total_amount_usd} khr={summary.total_amount_khr} formatMoney={formatMoney} />
            }
            accent="sky"
          />
          <StatCard
            label="Paid"
            value={
              <DualCurrencyValue usd={summary.total_paid_usd} khr={summary.total_paid_khr} formatMoney={formatMoney} />
            }
            accent="amber"
          />
          <StatCard
            label="Outstanding"
            value={
              <DualCurrencyValue usd={summary.total_outstanding_usd} khr={summary.total_outstanding_khr} formatMoney={formatMoney} />
            }
            accent="rose"
          />
        </div>
      ) : null}

      <Toolbar
        actions={
          <Button size="sm" onClick={openDialog}>
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        }
      >
        <Select
          className="w-44"
          aria-label="Filter by status"
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
      </Toolbar>

      <QueryState
        query={expenses}
        loadingLabel="Loading expenses..."
        empty={{
          title: "No expenses recorded",
          description: "Track vendor costs, deposits and payments against your budget.",
          action: (
            <Button onClick={openDialog}>
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          ),
        }}
      >
        {(expensesPage) => (
          <DataTable
            caption="Wedding expenses"
            columns={columns}
            rows={expensesPage.data}
            rowKey={(expense) => expense.id}
            meta={expensesPage.meta}
            onPageChange={setPage}
            isFetching={expenses.isFetching}
          />
        )}
      </QueryState>

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
        onSubmit={onSubmit}
        error={error}
        pending={createExpense.isPending || updateExpense.isPending}
        submitLabel={editingExpense ? "Save Changes" : "Save Expense"}
      >
        <FormField
          label="Item / Service"
          required
          error={form.formState.errors.item_name?.message}
        >
          {(field) => (
            <Input
              {...field}
              {...form.register("item_name", { required: "Item name is required" })}
            />
          )}
        </FormField>
        <FormField label="Vendor">
          {(field) => <Input {...field} {...form.register("vendor")} />}
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid grid-cols-[1fr_80px] gap-2">
            <FormField label="Amount">
              {(field) => (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  {...form.register("amount")}
                />
              )}
            </FormField>
            <FormField label="Cur.">
              {(field) => (
                <Select {...field} {...form.register("currency")}>
                  <option value="USD">USD</option>
                  <option value="KHR">KHR</option>
                </Select>
              )}
            </FormField>
          </div>
          <FormField label="Paid amount">
            {(field) => (
              <Input
                type="number"
                step="0.01"
                min="0"
                {...field}
                {...form.register("paid_amount")}
              />
            )}
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Status">
            {(field) => (
              <Select {...field} {...form.register("status")}>
                <option value="planned">Planned</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Paid</option>
              </Select>
            )}
          </FormField>
          <FormField label="Date">
            {(field) => <Input type="date" {...field} {...form.register("spent_at")} />}
          </FormField>
        </div>
        <FormField label="Note">
          {(field) => <Input {...field} {...form.register("note")} />}
        </FormField>
      </FormDialog>
    </div>
  );
}
