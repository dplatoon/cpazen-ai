import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, MousePointer, Target, BarChart3 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useRealData";
import { cn } from "@/lib/utils";
import { DashboardFiltersState } from "./DashboardFilters";

interface KPICardsProps {
  filters?: DashboardFiltersState;
}

export const KPICards = ({ filters }: KPICardsProps) => {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-6 bg-gradient-card border-card-border animate-pulse">
            <div className="h-16 bg-card-hover/50 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <KPICard
        title="Today's Clicks"
        value={stats.todayClicks}
        change={12.5}
        icon={MousePointer}
        format="number"
      />
      <KPICard
        title="Conversions"
        value={stats.todayConversions}
        change={8.2}
        icon={Target}
        format="number"
      />
      <KPICard
        title="Revenue"
        value={stats.todayRevenue}
        change={15.3}
        icon={DollarSign}
        format="currency"
      />
      <KPICard
        title="Avg Payout"
        value={stats.avgPayout}
        change={-2.1}
        icon={BarChart3}
        format="currency"
      />
      <KPICard
        title="Conversion Rate"
        value={stats.conversionRate}
        change={5.7}
        icon={TrendingUp}
        format="percentage"
      />
      <KPICard
        title="EPC"
        value={stats.epc}
        change={3.2}
        icon={DollarSign}
        format="currency"
      />
    </div>
  );
};