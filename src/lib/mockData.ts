export interface Campaign {
  id: string;
  name: string;
  offer: string;
  network: string;
  clicks: number;
  conversions: number;
  revenue: number;
  payout: number;
  conversionRate: number;
  epc: number;
  status: 'active' | 'paused' | 'stopped';
  createdAt: string;
}

export interface Offer {
  id: string;
  name: string;
  network: string;
  payout: number;
  currency: string;
  countries: string[];
  dailyCap: number;
  status: 'active' | 'paused' | 'stopped';
  category: string;
  description: string;
}

export interface DashboardStats {
  todayClicks: number;
  todayConversions: number;
  todayRevenue: number;
  avgPayout: number;
  conversionRate: number;
  epc: number;
}

export interface ChartData {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  todayClicks: 12543,
  todayConversions: 327,
  todayRevenue: 15675.50,
  avgPayout: 47.94,
  conversionRate: 2.61,
  epc: 1.25
};

// Mock Chart Data (Last 7 days)
export const mockChartData: ChartData[] = [
  { date: '2024-01-01', clicks: 8432, conversions: 198, revenue: 9876.50 },
  { date: '2024-01-02', clicks: 9876, conversions: 234, revenue: 11245.75 },
  { date: '2024-01-03', clicks: 11234, conversions: 289, revenue: 13567.25 },
  { date: '2024-01-04', clicks: 10987, conversions: 301, revenue: 14892.00 },
  { date: '2024-01-05', clicks: 12098, conversions: 278, revenue: 13456.50 },
  { date: '2024-01-06', clicks: 13456, conversions: 345, revenue: 16789.25 },
  { date: '2024-01-07', clicks: 12543, conversions: 327, revenue: 15675.50 },
];

// Mock Campaigns
export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Dating SOI - US Tier1',
    offer: 'LoveMatch Premium',
    network: 'MaxBounty',
    clicks: 2543,
    conversions: 67,
    revenue: 3216.50,
    payout: 48.00,
    conversionRate: 2.63,
    epc: 1.26,
    status: 'active',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Crypto Trading - Tier2',
    offer: 'CryptoMax Pro',
    network: 'ClickDealer',
    clicks: 1876,
    conversions: 23,
    revenue: 1564.75,
    payout: 68.03,
    conversionRate: 1.23,
    epc: 0.83,
    status: 'active',
    createdAt: '2024-01-02'
  },
  {
    id: '3',
    name: 'Health Supplements - Global',
    offer: 'VitaBoost Elite',
    network: 'Adsterra',
    clicks: 3421,
    conversions: 89,
    revenue: 4267.25,
    payout: 47.94,
    conversionRate: 2.60,
    epc: 1.25,
    status: 'active',
    createdAt: '2024-01-03'
  },
  {
    id: '4',
    name: 'Gaming CPI - Mobile',
    offer: 'Battle Legends',
    network: 'Custom',
    clicks: 5643,
    conversions: 154,
    revenue: 2156.50,
    payout: 14.00,
    conversionRate: 2.73,
    epc: 0.38,
    status: 'paused',
    createdAt: '2024-01-04'
  },
];

// Mock Offers
export const mockOffers: Offer[] = [
  {
    id: '1',
    name: 'LoveMatch Premium',
    network: 'MaxBounty',
    payout: 48.00,
    currency: 'USD',
    countries: ['US', 'CA', 'UK', 'AU'],
    dailyCap: 500,
    status: 'active',
    category: 'Dating',
    description: 'Premium dating platform targeting 25-45 age group'
  },
  {
    id: '2',
    name: 'CryptoMax Pro',
    network: 'ClickDealer',
    payout: 68.03,
    currency: 'USD',
    countries: ['US', 'UK', 'DE', 'FR', 'IT'],
    dailyCap: 200,
    status: 'active',
    category: 'Finance',
    description: 'Advanced cryptocurrency trading platform'
  },
  {
    id: '3',
    name: 'VitaBoost Elite',
    network: 'Adsterra',
    payout: 47.94,
    currency: 'USD',
    countries: ['US', 'CA', 'UK', 'AU', 'NZ'],
    dailyCap: 300,
    status: 'active',
    category: 'Health',
    description: 'Premium health supplements for active lifestyle'
  },
  {
    id: '4',
    name: 'Battle Legends',
    network: 'Custom',
    payout: 14.00,
    currency: 'USD',
    countries: ['US', 'CA', 'UK', 'AU', 'DE', 'FR'],
    dailyCap: 1000,
    status: 'active',
    category: 'Gaming',
    description: 'Epic mobile strategy game with RPG elements'
  },
];