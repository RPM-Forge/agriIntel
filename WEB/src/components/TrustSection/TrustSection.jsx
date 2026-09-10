import React from 'react';
import {
  ShieldCheck,
  Eye,
  ClipboardCheck,
  Wallet,
  HeadphonesIcon,
  Database,
} from 'lucide-react';
import { trustFeatures } from '../../data/mockData';
import './TrustSection.css';

const iconMap = {
  ShieldCheck,
  Eye,
  ClipboardCheck,
  Wallet,
  HeadphonesIcon,
  Database,
};

const TrustSection = () => {
  return (
    <section className="trust-section" id="trust">
      <div className="trust-section__container">
        <div className="trust-section__header">
          <h2 className="trust-section__title">Farmer-First Trust & Transparency</h2>
          <p className="trust-section__subtitle">
            Built on principles that put farmers at the center
          </p>
        </div>

        <div className="trust-section__grid">
          {trustFeatures.map((feature) => {
            const Icon = iconMap[feature.icon] || ShieldCheck;
            return (
              <article className="trust-card" key={feature.title}>
                <div className="trust-card__icon">
                  <Icon size={24} />
                </div>
                <h3 className="trust-card__title">{feature.title}</h3>
                <p className="trust-card__description">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;