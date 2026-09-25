"use client";

import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import { Icon } from "@/components/dashboard/Icon";
import type { IconName } from "@/components/dashboard/Icon";
import { useDashboard } from "@/components/dashboard/DashboardShell";

const LISTING_STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "sprout", title: "Add your lot", text: "Enter the crop, grade and quantity of what you want to sell." },
  { icon: "chartBar", title: "Check live rates", text: "See real mandi prices to set a fair, competitive rate." },
  { icon: "users", title: "Get buyer offers", text: "Connect with buyers and accept the best offer." },
];

export default function MyProducePage() {
  const { role } = useDashboard();

  if (role === "buyer") {
    return (
      <div>
        <PageHeader title="My Produce" sub="Manage the crop lots you want to sell." />
        <section className="card">
          <EmptyState
            icon="box"
            title="This page is for sellers"
            sub="Buyers use Orders and Payments to find and purchase produce at fair rates."
            action={
              <Link href="/dashboard/orders" className="btn btn--green btn--sm">
                View Orders
                <Icon name="arrowRight" size={15} />
              </Link>
            }
          />
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Produce" sub="List and manage the crop lots you want to sell." />

      <section className="card">
        <EmptyState
          icon="sprout"
          title="No produce listed yet"
          sub="When you list your first crop lot, it will appear here with its grade, quantity and status."
          action={
            <Link href="/dashboard/market-prices" className="btn btn--green btn--sm">
              Check Prices First
              <Icon name="arrowRight" size={15} />
            </Link>
          }
        />
      </section>

      <section className="card">
        <header className="card__head">
          <h3 className="card__title">How listing works</h3>
        </header>
        <div className="mini-steps">
          {LISTING_STEPS.map((step, index) => (
            <div className="mini-step" key={step.title}>
              <span className="mini-step__num">{index + 1}</span>
              <span className="mini-step__icon">
                <Icon name={step.icon} size={18} />
              </span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}