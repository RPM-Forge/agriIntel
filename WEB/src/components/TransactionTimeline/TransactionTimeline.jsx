import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowDown,
  FileText,
  Handshake,
  ShieldCheck,
  Truck,
  PackageCheck,
  IndianRupee,
} from 'lucide-react';
import { transactionSteps } from '../../data/mockData';
import './TransactionTimeline.css';

const stepIcons = {
  'Lot Created': PackageCheck,
  'Buyer Offer Received': FileText,
  'Offer Accepted': Handshake,
  'Quality Verified': ShieldCheck,
  'Transport Assigned': Truck,
  'Delivered': ArrowDown,
  'Payment Completed': IndianRupee,
};

const colorFor = (status) => {
  if (status === 'completed') return 'var(--green-500)';
  if (status === 'active') return 'var(--accent-blue)';
  return 'var(--gray-400)';
};

const styleFor = (status) => (status === 'upcoming' ? 'dashed' : 'solid');

const StatusIndicator = ({ status }) => {
  if (status === 'completed') {
    return <CheckCircle2 className="tt-status-icon tt-status-icon--completed" size={16} />;
  }
  if (status === 'active') {
    return <span className="tt-status-dot" />;
  }
  return <Circle className="tt-status-icon tt-status-icon--upcoming" size={16} />;
};

const TransactionTimeline = () => {
  const steps = transactionSteps;

  return (
    <section className="tt-section">
      <div className="tt-header">
        <div className="tt-badge">
          <Clock size={16} />
          <span>Live Tracking</span>
        </div>
        <h2 className="tt-title">Transaction Tracking</h2>
        <p className="tt-subtitle">
          Complete visibility into every stage of your transaction
        </p>
      </div>

      <ul className="tt-steps">
        {steps.map((step, index) => {
          const Icon = stepIcons[step.label] || PackageCheck;
          const prev = steps[index - 1];
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={`tt-step tt-step--${step.status}${
                index === 0 ? ' tt-step--first' : ''
              }${isLast ? ' tt-step--last' : ''}`}
              style={{
                '--tt-seg-top-color': prev ? colorFor(prev.status) : undefined,
                '--tt-seg-top-style': prev ? styleFor(prev.status) : undefined,
                '--tt-seg-bottom-color': colorFor(step.status),
                '--tt-seg-bottom-style': styleFor(step.status),
              }}
            >
              <span className="tt-node">
                <span className="tt-bubble">
                  <Icon size={20} />
                  <StatusIndicator status={step.status} />
                </span>
              </span>

              <div className="tt-content">
                <span className="tt-label">{step.label}</span>

                {step.status === 'completed' && (
                  <span className="tt-date">{step.date}</span>
                )}

                {step.status === 'active' && (
                  <>
                    <span className="tt-date">{step.date}</span>
                    <span className="tt-progress-badge">In Progress</span>
                  </>
                )}

                {step.status === 'upcoming' && (
                  <span className="tt-pending">Pending</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TransactionTimeline;