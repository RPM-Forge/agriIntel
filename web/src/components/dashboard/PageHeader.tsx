import type { ReactNode } from "react";

export default function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="dash-page-head">
      <div className="dash-page-head__copy">
        <h1 className="dash-page-head__title">{title}</h1>
        {sub && <p className="dash-page-head__sub">{sub}</p>}
      </div>
      {actions && <div className="dash-page-head__actions">{actions}</div>}
    </div>
  );
}