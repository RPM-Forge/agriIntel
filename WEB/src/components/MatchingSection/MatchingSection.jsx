import React, { useState, useEffect, useRef } from 'react';
import { Target, Zap, ShieldCheck, MapPin, Wallet, BarChart3, Star, ArrowRight, CheckCircle2 } from 'lucide-react';
import { matchedBuyers, lotDetails } from '../../data/mockData';
import './MatchingSection.css';

const defaultLot = {
  crop: 'Wheat',
  quantity: '120 Quintals',
  quality: 'Grade A',
  location: 'Sonipat FPO, Haryana',
  expectedPrice: '₹2,350/Qtl',
  harvestDate: 'Sep 5, 2026',
  availableFrom: 'Sep 7, 2026',
};

const defaultBuyers = [
  {
    id: 1,
    name: 'GrainFlow Enterprises',
    verified: true,
    offeredPrice: '₹2,420/Qtl',
    quantity: '100 Quintals',
    qualityMatch: '96%',
    distance: '45 km',
    paymentReliability: '98%',
    matchPercentage: 94,
    factors: { price: 92, quantity: 88, quality: 96, distance: 90, payment: 98 },
  },
  {
    id: 2,
    name: 'AgriTrade Solutions',
    verified: true,
    offeredPrice: '₹2,380/Qtl',
    quantity: '120 Quintals',
    qualityMatch: '94%',
    distance: '78 km',
    paymentReliability: '95%',
    matchPercentage: 89,
    factors: { price: 85, quantity: 95, quality: 94, distance: 72, payment: 95 },
  },
  {
    id: 3,
    name: 'Harvest Hub Co.',
    verified: false,
    offeredPrice: '₹2,400/Qtl',
    quantity: '80 Quintals',
    qualityMatch: '91%',
    distance: '120 km',
    paymentReliability: '88%',
    matchPercentage: 78,
    factors: { price: 88, quantity: 65, quality: 91, distance: 55, payment: 88 },
  },
];

const FactorBar = ({ label, value, visible }) => {
  const getColor = (v) => {
    if (v >= 90) return 'var(--color-excellent)';
    if (v >= 75) return 'var(--color-good)';
    if (v >= 50) return 'var(--color-average)';
    return 'var(--color-low)';
  };

  return (
    <div className="factor-row">
      <span className="factor-label">{label}</span>
      <div className="factor-bar-track">
        <div
          className="factor-bar-fill"
          style={{
            width: visible ? `${value}%` : '0%',
            backgroundColor: getColor(value),
          }}
        />
      </div>
      <span className="factor-value">{value}%</span>
    </div>
  );
};

const MatchCircle = ({ percentage, visible }) => {
  const getGrade = (pct) => {
    if (pct >= 90) return 'excellent';
    if (pct >= 80) return 'good';
    if (pct >= 65) return 'average';
    return 'low';
  };

  return (
    <div className={`match-circle ${getGrade(percentage)} ${visible ? 'animate' : ''}`}>
      <svg viewBox="0 0 100 100" className="match-circle-svg">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--color-bg-tertiary)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 42}`}
          strokeDashoffset={visible ? `${2 * Math.PI * 42 * (1 - percentage / 100)}` : `${2 * Math.PI * 42}`}
          className="match-circle-progress"
        />
      </svg>
      <div className="match-circle-text">
        <span className="match-percentage">{percentage}</span>
        <span className="match-percent-sign">%</span>
      </div>
    </div>
  );
};

const BuyerCard = ({ buyer, visible }) => {
  return (
    <div className={`buyer-card ${visible ? 'visible' : ''}`}>
      <div className="buyer-card-header">
        <MatchCircle percentage={buyer.matchPercentage} visible={visible} />
        <div className="buyer-info">
          <div className="buyer-name-row">
            <span className="buyer-name">{buyer.name}</span>
            {buyer.verified && (
              <span className="verified-badge">
                <CheckCircle2 size={14} />
              </span>
            )}
          </div>
          <span className="buyer-match-label">Match Score</span>
        </div>
      </div>

      <div className="buyer-details-grid">
        <div className="buyer-detail">
          <Wallet size={14} />
          <span className="detail-label">Offered Price</span>
          <span className="detail-value">{buyer.offeredPrice}</span>
        </div>
        <div className="buyer-detail">
          <BarChart3 size={14} />
          <span className="detail-label">Quantity</span>
          <span className="detail-value">{buyer.quantity}</span>
        </div>
        <div className="buyer-detail">
          <Star size={14} />
          <span className="detail-label">Quality Match</span>
          <span className="detail-value">{buyer.qualityMatch}</span>
        </div>
        <div className="buyer-detail">
          <MapPin size={14} />
          <span className="detail-label">Distance</span>
          <span className="detail-value">{buyer.distance}</span>
        </div>
      </div>

      <div className="buyer-factors">
        <div className="factors-header">
          <ShieldCheck size={14} />
          <span>Payment Reliability: {buyer.paymentReliability}</span>
        </div>
        <div className="factor-bars">
          <FactorBar label="Price" value={buyer.factors.price} visible={visible} />
          <FactorBar label="Quantity" value={buyer.factors.quantity} visible={visible} />
          <FactorBar label="Quality" value={buyer.factors.quality} visible={visible} />
          <FactorBar label="Distance" value={buyer.factors.distance} visible={visible} />
          <FactorBar label="Payment" value={buyer.factors.payment} visible={visible} />
        </div>
      </div>

      <button className="connect-btn">
        <Zap size={16} />
        Connect Now
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

const MatchingSection = () => {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  const lot = lotDetails || defaultLot;
  const buyers = (matchedBuyers && matchedBuyers.length > 0 ? matchedBuyers : defaultBuyers)
    .slice()
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
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
    <section className="matching-section" ref={sectionRef}>
      <div className="matching-section-header">
        <div className="section-badge">
          <Target size={16} />
          <span>Smart Matching</span>
        </div>
        <h2 className="section-title">Find the Right Buyer for Your Lot</h2>
        <p className="section-subtitle">
          Our intelligent matching engine analyzes price, quality, quantity, distance and payment
          reliability to find the best buyers for you
        </p>
      </div>

      <div className="matching-layout">
        <div className="lot-details-panel">
          <div className="panel-header">
            <h3>Your Lot Details</h3>
            <button className="edit-btn" aria-label="Edit lot details">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          </div>
          <div className="lot-card">
            <div className="lot-card-top">
              <div className="lot-crop-badge">{lot.crop}</div>
              <div className="lot-quantity">{lot.quantity}</div>
            </div>
            <div className="lot-card-body">
              <div className="lot-field">
                <span className="lot-field-label">Quality</span>
                <span className="lot-field-value">{lot.quality}</span>
              </div>
              <div className="lot-field">
                <span className="lot-field-label">Location</span>
                <span className="lot-field-value">{lot.location}</span>
              </div>
              <div className="lot-field highlight">
                <span className="lot-field-label">Expected Price</span>
                <span className="lot-field-value price">{lot.expectedPrice}</span>
              </div>
              <div className="lot-field">
                <span className="lot-field-label">Harvest Date</span>
                <span className="lot-field-value">{lot.harvestDate}</span>
              </div>
              <div className="lot-field">
                <span className="lot-field-label">Available From</span>
                <span className="lot-field-value">{lot.availableFrom}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="matched-buyers-panel">
          <div className="panel-header">
            <h3>Matched Buyers</h3>
            <span className="buyer-count">{buyers.length} matches found</span>
          </div>
          <div className="buyers-list">
            {buyers.map((buyer, index) => (
              <BuyerCard key={buyer.id} buyer={buyer} visible={visible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MatchingSection;
