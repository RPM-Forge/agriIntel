import Link from "next/link";
import { Icon } from "./Icon";
import EmptyState from "./EmptyState";

export default function RecentActivity() {
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

      <EmptyState
        compact
        icon="clock"
        title="No recent activity"
        sub="Buyer offers, payments and transport updates will appear here once you start transacting."
      />
    </section>
  );
}