# kit/ — composed UI patterns

`components/ui/` holds unopinionated primitives (Button, Table, Dialog…).
`components/kit/` composes them into the patterns every screen in sls-client
and sls-admin repeats. Feature code should reach for kit/ first and drop to
ui/ only for one-off layouts.

**This folder is shared byte-for-byte between the two apps.** Edit it in
either app, then run from the repo root:

```sh
node scripts/check-ui-sync.mjs          # verify (run in CI)
node scripts/check-ui-sync.mjs --fix    # copy newest edit to the other app
```

## Components

| Component | Replaces |
| --- | --- |
| `QueryState` | hand-rolled `isLoading ? <PageLoader/> : !data ? <EmptyState/> : …` chains — and adds the **error** state those chains silently drop |
| `DataTable` | Table/TableHead/TableRow/TableCell boilerplate + `<Pagination>` wiring |
| `FormField` / `FormError` | Label + input + red `<p>` with manual `id`/`htmlFor`/aria wiring |
| `FormDialog` | Dialog + `<form>` + Cancel/Submit footer + pending/disabled logic |
| `SearchInput` | search `<Input>` + `useDebouncedValue` + reset-page effect per screen |
| `Toolbar` | the filters-left / actions-right flex row above every list |

## Canonical list screen

```tsx
const gifts = useGifts(weddingId, { gift_type: giftType || undefined, page });

<Toolbar actions={<Button size="sm" onClick={openDialog}><Plus className="h-4 w-4" /> Record Gift</Button>}>
  <SearchInput onSearch={(q) => { setSearch(q); setPage(1); }} />
</Toolbar>

<QueryState
  query={gifts}
  loadingLabel="Loading gifts..."
  empty={{
    title: "No gifts recorded",
    description: "Track cash gifts, bank transfers and gift items received.",
    action: <Button onClick={openDialog}>Record Gift</Button>,
  }}
>
  {(page) => (
    <DataTable
      caption="Gifts received"
      columns={columns}          // DataTableColumn<Gift>[] — define at module scope
      rows={page.data}
      rowKey={(gift) => gift.id}
      meta={page.meta}
      onPageChange={setPage}
      isFetching={gifts.isFetching}
    />
  )}
</QueryState>
```

Column definitions live at module scope (or `useMemo` when they close over
state) so they aren't rebuilt per render:

```tsx
const columns: DataTableColumn<Gift>[] = [
  { key: "guest", header: "Guest", cell: (g) => g.guest?.name ?? "Anonymous", className: "font-medium text-zinc-800" },
  { key: "amount", header: "Amount", align: "right", cell: (g) => formatMoney(g.amount) },
  { key: "received", header: "Received", hideBelow: "md", cell: (g) => formatDateTime(g.received_at) },
];
```

## Canonical form dialog

```tsx
<FormDialog
  open={open}
  onClose={() => setOpen(false)}
  title="Record Gift"
  onSubmit={form.handleSubmit(save)}     // save() sets `error` via apiErrorMessage(err)
  pending={createGift.isPending}
  error={error}
  submitLabel="Save Gift"
>
  <FormField label="Amount" required error={form.formState.errors.amount?.message}>
    {(field) => <Input type="number" step="0.01" min="0" {...field} {...form.register("amount")} />}
  </FormField>
</FormDialog>
```

`FormField` generates the `id` and wires `aria-invalid` / `aria-describedby`;
spread `{...field}` BEFORE `{...form.register(...)}` so nothing clobbers the
register handlers.

## Conventions

- Loading, error and empty are QueryState's job — never render a DataTable
  behind your own `isLoading` ternary.
- Keep stale rows visible during refetches: pass `isFetching` to DataTable
  instead of falling back to the loader.
- Mark the least-important columns `hideBelow: "md"` (or `"sm"`/`"lg"`) so
  tables degrade on phones instead of forcing horizontal scroll.
- Every DataTable gets a `caption` — it's `sr-only`, screen readers rely on it.
- Form-level API errors go through `FormDialog`'s `error` prop (or
  `<FormError>`), not an ad-hoc `<p className="text-red-600">`.
