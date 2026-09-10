import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Eye,
  ArrowDownRight,
  Users,
  ShieldCheck,
  Handshake,
  FileCheck,
} from 'lucide-react';
import { impactMetrics } from '../../data/mockData';
import './ImpactSection.css';

const iconMap = {
  TrendingUp,
  Eye,
  ArrowDownRight,
  Users,
  ShieldCheck,
  Handshake,
  FileCheck,
};

const Counter = ({ value, suffix, start }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!start) {
      setDisplay(0);
      return;
    }

    let rafId;
    const duration = 2000;
    const startTime = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplay(Math.round(easeOutCubic(progress) * value));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [start, value]);

  return (
    <div className="impact-value-row">
      <span className="impact-value">{display}</span>
      {suffix && <span className="impact-suffix">{suffix}</span>}
    </div>
  );
};

const MetricCard = ({ metric, Icon, start, delay }) => (
  <div
    className={`impact-card${start ? ' impact-card--animate' : ''}`}
    style={start ? { animationDelay: `${delay}ms` } : undefined}
  >
    <div className="impact-icon">
      <Icon size={22} />
    </div>
    <Counter value={metric.value} suffix={metric.suffix} start={start} />
    <h3 className="impact-label">{metric.label}</h3>
    <p className="impact-description">{metric.description}</p>
  </div>
);

const ImpactSection = () => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="impact-section" id="impact" ref={sectionRef}>
      <div className="impact-header">
        <div className="impact-badge">
          <TrendingUp size={16} />
          <span>Impact</span>
        </div>
        <h2 className="impact-title">Platform Impact</h2>
        <p className="impact-subtitle">
          Measurable outcomes from smarter market connections
        </p>
      </div>

      <div className="impact-grid">
        {impactMetrics.map((metric, index) => {
          const Icon = iconMap[metric.icon] || TrendingUp;
          return (
            <MetricCard
              key={metric.label}
              metric={metric}
              Icon={Icon}
              start={inView}
              delay={index * 70}
            />
          );
        })}
      </div>

      <p className="impact-note">
        Prototype metrics — actual impact will be measured post-deployment
      </p>
    </section>
  );
};

export default ImpactSection;