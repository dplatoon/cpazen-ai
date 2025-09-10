import { KPICards } from "./KPICards";
import { RevenueChart } from "./RevenueChart";
import { TopCampaigns } from "./TopCampaigns";
import { RecentActivity } from "./RecentActivity";
import { EnhancedCampaignTable } from "./EnhancedCampaignTable";
import { InteractiveCharts } from "./InteractiveCharts";
import { AIOptimizer } from "../ai/AIOptimizer";
import { DashboardFiltersState } from "./DashboardFilters";

interface DashboardProps {
  filters?: DashboardFiltersState;
}

export const Dashboard = ({ filters }: DashboardProps) => {
  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <KPICards filters={filters} />

      {/* AI Optimizer Section */}
      <AIOptimizer />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart filters={filters} />
        </div>
        <div>
          <RecentActivity filters={filters} />
        </div>
      </div>

      {/* Enhanced Campaign Table */}
      <EnhancedCampaignTable />

      {/* Interactive Charts */}
      <InteractiveCharts />
    </div>
  );
};