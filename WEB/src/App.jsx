import React from 'react'
import Navbar from './components/Navbar/Navbar'
import Hero from './components/Hero/Hero'
import MarketDashboard from './components/MarketDashboard/MarketDashboard'
import MarketComparison from './components/MarketComparison/MarketComparison'
import BuyerMarketplace from './components/BuyerMarketplace/BuyerMarketplace'
import MatchingSection from './components/MatchingSection/MatchingSection'
import HowItWorks from './components/HowItWorks/HowItWorks'
import LotCreator from './components/LotCreator/LotCreator'
import LogisticsSection from './components/LogisticsSection/LogisticsSection'
import TransactionTimeline from './components/TransactionTimeline/TransactionTimeline'
import ImpactSection from './components/ImpactSection/ImpactSection'
import TrustSection from './components/TrustSection/TrustSection'
import CTA from './components/CTA/CTA'
import Footer from './components/Footer/Footer'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <Hero />
      <MarketDashboard />
      <MarketComparison />
      <BuyerMarketplace />
      <MatchingSection />
      <HowItWorks />
      <LotCreator />
      <LogisticsSection />
      <TransactionTimeline />
      <ImpactSection />
      <TrustSection />
      <CTA />
      <Footer />
    </div>
  )
}

export default App
