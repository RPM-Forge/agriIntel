import React, { useState } from 'react';
import { Truck, Warehouse, MapPin, Clock, Star, Package, Thermometer, ArrowRight, CheckCircle2, Navigation } from 'lucide-react';
import { logisticsData } from '../../data/mockData';
import './LogisticsSection.css';

const vehicleIcons = {
  'Truck': '🚛',
  'Mini Truck': '🛻',
  'Refrigerated Van': '🧊',
  'Trailer': '🚚',
};

const storageIcons = {
  'Cold Storage': '❄️',
  'Dry Warehouse': '🏢',
  'Silo': '🏗️',
};

const LogisticsSection = () => {
  const [activeTab, setActiveTab] = useState('transport');
  const [bookedTransport, setBookedTransport] = useState(null);
  const [reservedStorage, setReservedStorage] = useState(null);

  const transportData = logisticsData?.transport || [
    { id: 1, name: 'AgriTrans Express', vehicle: 'Truck', capacity: '10 MT', cost: 4500, distance: '120 km', rating: 4.8, eta: '3 hours' },
    { id: 2, name: 'QuickCargo Solutions', vehicle: 'Mini Truck', capacity: '5 MT', cost: 2800, distance: '80 km', rating: 4.5, eta: '2 hours' },
    { id: 3, name: 'FreshMove Logistics', vehicle: 'Refrigerated Van', capacity: '3 MT', cost: 5200, distance: '150 km', rating: 4.9, eta: '4 hours' },
  ];

  const storageData = logisticsData?.storage || [
    { id: 1, name: 'GreenVault Cold Store', type: 'Cold Storage', capacity: '50 MT', costPerDay: 350, distance: '15 km', available: true },
    { id: 2, name: 'AgriHub Warehouse', type: 'Dry Warehouse', capacity: '200 MT', costPerDay: 200, distance: '8 km', available: true },
    { id: 3, name: 'CentralGrain Silo', type: 'Silo', capacity: '500 MT', costPerDay: 150, distance: '25 km', available: false },
  ];

  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < full) stars.push(<Star key={i} size={14} fill="#ffc107" color="#ffc107" />);
      else if (i === full && hasHalf) stars.push(<Star key={i} size={14} fill="#ffc107" color="#ffc107" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
      else stars.push(<Star key={i} size={14} color="#ddd" />);
    }
    return stars;
  };

  return (
    <section className="logistics-section">
      <div className="logistics-header">
        <div className="section-badge"><Truck size={16} /> Supply Chain</div>
        <h2>Logistics & Storage</h2>
        <p>Seamlessly coordinate transport and storage for your lots</p>
      </div>

      {/* Route Visualization */}
      <div className="route-visualization">
        <div className="route-path">
          <div className="route-line">
            <div className="route-dot-animation" />
          </div>
          <div className="route-node">
            <div className="route-node-icon">
              <MapPin size={18} />
            </div>
            <span>Your Location</span>
          </div>
          <div className="route-node">
            <div className="route-node-icon">
              <Truck size={18} />
            </div>
            <span>Transport</span>
          </div>
          <div className="route-node">
            <div className="route-node-icon">
              <Package size={18} />
            </div>
            <span>Market</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="logistics-tabs">
        <button
          className={`tab-btn ${activeTab === 'transport' ? 'active' : ''}`}
          onClick={() => setActiveTab('transport')}
        >
          <Truck size={16} /> Transport
        </button>
        <button
          className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <Warehouse size={16} /> Storage
        </button>
      </div>

      {/* Transport Tab */}
      {activeTab === 'transport' && (
        <div className="logistics-grid">
          {transportData.map((t) => (
            <div key={t.id} className={`logistics-card ${bookedTransport === t.id ? 'booked' : ''}`}>
              <div className="card-header">
                <div className="card-title">{t.name}</div>
                <div className="vehicle-badge">
                  <span className="vehicle-emoji">{vehicleIcons[t.vehicle] || '🚛'}</span>
                  {t.vehicle}
                </div>
              </div>

              <div className="card-details">
                <div className="card-detail">
                  <Package size={14} />
                  <span>Capacity: <strong>{t.capacity}</strong></span>
                </div>
                <div className="card-detail">
                  <Navigation size={14} />
                  <span>Distance: <strong>{t.distance}</strong></span>
                </div>
                <div className="card-detail">
                  <Clock size={14} />
                  <span>ETA: <strong>{t.eta}</strong></span>
                </div>
                <div className="card-detail rating">
                  <span className="stars">{renderStars(t.rating)}</span>
                  <strong>{t.rating}</strong>
                </div>
              </div>

              <div className="card-footer">
                <div className="card-cost">
                  <span className="cost-label">Cost</span>
                  <span className="cost-value">₹{t.cost.toLocaleString('en-IN')}</span>
                </div>
                {bookedTransport === t.id ? (
                  <button className="btn-booked">
                    <CheckCircle2 size={16} /> Booked
                  </button>
                ) : (
                  <button className="btn-book" onClick={() => setBookedTransport(t.id)}>
                    Book Transport <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Storage Tab */}
      {activeTab === 'storage' && (
        <div className="logistics-grid">
          {storageData.map((s) => (
            <div key={s.id} className={`logistics-card storage-card ${reservedStorage === s.id ? 'reserved' : ''} ${!s.available ? 'unavailable' : ''}`}>
              <div className="card-header">
                <div className="card-title">{s.name}</div>
                <div className="storage-badge">
                  <span className="storage-emoji">{storageIcons[s.type] || '🏢'}</span>
                  {s.type}
                </div>
              </div>

              <div className="card-details">
                <div className="card-detail">
                  <Package size={14} />
                  <span>Capacity: <strong>{s.capacity}</strong></span>
                </div>
                <div className="card-detail">
                  <Navigation size={14} />
                  <span>Distance: <strong>{s.distance}</strong></span>
                </div>
                <div className="card-detail">
                  <Thermometer size={14} />
                  <span>Type: <strong>{s.type}</strong></span>
                </div>
                <div className="card-detail">
                  <span className={`availability-dot ${s.available ? 'available' : 'unavailable'}`} />
                  <span className={s.available ? 'status-available' : 'status-unavailable'}>
                    {s.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <div className="card-cost">
                  <span className="cost-label">Per Day</span>
                  <span className="cost-value">₹{s.costPerDay.toLocaleString('en-IN')}/day</span>
                </div>
                {reservedStorage === s.id ? (
                  <button className="btn-booked">
                    <CheckCircle2 size={16} /> Reserved
                  </button>
                ) : (
                  <button
                    className={`btn-book ${!s.available ? 'disabled' : ''}`}
                    disabled={!s.available}
                    onClick={() => s.available && setReservedStorage(s.id)}
                  >
                    {s.available ? 'Reserve' : 'Unavailable'} {!s.available && <span className="unavailable-x">✕</span>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default LogisticsSection;
