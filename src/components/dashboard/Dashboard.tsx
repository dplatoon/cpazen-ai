import { KPICards } from "./KPICards";
import { RevenueChart } from "./RevenueChart";
import { TopCampaigns } from "./TopCampaigns";
import { RecentActivity } from "./RecentActivity";

export const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground-muted mt-2">
          Welcome back! Here's what's happening with your campaigns today.
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Top Campaigns */}
      <TopCampaigns />
    </div>
  );
};