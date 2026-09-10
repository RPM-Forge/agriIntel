import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Users,
  MapPin,
  BarChart3,
  Zap,
  ChevronRight,
  Wheat,
  Activity,
} from 'lucide-react'
import './Hero.css'

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const heroEl = document.getElementById('home')
    if (heroEl) observer.observe(heroEl)

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3)
    }, 2500)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      if (heroEl) observer.unobserve(heroEl)
    }
  }, [])

  const priceTrend = [35, 42, 38, 55, 48, 62, 58, 72, 68, 85, 78, 92]

  return (
    <section className={`hero ${isVisible ? 'hero--visible' : ''}`} id="home">
      <div className="hero__bg-shapes">
        <div className="hero__shape hero__shape--1" />
        <div className="hero__shape hero__shape--2" />
        <div className="hero__shape hero__shape--3" />
        <div className="hero__shape hero__shape--4" />
      </div>

      <div className="hero__particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="hero__particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="hero__container">
        <div className="hero__content">
          <div className="hero__badge">
            <Zap size={14} />
            <span>India's Premier Agricultural Marketplace</span>
          </div>

          <h1 className="hero__headline">
            Smarter Markets. Better Prices.{' '}
            <span className="hero__headline--accent">Stronger Farmers.</span>
          </h1>

          <p className="hero__subtext">
            Discover real-time mandi prices, connect with verified buyers, and
            manage your entire transaction digitally — from lot creation to
            payment.
          </p>

          <div className="hero__ctas">
            <a href="#market-intelligence" className="hero__cta hero__cta--primary">
              <BarChart3 size={18} />
              <span>Explore Market Prices</span>
              <ArrowRight size={16} />
            </a>
            <a href="#buyers" className="hero__cta hero__cta--outlined">
              <Users size={18} />
              <span>Find Buyers</span>
              <ChevronRight size={16} />
            </a>
          </div>

          <div className="hero__trust">
            <div className="hero__trust-item">
              <ShieldCheck size={16} />
              <span>
                <strong>2,500+</strong> Verified Farmers
              </span>
            </div>
            <div className="hero__trust-divider" />
            <div className="hero__trust-item">
              <Users size={16} />
              <span>
                <strong>180+</strong> Verified Buyers
              </span>
            </div>
            <div className="hero__trust-divider" />
            <div className="hero__trust-item">
              <TrendingUp size={16} />
              <span>
                <strong>₹45Cr+</strong> Traded
              </span>
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__dashboard">
            <div className="hero__price-card">
              <div className="hero__price-header">
                <div className="hero__price-icon">
                  <Wheat size={20} />
                </div>
                <div className="hero__price-info">
                  <span className="hero__price-commodity">Wheat</span>
                  <span className="hero__price-location">
                    <MapPin size={12} /> Ludhiana Mandi
                  </span>
                </div>
                <div className="hero__price-trend hero__price-trend--up">
                  <TrendingUp size={14} />
                  +3.2%
                </div>
              </div>
              <div className="hero__price-value">
                <span className="hero__price-currency">₹</span>
                <span className="hero__price-amount">2,280</span>
                <span className="hero__price-unit">/Qtl</span>
              </div>
              <div className="hero__sparkline">
                {priceTrend.map((height, i) => (
                  <div
                    key={i}
                    className={`hero__sparkline-bar ${
                      i === priceTrend.length - 1 ? 'hero__sparkline-bar--active' : ''
                    }`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="hero__price-footer">
                <Activity size={14} />
                <span>Updated 2 min ago</span>
              </div>
            </div>

            <div
              className={`hero__floating-badge hero__floating-badge--sell ${
                activeIndex === 0 ? 'hero__floating-badge--active' : ''
              }`}
            >
              <Zap size={14} />
              <span>Best Time to Sell</span>
            </div>

            <div
              className={`hero__floating-badge hero__floating-badge--match ${
                activeIndex === 1 ? 'hero__floating-badge--active' : ''
              }`}
            >
              <BarChart3 size={14} />
              <span>94% Match Found</span>
            </div>

            <div
              className={`hero__floating-badge hero__floating-badge--verified ${
                activeIndex === 2 ? 'hero__floating-badge--active' : ''
              }`}
            >
              <ShieldCheck size={14} />
              <span>Verified Buyer</span>
            </div>

            <div className="hero__floating-badge hero__floating-badge--ai">
              <Zap size={14} />
              <span>AI Recommended</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
