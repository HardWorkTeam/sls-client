/**
 * Composed UI kit shared byte-for-byte between sls-client and sls-admin —
 * `node scripts/check-ui-sync.mjs` (repo root) fails the build when the
 * copies drift. Edit in one app, then sync with `--fix`.
 *
 * Layering: ui/ = unopinionated primitives; kit/ = the product's repeated
 * patterns (async boundaries, list tables, form scaffolding) composed from
 * them. Feature code should reach for kit/ first.
 */
export { DataTable, type DataTableColumn } from "./data-table";
export { FormDialog } from "./form-dialog";
export { FormError, FormField, type FieldControlProps } from "./form-field";
export { ErrorState, QueryState, type QueryEmptyProps, type QueryLike } from "./query-state";
export { SearchInput } from "./search-input";
export { Toolbar } from "./toolbar";
