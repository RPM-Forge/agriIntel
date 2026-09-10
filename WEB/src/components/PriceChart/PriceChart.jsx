import React, { useState, useMemo } from 'react';
import './PriceChart.css';

const PADDING = { top: 24, right: 24, bottom: 40, left: 56 };
const CHART_WIDTH = 700;
const CHART_HEIGHT = 300;

const PriceChart = ({ data, type = 'monthly' }) => {
  const [activePoint, setActivePoint] = useState(null);
  const [viewType, setViewType] = useState(type);

  const chartData = useMemo(() => {
    if (!data) return [];
    return viewType === 'monthly' ? data.priceHistory : data.weeklyHistory;
  }, [data, viewType]);

  const labels = useMemo(() => {
    return chartData.map((d) => d.month || d.day);
  }, [chartData]);

  const prices = useMemo(() => {
    return chartData.map((d) => d.price);
  }, [chartData]);

  const { yMin, yMax, yTicks } = useMemo(() => {
    if (prices.length === 0) return { yMin: 0, yMax: 100, yTicks: [] };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.15 || 50;
    const yMin = Math.floor((min - padding) / 50) * 50;
    const yMax = Math.ceil((max + padding) / 50) * 50;
    const tickCount = 5;
    const step = (yMax - yMin) / tickCount;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + i * step);
    return { yMin, yMax, yTicks };
  }, [prices]);

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((d, i) => {
      const x = PADDING.left + (i / (chartData.length - 1 || 1)) * innerWidth;
      const y = PADDING.top + innerHeight - ((d.price - yMin) / (yMax - yMin)) * innerHeight;
      return { x, y, price: d.price, label: d.month || d.day };
    });
  }, [chartData, innerWidth, innerHeight, yMin, yMax]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
  }, [points]);

  const smoothPath = useMemo(() => {
    if (points.length < 2) return linePath;
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpx1 = curr.x + (next.x - curr.x) * 0.4;
      const cpx2 = next.x - (next.x - curr.x) * 0.4;
      d += ` C ${cpx1.toFixed(2)} ${curr.y.toFixed(2)} ${cpx2.toFixed(2)} ${next.y.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    }
    return d;
  }, [points, linePath]);

  const areaPath = useMemo(() => {
    if (!smoothPath) return '';
    const bottomY = PADDING.top + innerHeight;
    return `${smoothPath} L ${points[points.length - 1].x.toFixed(2)} ${bottomY} L ${points[0].x.toFixed(2)} ${bottomY} Z`;
  }, [smoothPath, points, innerHeight]);

  const lineLength = useMemo(() => {
    if (points.length < 2) return 0;
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }, [points]);

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (!data || chartData.length === 0) {
    return (
      <div className="price-chart">
        <div className="price-chart__empty">No price data available</div>
      </div>
    );
  }

  return (
    <div className="price-chart">
      <div className="price-chart__header">
        <span className="price-chart__title">Price Trend</span>
        <div className="price-chart__toggles">
          <button
            className={`price-chart__toggle ${viewType === 'monthly' ? 'price-chart__toggle--active' : ''}`}
            onClick={() => setViewType('monthly')}
          >
            Monthly
          </button>
          <button
            className={`price-chart__toggle ${viewType === 'weekly' ? 'price-chart__toggle--active' : ''}`}
            onClick={() => setViewType('weekly')}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="price-chart__svg-container">
        <svg
          className="price-chart__svg"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22a44a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22a44a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, i) => {
            const y = PADDING.top + innerHeight - ((tick - yMin) / (yMax - yMin)) * innerHeight;
            return (
              <g key={i}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + innerWidth}
                  y2={y}
                  className="price-chart__grid-line"
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="price-chart__y-label"
                >
                  {(tick / 1000).toFixed(1)}k
                </text>
              </g>
            );
          })}

          <line
            x1={PADDING.left}
            y1={PADDING.top + innerHeight}
            x2={PADDING.left + innerWidth}
            y2={PADDING.top + innerHeight}
            className="price-chart__axis-line"
          />

          {points.map((p, i) => {
            const labelSpacing = points.length > 7 ? 2 : 1;
            if (i % labelSpacing !== 0 && i !== points.length - 1) return null;
            return (
              <text
                key={i}
                x={p.x}
                y={PADDING.top + innerHeight + 24}
                textAnchor="middle"
                className="price-chart__label"
              >
                {p.label}
              </text>
            );
          })}

          <path
            d={areaPath}
            fill="url(#chartGradient)"
            className="price-chart__area"
          />

          <path
            d={smoothPath}
            className="price-chart__line"
            style={{ '--line-length': lineLength }}
          />

          <g className="price-chart__points-group">
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={activePoint === i ? 6 : 4}
                className="price-chart__point"
                onMouseEnter={() => setActivePoint(i)}
                onMouseLeave={() => setActivePoint(null)}
              />
            ))}
          </g>

          {activePoint !== null && points[activePoint] && (
            <g className="price-chart__tooltip-group price-chart__tooltip-group--visible">
              <rect
                x={points[activePoint].x - 50}
                y={points[activePoint].y - 44}
                width={100}
                height={32}
                className="price-chart__tooltip-bg"
              />
              <text
                x={points[activePoint].x}
                y={points[activePoint].y - 31}
                textAnchor="middle"
                className="price-chart__tooltip-text"
              >
                {formatPrice(points[activePoint].price)}
              </text>
              <text
                x={points[activePoint].x}
                y={points[activePoint].y - 19}
                textAnchor="middle"
                className="price-chart__tooltip-label"
              >
                {points[activePoint].label}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default PriceChart;
