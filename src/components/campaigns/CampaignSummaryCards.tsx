import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MousePointer, Target, DollarSign, TrendingUp, Percent, Calculator } from "lucide-react";
import { CampaignKpis } from "@/hooks/useCampaignAnalytics";
import { cn } from "@/lib/utils";

interface CampaignSummaryCardsProps {
  kpis: CampaignKpis | undefined;
  isLoading: boolean;
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

function KpiCard({ title, value, icon: Icon, trend, format = 'number', className }: KpiCardProps) {
  const formatValue = () => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percent':
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <Card className={cn("bg-gradient-card border-card-border", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue()}</p>
            {trend !== undefined && (
              <p className={cn(
                "text-xs",
                trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs prev
              </p>
            )}
          </div>
          <div className="p-3 rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignSummaryCards({ kpis, isLoading }: CampaignSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-gradient-card border-card-border">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No performance data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KpiCard
        title="Clicks"
        value={kpis.clicks}
        icon={MousePointer}
        format="number"
      />
      <KpiCard
        title="Conversions"
        value={kpis.conversions}
        icon={Target}
        format="number"
      />
      <KpiCard
        title="Revenue"
        value={kpis.revenue}
        icon={DollarSign}
        format="currency"
      />
      <KpiCard
        title="Profit"
        value={kpis.profit}
        icon={TrendingUp}
        format="currency"
        className={kpis.profit >= 0 ? "" : "border-destructive/50"}
      />
      <KpiCard
        title="Conv. Rate"
        value={kpis.conversionRate}
        icon={Percent}
        format="percent"
      />
      <KpiCard
        title="CPA"
        value={kpis.cpa}
        icon={Calculator}
        format="currency"
      />
    </div>
  );
}
