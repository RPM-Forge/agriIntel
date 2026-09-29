export const ORDER_STATUSES = ["pending", "accepted", "rejected", "cancelled", "fulfilled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SHIPMENT_STATUSES = [
  "planned",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "settled", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface ProduceLotRecord {
  id: string;
  sellerId: string;
  crop: string;
  grade: string;
  quantity: number;
  availableQuantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
  harvestDate?: string;
  status: "available" | "sold" | "closed";
  createdAt: string;
}

export interface BuyerRequirementRecord {
  id: string;
  buyerId: string;
  buyerName: string;
  crop: string;
  grade: string;
  quantity: number;
  unit: string;
  maxPricePerUnit?: number;
  location: string;
  neededBy?: string;
  notes: string;
  status: "open" | "fulfilled" | "closed";
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  crop: string;
  grade: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  deliveryLocation: string;
  status: OrderStatus;
  createdAt: string;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  crop: string;
  quantity: number;
  unit: string;
  deliveryLocation: string;
  transporter: string;
  trackingReference: string;
  estimatedArrival?: string;
  status: ShipmentStatus;
  history: Array<{ status: ShipmentStatus; at: string }>;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  crop: string;
  amount: number;
  status: PaymentStatus;
  method: "bank_transfer" | "upi" | "cash" | "other";
  reference?: string;
  settledAt?: string;
  createdAt: string;
}

export interface DashboardActivity {
  id: string;
  kind: "order" | "payment" | "shipment" | "listing";
  title: string;
  detail: string;
  status: string;
  at: string;
}

export interface DashboardSummary {
  produceListings: number;
  produceQuintals: number;
  earnings: number;
  activeSales: number;
  totalPaid: number;
  activeOrders: number;
  deliveriesPending: number;
  activity: DashboardActivity[];
}

export function formatRupees(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}
