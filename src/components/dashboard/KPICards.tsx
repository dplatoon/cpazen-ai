import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, MousePointer, Target, BarChart3 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useRealData";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  format?: 'number' | 'currency' | 'percentage';
}

const KPICard = ({ title, value, change, icon: Icon, format = 'number' }: KPICardProps) => {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return Number(val).toLocaleString();
  };

  const isPositive = change >= 0;

  return (
    <Card className="p-6 bg-gradient-card hover:bg-gradient-hover transition-all duration-200 border-card-border">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground-muted">{title}</p>
          <p className="text-2xl font-bold text-foreground">{formatValue(value)}</p>
          <div className="flex items-center space-x-1">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                isPositive ? "text-success" : "text-destructive"
              )}
            >
              {isPositive ? '+' : ''}{change}%
            </span>
          </div>
        </div>
        <div className="h-12 w-12 rounded-lg bg-gradient-brand/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-brand-teal" />
        </div>
      </div>
    </Card>
  );
};

export const KPICards = () => {
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