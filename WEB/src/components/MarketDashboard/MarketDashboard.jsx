import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Package,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
} from 'lucide-react';
import { cropData } from '../../data/marketData';
import PriceChart from '../PriceChart/PriceChart';
import './MarketDashboard.css';

const CROPS = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Onion'];
const LOCATIONS = ['Delhi NCR', 'Haryana', 'Uttar Pradesh', 'Maharashtra'];

const DEMAND_COLORS = {
  Low: 'demand-low',
  Medium: 'demand-medium',
  High: 'demand-high',
  'Very High': 'demand-critical',
};

const RECOMMENDATION_CLASSES = {
  Favorable: 'rec-favorable',
  Hold: 'rec-hold',
  'Sell Now': 'rec-sell',
};

const MarketDashboard = () => {
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [selectedMarket, setSelectedMarket] = useState('Delhi NCR');
  const [isUpdating, setIsUpdating] = useState(false);

  const crop = cropData[selectedCrop];
  const isTrendUp = crop.priceChange > 0;

  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 400);
    return () => clearTimeout(timer);
  }, [selectedCrop, selectedMarket]);

  const getMarketFactor = () => {
    const factor = { 'Delhi NCR': 1.0, Haryana: 1.04, 'Uttar Pradesh': 1.07, Maharashtra: 0.98 };
    return factor[selectedMarket] || 1.0;
  };

  const currentPrice = Math.round(crop.currentPrice * getMarketFactor());
  const highestPrice = Math.round(crop.highestPrice * getMarketFactor());
  const avgPrice = Math.round(crop.avgPrice * getMarketFactor());

  return (
    <section id="market-intelligence" className="market-dashboard">
      <div className="container">
        <div className="section-header market-dashboard__header">
          <div className="market-dashboard__header-icon">
            <BarChart3 size={28} />
          </div>
          <h2 className="section-title">Live Market Intelligence</h2>
          <p className="section-subtitle">
            Real-time prices, demand signals and recommendations across nearby markets
          </p>
        </div>

        <div className="market-dashboard__toolbar">
          <div className="market-dashboard__crops">
            <span className="market-dashboard__toolbar-label">
              <TrendingUp size={16} />
              Select Crop
            </span>
            <div className="market-dashboard__crop-chips">
              {CROPS.map((cropName) => (
                <button
                  key={cropName}
                  className={`market-dashboard__chip ${
                    selectedCrop === cropName ? 'market-dashboard__chip--active' : ''
                  }`}
                  onClick={() => setSelectedCrop(cropName)}
                >
                  <span className="market-dashboard__chip-emoji">{cropData[cropName].emoji}</span>
                  {cropName}
                </button>
              ))}
            </div>
          </div>

          <div className="market-dashboard__location">
            <label className="market-dashboard__location-label" htmlFor="market-location">
              <Target size={16} />
              Market
            </label>
            <select
              id="market-location"
              className="market-dashboard__select"
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className={`market-dashboard__grid ${isUpdating ? 'market-dashboard__grid--updating' : ''}`}
        >
          <div className="market-dashboard__card market-dashboard__card--primary">
            <span className="market-dashboard__card-icon">
              {isTrendUp ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            </span>
            <span className="market-dashboard__card-label">Current Price</span>
            <span className="market-dashboard__card-value">
              <span className="market-dashboard__rupee">₹</span>
              {currentPrice.toLocaleString('en-IN')}
            </span>
            <span className="market-dashboard__card-sub">per {crop.unit}</span>
          </div>

          <div className="market-dashboard__card">
            <span className="market-dashboard__card-icon">
              <TrendingUp size={20} />
            </span>
            <span className="market-dashboard__card-label">Highest Nearby Price</span>
            <span className="market-dashboard__card-value">
              <span className="market-dashboard__rupee">₹</span>
              {highestPrice.toLocaleString('en-IN')}
            </span>
            <span className="market-dashboard__card-sub">best offer in region</span>
          </div>

          <div className="market-dashboard__card">
            <span className="market-dashboard__card-icon">
              <BarChart3 size={20} />
            </span>
            <span className="market-dashboard__card-label">Average Market Price</span>
            <span className="market-dashboard__card-value">
              <span className="market-dashboard__rupee">₹</span>
              {avgPrice.toLocaleString('en-IN')}
            </span>
            <span className="market-dashboard__card-sub">across nearby mandis</span>
          </div>

          <div className="market-dashboard__card">
            <span className="market-dashboard__card-icon">
              <Package size={20} />
            </span>
            <span className="market-dashboard__card-label">Arrival Volume</span>
            <span className="market-dashboard__card-value">{crop.arrivalVolume}</span>
            <span className="market-dashboard__card-sub">today's market arrival</span>
          </div>

          <div className="market-dashboard__card">
            <span className="market-dashboard__card-icon">
              <Activity size={20} />
            </span>
            <span className="market-dashboard__card-label">Demand Level</span>
            <span className="market-dashboard__card-value">
              <span
                className={`market-dashboard__demand ${
                  DEMAND_COLORS[crop.demandLevel] || 'demand-medium'
                }`}
              />
              {crop.demandLevel}
            </span>
            <span className="market-dashboard__card-sub">buyer interest intensity</span>
          </div>

          <div className="market-dashboard__card">
            <span className="market-dashboard__card-icon">
              <ShoppingCart size={20} />
            </span>
            <span className="market-dashboard__card-label">Price Change</span>
            <span
              className={`market-dashboard__card-value ${
                isTrendUp ? 'market-dashboard__value--up' : 'market-dashboard__value--down'
              }`}
            >
              {isTrendUp ? '+' : ''}
              {crop.priceChange}%
            </span>
            <span className="market-dashboard__card-sub">vs last week</span>
          </div>
        </div>

        <div className="market-dashboard__bottom">
          <div className="market-dashboard__recommendation">
            <div className="market-dashboard__rec-header">
              <span className="market-dashboard__rec-icon">
                <Clock size={20} />
              </span>
              <span className="market-dashboard__rec-title">Best Time to Sell</span>
            </div>
            <div className="market-dashboard__rec-badge-row">
              <span
                className={`market-dashboard__rec-badge ${
                  RECOMMENDATION_CLASSES[crop.bestTimeToSell.recommendation] || 'rec-favorable'
                }`}
              >
                {crop.bestTimeToSell.recommendation}
              </span>
              <span className="market-dashboard__rec-window">
                Best window: <strong>{crop.bestTimeToSell.bestWindow}</strong>
              </span>
            </div>
            <p className="market-dashboard__rec-reason">{crop.bestTimeToSell.reason}</p>
          </div>
        </div>

        <div className="market-dashboard__chart">
          <PriceChart data={crop} type="monthly" />
        </div>
      </div>
    </section>
  );
};

export default MarketDashboard;