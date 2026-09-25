import type { ReactNode } from "react";

export type StatusTone = "green" | "orange" | "red" | "gray" | "blue";

export default function StatusBadge({ tone = "gray", children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={`dash-badge dash-badge--${tone}`}>{children}</span>;
}