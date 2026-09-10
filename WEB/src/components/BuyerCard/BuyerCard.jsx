import React, { useState } from 'react';
import { ShieldCheck, MapPin, Star, X, Phone, Handshake, CheckCircle } from 'lucide-react';
import './BuyerCard.css';

const BuyerCard = ({ buyer }) => {
  const [showModal, setShowModal] = useState(false);

  const getReliabilityColor = (value) => {
    if (value > 95) return '#16a34a';
    if (value >= 85) return '#eab308';
    return '#dc2626';
  };

  const getReliabilityLabel = (value) => {
    if (value > 95) return 'Excellent';
    if (value >= 85) return 'Good';
    return 'Fair';
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} size={14} className="star filled" fill="#eab308" stroke="#eab308" />
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <Star key={i} size={14} className="star half" fill="#eab308" stroke="#eab308" />
        );
      } else {
        stars.push(<Star key={i} size={14} className="star empty" />);
      }
    }
    return stars;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  const reliabilityColor = getReliabilityColor(buyer.paymentReliability);
  const reliabilityLabel = getReliabilityLabel(buyer.paymentReliability);

  return (
    <>
      <div className="buyer-card" onClick={() => setShowModal(true)}>
        <div className="buyer-card-header">
          <div className="buyer-card-name-row">
            <h3 className="buyer-name">{buyer.name}</h3>
            {buyer.verified && (
              <span className="verified-badge" title="Verified Buyer">
                <ShieldCheck size={18} />
              </span>
            )}
          </div>
          <span className="buyer-type-tag">{buyer.type}</span>
        </div>

        <div className="buyer-card-body">
          <div className="buyer-detail-row">
            <span className="detail-label">Crop Needed</span>
            <span className="detail-value crop-value">{buyer.crop}</span>
          </div>
          <div className="buyer-detail-row">
            <span className="detail-label">Quantity</span>
            <span className="detail-value">{buyer.quantity}</span>
          </div>
          <div className="buyer-detail-row">
            <span className="detail-label">Quality</span>
            <span className="detail-value">{buyer.quality}</span>
          </div>

          <div className="buyer-price">
            <span className="price-amount">₹{buyer.price}</span>
            <span className="price-unit">/Qtl</span>
          </div>

          <div className="buyer-location">
            <MapPin size={14} />
            <span>{buyer.location}</span>
            {buyer.distance && <span className="distance-badge">{buyer.distance} km away</span>}
          </div>

          <div className="reliability-section">
            <div className="reliability-header">
              <span className="reliability-label">Payment Reliability</span>
              <span className="reliability-score" style={{ color: reliabilityColor }}>
                {buyer.paymentReliability}% — {reliabilityLabel}
              </span>
            </div>
            <div className="reliability-bar-bg">
              <div
                className="reliability-bar-fill"
                style={{
                  width: `${buyer.paymentReliability}%`,
                  backgroundColor: reliabilityColor,
                }}
              />
            </div>
          </div>

          <div className="buyer-detail-row">
            <span className="detail-label">Payment Terms</span>
            <span className="detail-value">{buyer.paymentTerms}</span>
          </div>

          <div className="buyer-rating">
            <div className="stars">{renderStars(buyer.rating)}</div>
            <span className="rating-text">{buyer.rating.toFixed(1)}</span>
          </div>

          <p className="buyer-description">{buyer.description}</p>
        </div>

        <div className="buyer-card-footer">
          <button className="view-offer-btn" onClick={(e) => { e.stopPropagation(); setShowModal(true); }}>
            View Offer
          </button>
        </div>
      </div>

      {showModal && (
        <div className="buyer-modal-overlay" onClick={handleBackdropClick}>
          <div className="buyer-modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <div className="modal-header">
              <div className="modal-name-row">
                <h2>{buyer.name}</h2>
                {buyer.verified && (
                  <span className="verified-badge modal-verified">
                    <ShieldCheck size={22} />
                    Verified
                  </span>
                )}
              </div>
              <span className="buyer-type-tag modal-type-tag">{buyer.type}</span>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h4>Crop Details</h4>
                <div className="modal-detail-grid">
                  <div className="modal-detail">
                    <span className="modal-detail-label">Crop Needed</span>
                    <span className="modal-detail-value">{buyer.crop}</span>
                  </div>
                  <div className="modal-detail">
                    <span className="modal-detail-label">Quantity</span>
                    <span className="modal-detail-value">{buyer.quantity}</span>
                  </div>
                  <div className="modal-detail">
                    <span className="modal-detail-label">Quality Requirement</span>
                    <span className="modal-detail-value">{buyer.quality}</span>
                  </div>
                  <div className="modal-detail">
                    <span className="modal-detail-label">Offered Price</span>
                    <span className="modal-detail-value modal-price">₹{buyer.price}/Qtl</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h4>Buyer Information</h4>
                <div className="modal-detail-grid">
                  <div className="modal-detail">
                    <span className="modal-detail-label">Location</span>
                    <span className="modal-detail-value">
                      <MapPin size={14} /> {buyer.location}
                      {buyer.distance && ` (${buyer.distance} km away)`}
                    </span>
                  </div>
                  <div className="modal-detail">
                    <span className="modal-detail-label">Payment Terms</span>
                    <span className="modal-detail-value">{buyer.paymentTerms}</span>
                  </div>
                  <div className="modal-detail">
                    <span className="modal-detail-label">Rating</span>
                    <span className="modal-detail-value">
                      <div className="stars">{renderStars(buyer.rating)}</div>
                      <span className="rating-text">{buyer.rating.toFixed(1)}</span>
                    </span>
                  </div>
                  <div className="modal-detail">
                    <span className="modal-detail-label">Payment Reliability</span>
                    <span className="modal-detail-value">
                      <div className="reliability-section modal-reliability">
                        <div className="reliability-header">
                          <span className="reliability-score" style={{ color: reliabilityColor }}>
                            {buyer.paymentReliability}% — {reliabilityLabel}
                          </span>
                        </div>
                        <div className="reliability-bar-bg">
                          <div
                            className="reliability-bar-fill"
                            style={{
                              width: `${buyer.paymentReliability}%`,
                              backgroundColor: reliabilityColor,
                            }}
                          />
                        </div>
                      </div>
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h4>Description</h4>
                <p className="modal-description">{buyer.description}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="action-btn accept-btn">
                <CheckCircle size={18} />
                Accept Offer
              </button>
              <button className="action-btn negotiate-btn">
                <Handshake size={18} />
                Negotiate
              </button>
              <button className="action-btn contact-btn">
                <Phone size={18} />
                Contact Buyer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BuyerCard;
