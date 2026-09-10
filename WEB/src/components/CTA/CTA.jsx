import React from 'react';
import { ArrowRight, Sprout } from 'lucide-react';
import './CTA.css';

const CTA = () => {
  return (
    <section className="cta">
      <div className="cta__shapes" aria-hidden="true">
        <div className="cta__shape cta__shape--1" />
        <div className="cta__shape cta__shape--2" />
        <div className="cta__shape cta__shape--3" />
      </div>

      <div className="cta__container">
        <div className="cta__icon">
          <Sprout size={28} />
        </div>
        <h2 className="cta__title">Turn Market Information Into Better Decisions</h2>
        <p className="cta__subtitle">
          Join thousands of farmers and FPOs who are discovering better market
          opportunities, connecting with trusted buyers, and managing transactions
          digitally.
        </p>
        <a href="#market-intelligence" className="cta__button">
          Start Exploring
          <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
};

export default CTA;