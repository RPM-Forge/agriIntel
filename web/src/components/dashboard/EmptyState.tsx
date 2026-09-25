"use client";

import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export default function EmptyState({
  icon = "box",
  title,
  sub,
  action,
  compact,
}: {
  icon?: IconName;
  title: string;
  sub?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`dash-empty${compact ? " is-compact" : ""}`}>
      <span className="dash-empty__icon">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="dash-empty__title">{title}</h3>
      {sub && <p className="dash-empty__sub">{sub}</p>}
      {action && <div className="dash-empty__action">{action}</div>}
    </div>
  );
}