import React, { useEffect, useRef, useState } from 'react';
import { Search, Package, Handshake, Truck, Wallet, ArrowRight, Check } from 'lucide-react';
import './HowItWorks.css';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Check Market Prices',
    description: 'Access real-time prices across multiple mandis and markets',
  },
  {
    number: '02',
    icon: Package,
    title: 'Create Your Lot',
    description: 'List your produce with quality details and expected pricing',
  },
  {
    number: '03',
    icon: Handshake,
    title: 'Get Matched With Buyers',
    description: 'Our algorithm connects you with the best-suited verified buyers',
  },
  {
    number: '04',
    icon: Truck,
    title: 'Coordinate Logistics',
    description: 'Arrange transport and storage through our logistics partners',
  },
  {
    number: '05',
    icon: Wallet,
    title: 'Track Payment',
    description: 'Monitor payment status from acceptance to settlement',
  },
];

const StepCard = ({ step, index, visible }) => {
  const Icon = step.icon;

  return (
    <div
      className={`step-card ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 0.15}s` }}
    >
      <div className="step-connector-line" />
      <div className="step-number">{step.number}</div>
      <div className="step-icon-circle">
        <Icon size={24} strokeWidth={2} />
      </div>
      <h3 className="step-title">{step.title}</h3>
      <p className="step-description">{step.description}</p>
      <div className="step-check">
        <Check size={14} />
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="how-it-works" id="how-it-works" ref={sectionRef}>
      <div className="hiw-header">
        <div className="hiw-badge">
          <ArrowRight size={14} />
          <span>Simple Process</span>
        </div>
        <h2 className="hiw-title">How It Works</h2>
        <p className="hiw-subtitle">
          Five simple steps from market intelligence to successful transaction
        </p>
      </div>

      <div className="steps-container">
        <div className="steps-line" />
        <div className="steps-grid">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
