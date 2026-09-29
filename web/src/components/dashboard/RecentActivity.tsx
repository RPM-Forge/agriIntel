import Link from "next/link";
import { Icon } from "./Icon";
import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";
import type { DashboardActivity } from "@/lib/marketplace";
import { formatDate } from "@/lib/marketplace";
import type { IconName } from "./Icon";

const ACTIVITY_ICONS: Record<DashboardActivity["kind"], IconName> = {
  order: "box",
  payment: "banknote",
  shipment: "truck",
  listing: "sprout",
};

function toneForStatus(status: string) {
  if (["accepted", "fulfilled", "settled", "delivered", "available"].includes(status)) return "green";
  if (["pending", "planned", "picked_up", "in_transit", "out_for_delivery"].includes(status)) return "orange";
  if (["rejected", "cancelled", "closed", "sold"].includes(status)) return "gray";
  return "blue";
}

export default function RecentActivity({ items, error }: { items: DashboardActivity[]; error?: string }) {
  return (
    <section className="card">
      <header className="card__head">
        <h3 className="card__title">
          <span className="card__title-icon">
            <Icon name="clock" size={17} />
          </span>
          Recent Activity
        </h3>
        <Link href="/dashboard/orders" className="card__link">
          View All
          <Icon name="arrowRight" size={15} />
        </Link>
      </header>

      {error ? (
        <p className="workflow-error" role="alert">{error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon="clock"
          title="No recent activity"
          sub="Produce listings, orders, payments and transport updates will appear here."
        />
      ) : (
        <div className="workflow-activity">
          {items.map((item) => (
            <article className="workflow-activity__item" key={item.id}>
              <span className="workflow-activity__icon"><Icon name={ACTIVITY_ICONS[item.kind]} size={17} /></span>
              <div className="workflow-activity__copy">
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <div className="workflow-activity__meta">
                <StatusBadge tone={toneForStatus(item.status)}>{item.status.replaceAll("_", " ")}</StatusBadge>
                <time dateTime={item.at}>{formatDate(item.at)}</time>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}