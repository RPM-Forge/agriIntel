import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, SlidersHorizontal, MapPin, Star, ShieldCheck } from 'lucide-react';
import { buyers, buyerTypes, cropFilters } from '../../data/buyerData';
import BuyerCard from '../BuyerCard/BuyerCard';
import './BuyerMarketplace.css';

const BuyerMarketplace = () => {
  const [cropFilter, setCropFilter] = useState('All');
  const [buyerTypeFilter, setBuyerTypeFilter] = useState('All');
  const [locationSearch, setLocationSearch] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [paymentTermsFilter, setPaymentTermsFilter] = useState('All');

  const paymentTermsOptions = ['All', 'Immediate', '7 Days', '15 Days', '30 Days', '60 Days'];

  const filteredBuyers = useMemo(() => {
    return buyers.filter((buyer) => {
      const matchesCrop = cropFilter === 'All' || buyer.crop === cropFilter;
      const matchesType = buyerTypeFilter === 'All' || buyer.type === buyerTypeFilter;
      const matchesLocation =
        locationSearch === '' ||
        buyer.location.toLowerCase().includes(locationSearch.toLowerCase());
      const matchesPrice = buyer.price >= minPrice;
      const matchesPayment = paymentTermsFilter === 'All' || buyer.paymentTerms === paymentTermsFilter;

      return matchesCrop && matchesType && matchesLocation && matchesPrice && matchesPayment;
    });
  }, [cropFilter, buyerTypeFilter, locationSearch, minPrice, paymentTermsFilter]);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (cropFilter !== 'All') filters.push({ label: `Crop: ${cropFilter}`, type: 'crop' });
    if (buyerTypeFilter !== 'All') filters.push({ label: `Type: ${buyerTypeFilter}`, type: 'type' });
    if (locationSearch !== '') filters.push({ label: `Location: ${locationSearch}`, type: 'location' });
    if (minPrice > 0) filters.push({ label: `Min Price: ₹${minPrice}`, type: 'price' });
    if (paymentTermsFilter !== 'All') filters.push({ label: `Payment: ${paymentTermsFilter}`, type: 'payment' });
    return filters;
  }, [cropFilter, buyerTypeFilter, locationSearch, minPrice, paymentTermsFilter]);

  const clearFilters = () => {
    setCropFilter('All');
    setBuyerTypeFilter('All');
    setLocationSearch('');
    setMinPrice(0);
    setPaymentTermsFilter('All');
  };

  const removeFilter = (type) => {
    switch (type) {
      case 'crop':
        setCropFilter('All');
        break;
      case 'type':
        setBuyerTypeFilter('All');
        break;
      case 'location':
        setLocationSearch('');
        break;
      case 'price':
        setMinPrice(0);
        break;
      case 'payment':
        setPaymentTermsFilter('All');
        break;
      default:
        break;
    }
  };

  return (
    <section id="buyers" className="buyer-marketplace">
      <div className="buyer-marketplace-header">
        <div className="buyer-marketplace-header-content">
          <ShieldCheck className="header-icon" size={36} />
          <h2>Verified Buyer Marketplace</h2>
          <p>Connect with pre-verified buyers offering competitive prices for your produce</p>
        </div>
      </div>

      <div className="buyer-marketplace-container">
        <div className="filter-bar">
          <div className="filter-bar-top">
            <div className="filter-icon-label">
              <SlidersHorizontal size={20} />
              <span>Filters</span>
            </div>
          </div>

          <div className="filter-bar-grid">
            <div className="filter-group">
              <label>Crop</label>
              <div className="select-wrapper">
                <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
                  {cropFilters.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-arrow" size={16} />
              </div>
            </div>

            <div className="filter-group">
              <label>Buyer Type</label>
              <div className="select-wrapper">
                <select value={buyerTypeFilter} onChange={(e) => setBuyerTypeFilter(e.target.value)}>
                  {buyerTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-arrow" size={16} />
              </div>
            </div>

            <div className="filter-group">
              <label>Location</label>
              <div className="search-input-wrapper">
                <MapPin size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Min Price (₹/Qtl)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={minPrice || ''}
                onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
                className="price-input"
              />
            </div>

            <div className="filter-group">
              <label>Payment Terms</label>
              <div className="select-wrapper">
                <select
                  value={paymentTermsFilter}
                  onChange={(e) => setPaymentTermsFilter(e.target.value)}
                >
                  {paymentTermsOptions.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-arrow" size={16} />
              </div>
            </div>

            <div className="filter-group filter-group-clear">
              <button className="clear-filters-btn" onClick={clearFilters}>
                <Filter size={16} />
                Clear Filters
              </button>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="active-filter-chips">
              {activeFilters.map((filter) => (
                <span key={filter.type} className="filter-chip">
                  {filter.label}
                  <button className="chip-remove" onClick={() => removeFilter(filter.type)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="results-count">
          Showing <strong>{filteredBuyers.length}</strong> of <strong>{buyers.length}</strong> buyers
        </div>

        {filteredBuyers.length > 0 ? (
          <div className="buyer-grid">
            {filteredBuyers.map((buyer, index) => (
              <div
                key={buyer.id}
                className="buyer-card-wrapper"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <BuyerCard buyer={buyer} />
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-illustration">
              <Search size={64} strokeWidth={1} />
            </div>
            <h3>No buyers found</h3>
            <p>Try adjusting your filters to see more results</p>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BuyerMarketplace;
