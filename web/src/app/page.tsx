"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { getPricePrediction } from "@/lib/priceClient";
import { COMMODITIES, COMMODITIES_BY_STATE, GRADES, MARKET_LOCATIONS } from "@/lib/marketOptions";

/* ------------------------------------------------------------------ */
/* Icons                                                              */
/* ------------------------------------------------------------------ */

type IconName =
  | "leaf"
  | "menu"
  | "close"
  | "arrowRight"
  | "arrowUp"
  | "arrowDown"
  | "check"
  | "checkCircle"
  | "zap"
  | "banknote"
  | "scale"
  | "warehouse"
  | "layers"
  | "message"
  | "sparkle"
  | "badgeCheck"
  | "mapPin"
  | "clipboard"
  | "receipt"
  | "lock"
  | "shield"
  | "database"
  | "trendingUp"
  | "rupee"
  | "users"
  | "truck"
  | "sprout"
  | "star"
  | "mail"
  | "phone"
  | "grain";

const LINE_ICONS: Record<Exclude<IconName, "star">, ReactNode> = {
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  ),
  menu: (
    <>
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </>
  ),
  close: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  banknote: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01" />
      <path d="M18 12h.01" />
    </>
  ),
  scale: (
    <>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </>
  ),
  warehouse: (
    <>
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
      <path d="M6 18h12" />
      <path d="M6 14h12" />
      <path d="M6 10h12" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2 10 5-10 5L2 7l10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </>
  ),
  message: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M9 9h6" />
      <path d="M9 13h4" />
    </>
  ),
  sparkle: <path d="m12 3 1.9 5.7a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3Z" />,
  badgeCheck: (
    <>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  mapPin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </>
  ),
  receipt: (
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  shield: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </>
  ),
  trendingUp: (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  rupee: (
    <>
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 8" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  truck: (
    <>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </>
  ),
  sprout: (
    <>
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  grain: (
    <>
      <circle cx="12" cy="4" r="1.6" />
      <circle cx="8" cy="7" r="1.6" />
      <circle cx="16" cy="7" r="1.6" />
      <circle cx="5" cy="11" r="1.6" />
      <circle cx="12" cy="10" r="1.6" />
      <circle cx="19" cy="11" r="1.6" />
      <path d="M3 21c1.5-3 3-5 4.5-6.5" />
      <path d="M21 21c-1.5-3-3-5-4.5-6.5" />
      <path d="M12 21v-5" />
    </>
  ),
};


function Icon({
  name,
  size = 22,
  strokeWidth = 1.9,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  if (name === "star") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {LINE_ICONS[name as Exclude<IconName, "star">]}
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, ReactNode> = {
  x: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.25" cy="6.75" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.7V4.2c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.4V14h2.7v8h3.4z" />
    </svg>
  ),
  youtube: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" />
    </svg>
  ),
  linkedin: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M4.98 3.5A2 2 0 1 1 1 3.5a2 2 0 0 1 3.98 0zM1.5 8h3v13.5h-3zM8 8h2.9v1.9h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6v8H13.4v-7.1c0-1.7-.03-3.9-2.38-3.9s-2.75 1.86-2.75 3.79V21.5H8z" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/* Shared visuals                                                     */
/* ------------------------------------------------------------------ */

function FieldContours({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="fc-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f6139" stopOpacity="0.5" />
          <stop offset="1" stopColor="#1f6139" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="fc-dot" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#63c285" stopOpacity="0.5" />
          <stop offset="1" stopColor="#63c285" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M0 296 C 220 258 400 300 640 290 C 880 280 1100 316 1440 294 L1440 360 L0 360 Z" fill="url(#fc-a)" />
      <path d="M0 322 C 260 300 440 330 700 322 C 960 314 1200 342 1440 330 L1440 360 L0 360 Z" fill="#12432a" opacity="0.6" />
      <path d="M0 342 C 300 326 520 350 820 344 C 1120 338 1300 352 1440 348 L1440 360 L0 360 Z" fill="#0b2d1c" opacity="0.75" />
      <g fill="url(#fc-dot)">
        <circle cx="80" cy="268" r="2.4" />
        <circle cx="620" cy="262" r="2.4" />
        <circle cx="1360" cy="266" r="2.4" />
      </g>
    </svg>
  );
}

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const w = 120;
  const h = 44;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - 5 - ((p - min) / range) * (h - 16);
    return [x.toFixed(1), y.toFixed(1)] as const;
  });
  
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const stroke = up ? "var(--green-600)" : "var(--red-600)";
  const fill = up ? "rgba(51, 131, 75, 0.16)" : "rgba(194, 64, 31, 0.12)";
  const id = up ? "sp-u" : "sp-d";
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path id={id} d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="3" fill={stroke} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

interface OptionRow {
  icon: IconName;
  label: string;
  value: string;
}

const OPTION_ORANGE_ROWS: OptionRow[] = [
  { icon: "users", label: "Current Demand", value: "230 MT" },
  { icon: "banknote", label: "Quantity Required", value: "40–400 quintals" },
  { icon: "trendingUp", label: "Expected Price", value: "₹2,260–2,410/q" },
  { icon: "badgeCheck", label: "Buyer Interest", value: "High · 38 buyers" },
];

const OPTION_GREEN_ROWS: OptionRow[] = [
  { icon: "badgeCheck", label: "Verified FPOs", value: "340+ FPOs" },
  { icon: "banknote", label: "Expected Quantity", value: "Up to 25 MT / lot" },
  { icon: "layers", label: "Collective Selling", value: "Bulk pool auctions" },
  { icon: "shield", label: "Verification", value: "KYC + quality checked" },
];

const STATS: { num: string; label: string }[] = [
  { num: "₹2,400 Cr+", label: "Trade Value" },
  { num: "1.2L+", label: "Active Farmers" },
  { num: "8,400+", label: "Verified Buyers" },
  { num: "340+", label: "Markets Covered" },
];

const MARKET_CARD_QUERIES = [
  { crop: "Rice", state: "Uttar Pradesh", district: "Agra" },
  { crop: "Wheat", state: "Madhya Pradesh", district: "Agar Malwa" },
  { crop: "Onion", state: "Maharashtra", district: "Ahilyanagar" },
] as const;

const DEFAULT_MARKET_CARDS: {
  crop: string;
  price: string | null;
  change: string | null;
  up: boolean;
  points: number[];
  status: string;
  warn?: boolean;
  insight: string;
}[] = [
  { crop: "Rice", price: null, change: null, up: true, points: [10, 14, 12, 17, 15, 20, 24], status: "Loading live rate", insight: "Fetching model data…" },
  { crop: "Wheat", price: null, change: null, up: true, points: [24, 21, 22, 19, 20, 18, 17], status: "Loading live rate", insight: "Fetching model data…" },
  { crop: "Onion", price: null, change: null, up: true, points: [8, 12, 10, 15, 19, 22, 30], status: "Loading live rate", insight: "Fetching model data…" },
];

const FEATURES: { icon: IconName; title: string; text: string; orange?: boolean }[] = [
  { icon: "zap", title: "Live Price Discovery", text: "Real-time mandi rates for your crop and district, updated through the day." },
  { icon: "users", title: "Verified Buyer Matching", text: "Connect with KYC-verified buyers who are genuinely ready to purchase." },
  { icon: "truck", title: "Logistics Coordination", text: "Pickup, transport and delivery handled with schedule you can track." },
  { icon: "banknote", title: "Secure Payments", text: "Direct bank settlements with clear payment timelines and records.", orange: true },
  { icon: "scale", title: "Quality Grading", text: "Standard lot grading so your produce is valued on its true quality.", orange: true },
  { icon: "warehouse", title: "Warehouse & Cold Storage", text: "Store your harvest safely while you wait for the right price." },
  { icon: "layers", title: "Multi-channel Selling", text: "Sell in mandis, to FPOs, or directly to buyers — all from one place." },
  { icon: "message", title: "Dispute Resolution", text: "Fair and fast resolution process when things go wrong.", orange: true },
];

const FARMGATE_STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "layers", title: "Collection Hub", text: "Produce gathered and registered at a certified collection hub." },
  { icon: "database", title: "Live-Level Lot Analysis", text: "Each lot graded, weighed and tagged against live mandi benchmarks." },
  { icon: "truck", title: "Combined Truckload", text: "Similar lots pooled into full, cost-efficient truckloads." },
  { icon: "receipt", title: "Automated E-Score Slip", text: "Every sale closes with an automated quality and price slip." },
];

const HOW_STEPS: { num: string; title: string; text: string }[] = [
  { num: "01", title: "Register & Verify", text: "Create your profile and finish quick KYC with your land and produce details." },
  { num: "02", title: "List Your Produce", text: "Choose crop, grade, quantity and district to list what you want to sell." },
  { num: "03", title: "Sell & Get Paid", text: "Connect with the best buyer, agree on rates, and get paid to your account." },
];

const TESTIMONIALS: { initials: string; name: string; loc: string; crop: string; quote: string }[] = [
  {
    initials: "RY",
    name: "Ramesh Yadav",
    loc: "Karnal · Haryana",
    crop: "Wheat",
    quote: "I compared rates across three mandis and sold 80 quintals at ₹180 more per quintal than last year. Full payment landed in two days.",
  },
  {
    initials: "SD",
    name: "Sunita Devi",
    loc: "Jaipur · Rajasthan",
    crop: "Onion",
    quote: "Listing my onion stock took five minutes. I received eight buyer offers and picked the best price myself.",
  },
  {
    initials: "BS",
    name: "Bhagwan Singh",
    loc: "Meerut · Uttar Pradesh",
    crop: "Potato",
    quote: "Through the FPO network I pooled my potato lot with neighbours and sold as one truckload at a much better rate.",
  },
];

const FOOTER_COLS: { title: string; links: string[] }[] = [
  { title: "Platform", links: ["Live Prices", "Sell Your Produce", "Buyer Network", "FPO Network", "Mandi Analytics"] },
  { title: "Company", links: ["About Us", "Careers", "Press", "Impact Stories", "Contact"] },
  { title: "Support", links: ["Help Centre", "FAQs", "Farmer Helpline", "Payment Help", "Report an Issue"] },
];

/* ------------------------------------------------------------------ */
/* Rate tool logic                                                    */
/* ------------------------------------------------------------------ */

interface RateResult {
  ok: boolean;
  title: string;
  lines: string[];
  raw?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatAmount(value: unknown): string | null {
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(n) && value.trim() !== "") return n.toLocaleString("en-IN");
  }
  return null;
}

function parsePrediction(
  res: { data?: unknown },
  form: { state: string; district: string; commodity: string; grade: string },
): RateResult {
  const title = `${form.commodity} · ${form.district}, ${form.state} · ${form.grade}`;
  const raw = res.data;

  if (raw == null) {
    return {
      ok: true,
      title: `No prediction returned for ${title}`,
      lines: ["The service responded without data. Try again or contact support if this keeps happening."],
    };
  }

  if (typeof raw === "string") {
    return { ok: true, title: `Price insight for ${title}`, lines: [raw] };
  }

  if (!isRecord(raw)) {
    return { ok: true, title: `Price insight for ${title}`, lines: [String(raw)] };
  }

  if (typeof raw.error === "string" && raw.error.trim()) {
    return { ok: false, title: `Couldn't fetch rates for ${title}`, lines: [raw.error.trim()] };
  }
  if (typeof raw.detail === "string" && raw.detail.trim()) {
    return { ok: false, title: `Couldn't fetch rates for ${title}`, lines: [raw.detail.trim()] };
  }

  const expected =
    formatAmount(raw.local_predicted_price) ??
    formatAmount(raw.predicted_price) ??
    formatAmount(raw.predictedPrice) ??
    formatAmount(raw.expected_price);
  const today = formatAmount(raw.today_actual_price);
  const advice = typeof raw.recommendation === "string" ? raw.recommendation.trim() : "";

  const lines: string[] = [];
  if (expected) lines.push(`Expected price: ₹${expected} per quintal.`);
  if (today) lines.push(`Today's mandi rate: ₹${today} per quintal.`);
  if (advice) lines.push(advice);

  if (lines.length === 0) {
    return {
      ok: false,
      title: `No expected price for ${title}`,
      lines: ["The model responded, but no price field was found."],
    };
  }

  return { ok: true, title: `Price insight for ${title}`, lines };
}

/* ------------------------------------------------------------------ */
/* Sections                                                           */
/* ------------------------------------------------------------------ */

function Header() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  return (
    <header className="site-header">
      <div className="container">
        <nav className="nav" aria-label="Primary">
          <a className="brand" href="#top">
            <span className="brand__mark">
              <Icon name="leaf" />
            </span>
            <span className="brand__name">
              <strong>Agri Intel</strong>
              <span>Digital Mandi Platform</span>
            </span>
          </a>

          <div className="nav__actions">
            <div className="nav__lang" role="group" aria-label="Language">
              <button
                type="button"
                className={`nav__lang-btn${lang === "hi" ? " is-active" : ""}`}
                onClick={() => setLang("hi")}
              >
                हिंदी
              </button>
              <button
                type="button"
                className={`nav__lang-btn${lang === "en" ? " is-active" : ""}`}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>
            <a className="nav__login" href="/auth?mode=login">
              Login
            </a>
            <a className="btn btn--lime btn--sm" href="/auth?mode=signup">
              Register
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const [form, setForm] = useState({ state: "", district: "", commodity: "", grade: "" });
  const states = MARKET_LOCATIONS;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RateResult | null>(null);
  const [errorText, setErrorText] = useState("");

  const setField =
    (key: "state" | "district" | "commodity" | "grade") => (value: string) => {
      setForm((f) => {
        const next = { ...f, [key]: value };
        if (key === "state") {
          next.district = "";
          next.commodity = "";
        }
        return next;
      });
      setErrorText("");
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!form.state) missing.push("State");
    if (!form.district) missing.push("District");
    if (!form.commodity) missing.push("Commodity");
    if (!form.grade) missing.push("Grade");

    if (missing.length > 0) {
      setErrorText(`Please select ${missing.join(", ")} to check rates & demand.`);
      setResult(null);
      return;
    }

    setErrorText("");
    setLoading(true);
    setResult(null);
    try {
      const res = await getPricePrediction(form);
      setResult(parsePrediction(res, form));
    } catch (err) {
      setResult({
        ok: false,
        title: "Couldn't fetch rates right now",
        lines: [err instanceof Error ? err.message : "Something went wrong. Please try again in a moment."],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero" id="top">
      <div className="hero__sun" aria-hidden="true" />
      <div className="hero__photo" aria-hidden="true" />
      <div className="hero__field">
        <FieldContours />
      </div>

      <div className="container">
        <div className="hero__inner">
          <div className="hero__copy">
            <p className="hero__eyebrow">
              <Icon name="zap" />
              India&apos;s transparent digital mandi
            </p>

            <h1 className="hero__title">
              Real-Time Mandi Rates.
              <br />
              <span className="accent">Direct Buyer Demands.</span>
              <br />
              Sell Individually or in Bulk.
            </h1>

            <p className="hero__sub">
              Empowering farmers with transparent market insights, better price discovery, and direct buyer
              connections.
            </p>
          </div>

          <form className="tool" onSubmit={handleSubmit} noValidate>
            <div className="tool__grid">
              <div className="field">
                <label className="field__label" htmlFor="state-select">
                  Select State
                </label>
                <select
                  id="state-select"
                  className="field__select has-icon"
                  value={form.state}
                  onChange={(e) => setField("state")(e.target.value)}
                  aria-invalid={!form.state && errorText !== ""}
                >
                  <option value="">Select State</option>
                  {Object.keys(states).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="district-select">
                  Select District
                </label>
                <select
                  id="district-select"
                  className="field__select has-icon"
                  value={form.district}
                  onChange={(e) => setField("district")(e.target.value)}
                  disabled={!form.state}
                  aria-invalid={!form.district && errorText !== ""}
                >
                  <option value="">
                    {form.state ? "Select District" : "Select State first"}
                  </option>
                  {form.state &&
                    (states[form.state] ?? []).map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="commodity-select">
                  Select Commodity
                </label>
                <select
                  id="commodity-select"
                  className="field__select has-icon"
                  value={form.commodity}
                  onChange={(e) => setField("commodity")(e.target.value)}
                  aria-invalid={!form.commodity && errorText !== ""}
                >
                  <option value="">Select Commodity</option>
                  {(form.state ? (COMMODITIES_BY_STATE[form.state] ?? COMMODITIES) : COMMODITIES).map(
                    (commodity) => (
                      <option key={commodity} value={commodity}>
                        {commodity}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="grade-select">
                  Select Grade
                </label>
                <select
                  id="grade-select"
                  className="field__select"
                  value={form.grade}
                  onChange={(e) => setField("grade")(e.target.value)}
                  aria-invalid={!form.grade && errorText !== ""}
                >
                  <option value="">Select Grade</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn--orange tool__btn" disabled={loading}>
                {loading ? "Checking…" : "Check Rates & Demand"}
              </button>
            </div>

            <p className={`tool__error${errorText ? " is-visible" : ""}`} role="alert">
              {errorText}
            </p>

            {result && (
              <div className={`tool__result is-visible ${result.ok ? "tool__result--ok" : "tool__result--err"}`}>
                <strong>{result.title}</strong>
                {result.lines.map((line, i) => (
                  <p key={i} style={{ marginTop: i === 0 ? 0 : 6 }}>
                    {line}
                  </p>
                ))}
                {result.raw && <pre>{result.raw}</pre>}
              </div>
            )}

            <div className="tool__meta">
              <span>
                <Icon name="checkCircle" />
                Data updated regularly
              </span>
              <span>
                <Icon name="shield" />
                Transparent market information
              </span>
              <span>
                <Icon name="users" />
                Trusted buyers
              </span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  kicker,
  icon,
  title,
  sub,
  center,
}: {
  kicker: string;
  icon: IconName;
  title: ReactNode;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={`section__head${center ? " section__head--center" : ""}`}>
      <span className="section__kicker">
        <Icon name={icon} />
        {kicker}
      </span>
      <h2 className="section__title">{title}</h2>
      {sub && <p className="section__sub">{sub}</p>}
    </div>
  );
}

function SellingOptions() {
  return (
    <section className="section section--white" id="selling">
      <div className="container">
        <SectionHead
          kicker="Selling Options"
          icon="layers"
          title={
            <>
              Two Ways to Sell: <span className="accent">Your Choice.</span>
            </>
          }
          sub="Sell directly to buyers ready to buy today, or sell collectively through a verified FPO network for better aggregation and rates."
        />

        <div className="options__grid">
          <article className="option-card option-card--orange">
            <span className="option-card__tag">Live Demand</span>
            <h3 className="option-card__title">Instant Demand Pool</h3>
            <p className="option-card__desc">
              Sell directly to active buyers ready to purchase at current mandi rates — in small lots or large
              volumes.
            </p>
            <div className="option-card__rows">
              {OPTION_ORANGE_ROWS.map((row) => (
                <div className="option-row" key={row.label}>
                  <span className="option-row__label">
                    <Icon name={row.icon} />
                    {row.label}
                  </span>
                  <span className="option-row__value">{row.value}</span>
                </div>
              ))}
            </div>
            <a className="btn btn--orange option-card__cta" href="#live-prices">
              View Demand
              <Icon name="arrowRight" size={18} />
            </a>
          </article>

          <article className="option-card option-card--green">
            <span className="option-card__tag">Verified Network</span>
            <h3 className="option-card__title">Registered FPO Network</h3>
            <p className="option-card__desc">
              Pool your produce with verified FPOs and farmer groups for collective, aggregated selling with
              better price discovery.
            </p>
            <div className="option-card__rows">
              {OPTION_GREEN_ROWS.map((row) => (
                <div className="option-row" key={row.label}>
                  <span className="option-row__label">
                    <Icon name={row.icon} />
                    {row.label}
                  </span>
                  <span className="option-row__value">{row.value}</span>
                </div>
              ))}
            </div>
            <a className="btn btn--cream option-card__cta" href="#how-it-works">
              Join Network
              <Icon name="arrowRight" size={18} />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="stats" aria-label="Market statistics">
      <div className="container">
        <div className="stats__grid">
          {STATS.map((stat) => (
            <div className="stat" key={stat.label}>
              <div className="stat__num">{stat.num}</div>
              <div className="stat__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketIntelligence() {
  const [cards, setCards] = useState(DEFAULT_MARKET_CARDS);

  useEffect(() => {
    let active = true;
    Promise.all(
      MARKET_CARD_QUERIES.map(async (query, index) => {
        try {
          const response = await getPricePrediction({
            commodity: query.crop,
            state: query.state,
            district: query.district,
            grade: "FAQ",
          });
          const data = isRecord(response.data) ? response.data : {};
          const price = formatAmount(data.today_actual_price);
          return {
            index,
            price,
            status: price ? "Live model rate" : "Rate unavailable",
            insight: price ? `${query.district} · ${query.state}` : "Try again shortly",
            warn: !price,
          };
        } catch {
          return { index, price: null, status: "Rate unavailable", insight: "Try again shortly", warn: true };
        }
      }),
    ).then((updates) => {
      if (!active) return;
      setCards((current) =>
        current.map((card, index) => {
          const update = updates.find((item) => item.index === index);
          return update ? { ...card, ...update } : card;
        }),
      );
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="section" id="live-prices">
      <div className="container">
        <SectionHead
          kicker="Live Mandi Rates"
          icon="trendingUp"
          title={
            <>
              Market Intelligence,
              <br />
              built for <span className="accent">timing your sale right.</span>
            </>
          }
          sub="Daily mandi rates and demand signals across major markets, so you know when to hold and when to sell."
        />

        <div className="market__grid">
          {cards.map((card) => (
            <article className="market-card" key={card.crop}>
              <div className="market-card__top">
                <span className="market-card__name">
                  <span className="market-card__crop">
                    <Icon name="grain" />
                  </span>
                  {card.crop}
                </span>
                {card.change && (
                  <span className={`change ${card.up ? "change--up" : "change--down"}`}>
                    <Icon name={card.up ? "arrowUp" : "arrowDown"} size={14} />
                    {card.change}
                  </span>
                )}
              </div>
              <div className="market-card__price">
                {card.price ? `₹${card.price}` : "—"}
                <small> / quintal</small>
              </div>
              <div className="market-card__chart">
                <Sparkline points={card.points} up={card.up} />
              </div>
              <div className="market-card__footer">
                <span className={`status${card.warn ? " status--warn" : ""}`}>{card.status}</span>
                <span className="market-card__insight">{card.insight}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="section section--white" id="about">
      <div className="container">
        <SectionHead
          kicker="One Platform"
          icon="sparkle"
          title={
            <>
              Everything a farmer needs,
              <br />
              in <span className="accent">one platform.</span>
            </>
          }
          sub="From price discovery to payments, Agri Intel brings the whole farm-to-market journey into one place."
        />

        <div className="features__grid">
          {FEATURES.map((feature) => (
            <article className="feature" key={feature.title}>
              <div className={`feature__icon${feature.orange ? " feature__icon--orange" : ""}`}>
                <Icon name={feature.icon} />
              </div>
              <h3 className="feature__title">{feature.title}</h3>
              <p className="feature__text">{feature.text}</p>
            </article>
          ))}
        </div>

        <div className="agmark">
          <div className="agmark__icon">
            <Icon name="database" />
          </div>
          <div>
            <h3 className="agmark__title">Agmarknet + Standard Lot Analysis &amp; Reliability Score</h3>
            <p className="agmark__text">
              Market and lot data sourced from Agmarknet helps you compare prevailing rates across mandis and
              districts, while the Reliability Score rates buyers on historical pay-out behaviour — so you can
              weigh price against trust before committing a sale.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FarmGate() {
  return (
    <section className="section farmgate" id="logistics">
      <div className="container">
        <SectionHead
          kicker="Transparency"
          icon="shield"
          title={
            <>
              Farm-Gate to Buyer,
              <br />
              every step transparent.
            </>
          }
          sub="A simple four-step chain keeps your produce quality-checked, aggregated and accounted for end to end."
        />

        <div className="farmgate__steps">
          {FARMGATE_STEPS.map((step) => (
            <div className="fstep" key={step.title}>
              <div className="fstep__num">
                <Icon name={step.icon} />
              </div>
              <h3 className="fstep__title">{step.title}</h3>
              <p className="fstep__text">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="onchain">
          <div className="onchain__icon">
            <Icon name="lock" />
          </div>
          <div>
            <h3 className="onchain__title">Every transaction on-chain. Every rupee accounted for.</h3>
            <p className="onchain__text">
              Payments, lots and grades are tracked across the chain so every rupee of value stays visible to
              farmer and buyer alike.
            </p>
          </div>
          <p className="onchain__note">
            UI representation only — on-chain settlement is a roadmap feature and is not wired to a live
            blockchain backend in this build.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <SectionHead
          kicker="How It Works"
          icon="mapPin"
          title="Start selling smarter in 3 steps"
          center
        />

        <div className="how__steps">
          {HOW_STEPS.map((step) => (
            <article className="how-step" key={step.num}>
              <div className="how-step__num">{step.num}</div>
              <h3 className="how-step__title">{step.title}</h3>
              <p className="how-step__text">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="section section--white">
      <div className="container">
        <SectionHead
          kicker="Farmer Stories"
          icon="users"
          title="Farmers earning more, every season"
          sub="Sample stories illustrating how farmers use Agri Intel to find better prices and buyers."
        />

        <div className="testi__grid">
          {TESTIMONIALS.map((t) => (
            <article className="testi-card" key={t.name}>
              <div className="testi-card__quote">
                <Icon name="star" size={24} />
                <p>{t.quote}</p>
              </div>
              <div className="testi-card__person">
                <span className="testi-card__avatar" aria-hidden="true">
                  {t.initials}
                </span>
                <div>
                  <div className="testi-card__name">{t.name}</div>
                  <div className="testi-card__loc">
                    {t.loc} · {t.crop} grower
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="cta">
      <div className="cta__field">
        <FieldContours />
      </div>
      <div className="container">
        <h2 className="cta__title">
          Ready to get a <span className="accent">fair price</span> for
          <br />
          your harvest?
        </h2>
        <p className="cta__sub">Find the right market, connect with buyers, and sell with confidence.</p>
        <div className="cta__actions">
          <a className="btn btn--orange btn--lg" href="#selling">
            Start Selling — It&apos;s Easy &amp; Transparent
          </a>
        </div>
        <p className="cta__note">
          <Icon name="shield" />
          No registration fee
          <span>·</span> Transparent rates
          <span>·</span> Direct payment to bank
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a className="brand" href="#top">
              <span className="brand__mark">
                <Icon name="leaf" />
              </span>
              <span className="brand__name">
                <strong>Agri Intel</strong>
                <span>Digital Mandi Platform</span>
              </span>
            </a>
            <p>
              A transparent digital mandi helping Indian farmers discover live prices, connect with verified
              buyers and sell smarter — individually or in bulk.
            </p>
            <div className="footer__social">
              <a href="#top" aria-label="Agri Intel on X (Twitter)">
                {SOCIAL_ICONS.x}
              </a>
              <a href="#top" aria-label="Agri Intel on Instagram">
                {SOCIAL_ICONS.instagram}
              </a>
              <a href="#top" aria-label="Agri Intel on Facebook">
                {SOCIAL_ICONS.facebook}
              </a>
              <a href="#top" aria-label="Agri Intel on YouTube">
                {SOCIAL_ICONS.youtube}
              </a>
              <a href="#top" aria-label="Agri Intel on LinkedIn">
                {SOCIAL_ICONS.linkedin}
              </a>
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <nav className="footer__col" key={col.title} aria-label={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#top">{link}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer__bottom">
          <span>© 2026 Agri Intel Technologies Pvt. Ltd. All rights reserved.</span>
          <span className="footer__trust">
            <Icon name="checkCircle" />
            Agmarknet enabled · Built for Indian farmers
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Hero />
        <SellingOptions />
        <Stats />
        <MarketIntelligence />
        <Features />
        <FarmGate />
        <HowItWorks />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
