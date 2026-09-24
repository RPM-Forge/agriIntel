import Link from "next/link";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type StatTone = "green" | "orange" | "blue" | "violet" | "teal";

export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  href,
  tone = "green",
}: {
  icon: IconName;
  title: string;
  value: string;
  subtitle: string;
  href: string;
  tone?: StatTone;
}) {
  const body = (
    <>
      <span className={`stat-card__icon stat-card__icon--${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <span className="stat-card__body">
        <span className="stat-card__title">{title}</span>
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__sub">{subtitle}</span>
      </span>
      <span className="stat-card__arrow">
        <Icon name="arrowRight" size={18} />
      </span>
    </>
  );

  const classes = `stat-card${href ? " is-link" : ""}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}