import React, { useState } from 'react';
import { Package, MapPin, Wheat, IndianRupee, Calendar, Star, PlusCircle, CheckCircle2, ArrowRight, Edit3 } from 'lucide-react';
import './LotCreator.css';

const crops = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Onion'];
const units = ['Quintal', 'Kg', 'MT'];
const grades = ['Grade A', 'Grade B+', 'Grade B'];
const locationSuggestions = [
  'Indore, Madhya Pradesh',
  'Nashik, Maharashtra',
  'Ludhiana, Punjab',
  'Karnal, Haryana',
  'Rajkot, Gujarat',
  'Varanasi, Uttar Pradesh',
];

const generateLotNumber = () => {
  const num = Math.floor(100 + Math.random() * 900);
  return `KM-2026-${num}`;
};

const LotCreator = () => {
  const [form, setForm] = useState({
    crop: '',
    quantity: '',
    unit: 'Quintal',
    location: '',
    price: '',
    grade: '',
    harvestDate: '',
    availableFrom: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lotNumber] = useState(generateLotNumber());

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.crop) newErrors.crop = true;
    if (!form.quantity) newErrors.quantity = true;
    if (!form.location) newErrors.location = true;
    if (!form.price) newErrors.price = true;
    if (!form.grade) newErrors.grade = true;
    if (!form.harvestDate) newErrors.harvestDate = true;
    if (!form.availableFrom) newErrors.availableFrom = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
    }
  };

  const estimatedMatches = Math.floor(8 + Math.random() * 15);

  if (submitted) {
    return (
      <section className="lot-creator">
        <div className="lot-success">
          <div className="confetti">
            {[...Array(20)].map((_, i) => (
              <span key={i} className={`confetti-piece confetti-${i % 5}`} style={{ '--i': i }} />
            ))}
          </div>
          <CheckCircle2 size={64} className="success-icon" />
          <h2>Lot Created Successfully!</h2>
          <p className="lot-number-display">Lot #{lotNumber}</p>
          <p>Your <strong>{form.crop}</strong> lot is now listed and visible to verified buyers.</p>
          <div className="success-details">
            <span>{form.quantity} {form.unit}</span>
            <span>•</span>
            <span>₹{Number(form.price).toLocaleString('en-IN')}/{form.unit}</span>
            <span>•</span>
            <span>{form.grade}</span>
          </div>
          <p className="match-count">Est. {estimatedMatches} buyer matches found</p>
          <div className="success-actions">
            <button className="btn-primary" onClick={() => { setSubmitted(false); setForm({ crop: '', quantity: '', unit: 'Quintal', location: '', price: '', grade: '', harvestDate: '', availableFrom: '' }); }}>
              <PlusCircle size={18} /> Create Another Lot
            </button>
            <button className="btn-secondary">
              View My Lots <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lot-creator">
      <div className="lot-creator-header">
        <div className="section-badge"><Package size={16} /> Quick Listing</div>
        <h2>Create Your Lot</h2>
        <p>List your produce in seconds and start connecting with verified buyers</p>
      </div>

      <div className="lot-creator-body">
        <form className="lot-form" onSubmit={handleSubmit} noValidate>
          <div className={`form-group ${errors.crop ? 'has-error' : ''}`}>
            <label><Wheat size={16} /> Crop *</label>
            <select value={form.crop} onChange={(e) => handleChange('crop', e.target.value)}>
              <option value="">Select crop</option>
              {crops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.crop && <span className="field-error">Please select a crop</span>}
          </div>

          <div className="form-row">
            <div className={`form-group ${errors.quantity ? 'has-error' : ''}`}>
              <label><Package size={16} /> Quantity *</label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={form.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                min="0"
              />
              {errors.quantity && <span className="field-error">Required</span>}
            </div>
            <div className="form-group">
              <label>Unit</label>
              <div className="unit-selector">
                {units.map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={`unit-btn ${form.unit === u ? 'active' : ''}`}
                    onClick={() => handleChange('unit', u)}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`form-group location-group ${errors.location ? 'has-error' : ''}`}>
            <label><MapPin size={16} /> Location *</label>
            <input
              type="text"
              placeholder="Search your location..."
              value={form.location}
              onChange={(e) => { handleChange('location', e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && form.location.length === 0 && (
              <div className="suggestions-dropdown">
                {locationSuggestions.map((s) => (
                  <div key={s} className="suggestion-item" onMouseDown={() => { handleChange('location', s); setShowSuggestions(false); }}>
                    <MapPin size={14} /> {s}
                  </div>
                ))}
              </div>
            )}
            {showSuggestions && form.location.length > 0 && (
              <div className="suggestions-dropdown">
                {locationSuggestions.filter((s) => s.toLowerCase().includes(form.location.toLowerCase())).map((s) => (
                  <div key={s} className="suggestion-item" onMouseDown={() => { handleChange('location', s); setShowSuggestions(false); }}>
                    <MapPin size={14} /> {s}
                  </div>
                ))}
              </div>
            )}
            {errors.location && <span className="field-error">Please enter your location</span>}
          </div>

          <div className={`form-group ${errors.price ? 'has-error' : ''}`}>
            <label><IndianRupee size={16} /> Expected Price *</label>
            <div className="price-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                placeholder="e.g. 2500"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                min="0"
              />
              <span className="price-unit">/{form.unit}</span>
            </div>
            {errors.price && <span className="field-error">Please enter expected price</span>}
          </div>

          <div className={`form-group ${errors.grade ? 'has-error' : ''}`}>
            <label><Star size={16} /> Quality Grade *</label>
            <div className="grade-options">
              {grades.map((g) => (
                <label key={g} className={`grade-radio ${form.grade === g ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="grade"
                    value={g}
                    checked={form.grade === g}
                    onChange={(e) => handleChange('grade', e.target.value)}
                  />
                  <span className="radio-custom" />
                  {g}
                </label>
              ))}
            </div>
            {errors.grade && <span className="field-error">Please select a grade</span>}
          </div>

          <div className="form-row">
            <div className={`form-group ${errors.harvestDate ? 'has-error' : ''}`}>
              <label><Calendar size={16} /> Harvest Date *</label>
              <input
                type="date"
                value={form.harvestDate}
                onChange={(e) => handleChange('harvestDate', e.target.value)}
              />
              {errors.harvestDate && <span className="field-error">Required</span>}
            </div>
            <div className={`form-group ${errors.availableFrom ? 'has-error' : ''}`}>
              <label><Calendar size={16} /> Available From *</label>
              <input
                type="date"
                value={form.availableFrom}
                onChange={(e) => handleChange('availableFrom', e.target.value)}
              />
              {errors.availableFrom && <span className="field-error">Required</span>}
            </div>
          </div>

          <button type="submit" className="submit-btn">
            <PlusCircle size={18} /> Create Lot
          </button>
        </form>

        <div className="lot-preview">
          <div className="preview-header">
            <Edit3 size={16} /> Live Preview
          </div>
          <div className={`preview-card ${submitted ? 'listed' : ''}`}>
            <div className="preview-card-top">
              <span className="preview-lot-number">Lot #{lotNumber}</span>
              <span className={`preview-status ${submitted ? 'listed' : 'draft'}`}>
                {submitted ? 'Listed' : 'Draft'}
              </span>
            </div>
            <h3 className="preview-crop">{form.crop || 'Select a crop'}</h3>
            <div className="preview-details">
              <div className="preview-detail">
                <Package size={14} />
                <span>{form.quantity ? `${form.quantity} ${form.unit}` : '0 Quintal'}</span>
              </div>
              <div className="preview-detail">
                <MapPin size={14} />
                <span>{form.location || 'Location not set'}</span>
              </div>
              <div className="preview-detail price">
                <IndianRupee size={14} />
                <span>{form.price ? `₹${Number(form.price).toLocaleString('en-IN')}/${form.unit}` : '₹0/Quintal'}</span>
              </div>
              <div className="preview-detail">
                <Star size={14} />
                <span>{form.grade || 'No grade selected'}</span>
              </div>
            </div>
            <div className="preview-dates">
              {form.harvestDate && (
                <div className="preview-date">
                  <Calendar size={12} />
                  <span>Harvested: {new Date(form.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {form.availableFrom && (
                <div className="preview-date">
                  <Calendar size={12} />
                  <span>Available: {new Date(form.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
            <div className="preview-match">
              <span className="match-dot" />
              Est. {estimatedMatches} buyer matches
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LotCreator;
