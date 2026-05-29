export const CLIENTS = [
  {
    id: "c1",
    name: "Saffron Lounge",
    type: "Fine Dining",
    location: "Bandra West",
    city: "Mumbai",
    icon: "🪷",
    capacity: 64,
    lastPeriod: "March 2025",
    lastRevenue: 1842000,
    repeatRate: 58,
    rag: "amber" as const,
    monthsOfData: 6,
    sessions: 6,
  },
  {
    id: "c2",
    name: "Tandoor & Tonic",
    type: "Bar & Restaurant",
    location: "Indiranagar",
    city: "Bengaluru",
    icon: "🍸",
    capacity: 110,
    lastPeriod: "March 2025",
    lastRevenue: 2470000,
    repeatRate: 64,
    rag: "green" as const,
    monthsOfData: 12,
    sessions: 12,
  },
  {
    id: "c3",
    name: "Curry Leaf Cafe",
    type: "Casual",
    location: "Koramangala",
    city: "Bengaluru",
    icon: "🌿",
    capacity: 48,
    lastPeriod: "Feb 2025",
    lastRevenue: 612000,
    repeatRate: 41,
    rag: "red" as const,
    monthsOfData: 4,
    sessions: 4,
  },
  {
    id: "c4",
    name: "Dilli Junction",
    type: "QSR",
    location: "Connaught Place",
    city: "Delhi",
    icon: "🍛",
    capacity: 32,
    lastPeriod: "March 2025",
    lastRevenue: 388000,
    repeatRate: 52,
    rag: "amber" as const,
    monthsOfData: 8,
    sessions: 8,
  },
  {
    id: "c5",
    name: "Coastal Co.",
    type: "Cloud Kitchen",
    location: "Powai",
    city: "Mumbai",
    icon: "🐟",
    capacity: 0,
    lastPeriod: "March 2025",
    lastRevenue: 925000,
    repeatRate: 67,
    rag: "green" as const,
    monthsOfData: 9,
    sessions: 9,
  },
  {
    id: "c6",
    name: "Maharaja Dhaba",
    type: "Dhaba",
    location: "NH-44",
    city: "Karnal",
    icon: "🚛",
    capacity: 180,
    lastPeriod: "Feb 2025",
    lastRevenue: 1100000,
    repeatRate: 49,
    rag: "amber" as const,
    monthsOfData: 3,
    sessions: 3,
  },
];

export function getClient(id: string) {
  const found = CLIENTS.find((c) => c.id === id);
  if (found) return found;

  if (typeof window !== "undefined") {
    try {
      const localRestStr = localStorage.getItem("rasoi_local_restaurants");
      if (localRestStr) {
        const localList = JSON.parse(localRestStr);
        const localFound = localList.find((c: any) => c.id === id);
        if (localFound) {
          return {
            id: localFound.id,
            name: localFound.name,
            type: localFound.type || "Fine Dining",
            location: localFound.location || "Mumbai",
            city: localFound.city || "Mumbai",
            icon: localFound.icon || "🍽️",
            capacity: localFound.capacity || 50,
            lastPeriod: "Never",
            lastRevenue: 0,
            repeatRate: 0,
            rag: "green" as const,
            monthsOfData: 0,
            sessions: 0,
          };
        }
      }
    } catch (e) {
      console.warn("Failed to read local restaurants in getClient:", e);
    }
  }
  return CLIENTS[0];
}

export const REVENUE_BY_WEEK = [
  { week: "W1", current: 412000, previous: 380000 },
  { week: "W2", current: 468000, previous: 402000 },
  { week: "W3", current: 521000, previous: 445000 },
  { week: "W4", current: 441000, previous: 415000 },
];

export const TOP_ITEMS = [
  { name: "Butter Chicken", revenue: 184500, pct: 10.0, veg: false },
  { name: "Dal Makhani", revenue: 142800, pct: 7.8, veg: true },
  { name: "Paneer Tikka", revenue: 121000, pct: 6.6, veg: true },
  { name: "Garlic Naan", revenue: 98400, pct: 5.3, veg: true },
  { name: "Biryani (Mutton)", revenue: 92600, pct: 5.0, veg: false },
];

export const ORDERS_BY_HOUR = [
  { h: "11a", o: 4 },
  { h: "12p", o: 22 },
  { h: "1p", o: 38 },
  { h: "2p", o: 31 },
  { h: "3p", o: 9 },
  { h: "4p", o: 5 },
  { h: "5p", o: 8 },
  { h: "6p", o: 14 },
  { h: "7p", o: 41 },
  { h: "8p", o: 62 },
  { h: "9p", o: 58 },
  { h: "10p", o: 27 },
];

export const PAYMENT_MIX = [
  { name: "UPI", value: 48 },
  { name: "Card", value: 31 },
  { name: "Cash", value: 18 },
  { name: "Other", value: 3 },
];

export const KPIS = {
  totalRevenue: 1842000,
  revenueDelta: 12.4,
  totalOrders: 1247,
  ordersDelta: 8.1,
  avgBill: 1478,
  avgBillDelta: 3.9,
  totalCovers: 3120,
  perCover: 590,
  foodCostPct: 31.2,
  foodCostDelta: -1.4,
  repeatRate: 58,
  returningCount: 412,
};

export const RAG_SUMMARY = { green: 6, amber: 4, red: 2 };

export function inr(n: number) {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + "Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n.toLocaleString("en-IN");
}

export const INSIGHTS = [
  {
    tone: "green" as const,
    title: "Dinner is your engine",
    body: "8–10pm contributed 41% of revenue with a 19% MoM lift. Protect this band — staff levels and prep should not slip.",
  },
  {
    tone: "red" as const,
    title: "Lunch occupancy is bleeding",
    body: "Weekday lunch covers fell to 38% of capacity. Repeat lunch guests dropped 14 points. Test a 60-minute weekday set menu.",
  },
  {
    tone: "gold" as const,
    title: "Dessert attach is your fastest lever",
    body: "Only 18% of bills include a dessert (target ≥30%). A ₹149 mini-dessert offered post-main could add ~₹86K/month.",
  },
];