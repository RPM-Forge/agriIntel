import React, { useState, useMemo } from 'react'
import { MapPin, TrendingUp, Package, ShoppingCart, Truck, ArrowUpDown, Star, Filter, ChevronDown, Check } from 'lucide-react'
import { markets } from '../../data/marketData'
import './MarketComparison.css'

const demandLevels = {
  Low: { color: '#6b7280', bg: '#f3f4f6' },
  Medium: { color: '#f59e0b', bg: '#fef3c7' },
  High: { color: '#ef4444', bg: '#fee2e2' },
  'Very High': { color: '#dc2626', bg: '#fef2f2' },
}

const sortOptions = [
  { value: 'price', label: 'Price' },
  { value: 'distance', label: 'Distance' },
  { value: 'realized', label: 'Realized Price' },
  { value: 'demand', label: 'Demand' },
]

const demandOrder = { Low: 1, Medium: 2, High: 3, 'Very High': 4 }

export default function MarketComparison() {
  const [sortBy, setSortBy] = useState('realized')
  const [animKey, setAnimKey] = useState(0)

  const sortedMarkets = useMemo(() => {
    const sorted = [...markets].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.currentPrice - a.currentPrice
        case 'distance':
          return a.distance - b.distance
        case 'realized':
          return b.realizedPrice - a.realizedPrice
        case 'demand':
          return (demandOrder[b.demand] || 0) - (demandOrder[a.demand] || 0)
        default:
          return 0
      }
    })
    return sorted
  }, [sortBy])

  const handleSortChange = (value) => {
    setSortBy(value)
    setAnimKey((k) => k + 1)
  }

  if (!sortedMarkets.length) {
    return (
      <section className="market-comparison">
        <div className="mc-header">
          <h2 className="mc-title">Compare Nearby Markets</h2>
          <p className="mc-subtitle">
            Find the best market for your produce based on real-time prices, demand and logistics
          </p>
        </div>
        <div className="mc-empty">
          <Package size={48} />
          <p>No markets found matching your criteria.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="market-comparison">
      <div className="mc-header">
        <h2 className="mc-title">Compare Nearby Markets</h2>
        <p className="mc-subtitle">
          Find the best market for your produce based on real-time prices, demand and logistics
        </p>
      </div>

      <div className="mc-controls">
        <div className="mc-sort">
          <ArrowUpDown size={16} />
          <label>Sort by</label>
          <div className="mc-sort-select">
            <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="mc-select-icon" />
          </div>
        </div>
        <div className="mc-results-count">
          <Filter size={14} />
          <span>{sortedMarkets.length} market{sortedMarkets.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="mc-grid" key={animKey}>
        {sortedMarkets.map((market, idx) => {
          const demandStyle = demandLevels[market.demand] || demandLevels.Low
          return (
            <div
              key={market.id}
              className={`mc-card ${market.isRecommended ? 'mc-card--recommended' : ''}`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {market.isRecommended && (
                <div className="mc-badge-best">
                  <Star size={12} />
                  Best Opportunity
                </div>
              )}

              <div className="mc-card-header">
                <h3 className="mc-market-name">{market.name}</h3>
                <span className="mc-location-badge">
                  <MapPin size={12} />
                  {market.location}
                </span>
              </div>

              <div className="mc-price-row">
                <div className="mc-price">
                  <span className="mc-price-label">Current Price</span>
                  <span className="mc-price-value">
                    <TrendingUp size={18} />
                    ₹{market.currentPrice.toLocaleString()}/quintal
                  </span>
                </div>
                <div className="mc-distance">
                  <MapPin size={14} />
                  <span>{market.distance} km</span>
                </div>
              </div>

              <div className="mc-details">
                <div className="mc-detail-item">
                  <Package size={14} />
                  <span className="mc-detail-label">Arrival</span>
                  <span className="mc-detail-value">{market.arrivalVolume.toLocaleString()} Q</span>
                </div>
                <div className="mc-detail-item">
                  <ShoppingCart size={14} />
                  <span className="mc-detail-label">Demand</span>
                  <span
                    className="mc-demand-dot"
                    style={{ backgroundColor: demandStyle.color }}
                  />
                  <span
                    className="mc-demand-text"
                    style={{ color: demandStyle.color, backgroundColor: demandStyle.bg }}
                  >
                    {market.demand}
                  </span>
                </div>
                <div className="mc-detail-item">
                  <Truck size={14} />
                  <span className="mc-detail-label">Transport</span>
                  <span className="mc-detail-value mc-transport-cost">
                    -₹{market.transportCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mc-realization">
                <span className="mc-realization-label">
                  <Check size={14} />
                  Estimated Farmer Realization
                </span>
                <span className="mc-realization-value">
                  ₹{market.realizedPrice.toLocaleString()}/quintal
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
