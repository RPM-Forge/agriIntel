import type { ReactNode } from "react";
import EmptyState from "./EmptyState";
import type { IconName } from "./Icon";

export interface DataColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
}

export default function DataTable({
  columns,
  rows,
  emptyIcon = "box",
  emptyTitle = "Nothing here yet",
  emptySub,
}: {
  columns: DataColumn[];
  rows: Array<Record<string, ReactNode>>;
  emptyIcon?: IconName;
  emptyTitle?: string;
  emptySub?: string;
}) {
  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.align === "right" ? "is-right" : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState compact icon={emptyIcon} title={emptyTitle} sub={emptySub} />
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col.key} className={col.align === "right" ? "is-right" : undefined}>
                    {row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}